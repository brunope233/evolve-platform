import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Proof, ProofStatus } from './proof.entity';
import { User } from 'src/users/user.entity';
import { CreateProofDto } from './dto/create-proof.dto';
import { JourneysService } from 'src/journeys/journeys.service';
import { EventsGateway } from 'src/websockets/events.gateway';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { NotificationsService } from 'src/notifications/notifications.service';
import { NotificationType } from 'src/notifications/notification.entity';
import { UploadService } from 'src/upload/upload.service';
import { extname } from 'path';

@Injectable()
export class ProofsService {
  constructor(
    @InjectRepository(Proof)
    private proofsRepository: Repository<Proof>,
    private journeysService: JourneysService,
    private eventsGateway: EventsGateway,
    private readonly httpService: HttpService,
    private readonly notificationsService: NotificationsService,
    private readonly uploadService: UploadService,
  ) {}

  async create(createProofDto: CreateProofDto, user: User, file: Express.Multer.File): Promise<Proof> {
    const { journeyId, title, description, requestRealTimeSeal, parentProofId } = createProofDto;

    const journey = await this.journeysService.findOneById(journeyId);
    if (!journey) { throw new NotFoundException(`Jornada com ID "${journeyId}" não encontrada.`); }
    
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const videoFileName = `${uniqueSuffix}${extname(file.originalname)}`;
    const destination = `proofs/${videoFileName}`;

    await this.uploadService.uploadFile(file, destination);

    const proofData: Partial<Proof> = {
      title, description, journey, user,
      hasRealTimeSeal: !!requestRealTimeSeal,
      originalVideoUrl: destination, // Salva apenas o caminho relativo
      status: ProofStatus.PROCESSING,
    };
    
    if (parentProofId) {
        const parentProof = await this.proofsRepository.findOne({
            where: { id: parentProofId },
            relations: ['journey', 'journey.user']
        });
        if (!parentProof) { throw new NotFoundException('Prova original não encontrada.'); }
        if (parentProof.journey.user.id === user.id) { throw new ForbiddenException('Você não pode responder à sua própria prova.'); }
        proofData.parentProof = parentProof;
    }

    const newProof = this.proofsRepository.create(proofData);
    const savedProof = await this.proofsRepository.save(newProof);
    
    try {
        await firstValueFrom(
            this.httpService.post('http://video-processor:3002/process', {
                proofId: savedProof.id,
                videoFileName: destination, // Envia o caminho relativo
            })
        );
    } catch (error) { console.error("Falha ao disparar job para o video-processor:", error.message); }

    const fullProofForSocket = await this.proofsRepository.findOne({
        where: { id: savedProof.id },
        relations: ['parentProof', 'user'],
    });
    this.eventsGateway.server.emit(`journey:${journeyId}:proof_added`, fullProofForSocket);
    
    return savedProof;
  }
  
  async updateProofStatus(proofId: string, status: ProofStatus, thumbnailUrl?: string): Promise<void> {
    const proof = await this.proofsRepository.findOne({
        where: { id: proofId },
        relations: ['journey', 'user', 'comments', 'supports', 'assists', 'parentProof'],
    });
    if (!proof) { throw new NotFoundException(`Proof with ID "${proofId}" não encontrada.`); }

    proof.status = status;
    if (thumbnailUrl) { proof.thumbnailUrl = thumbnailUrl; }
    
    const updatedProof = await this.proofsRepository.save(proof);
    this.eventsGateway.server.emit(`proof:${proofId}:updated`, updatedProof);
  }

  async remove(proofId: string, user: User): Promise<void> {
    const proof = await this.proofsRepository.findOne({ where: { id: proofId }, relations: ['journey', 'user'] });
    if (!proof) { throw new NotFoundException(`Prova com ID "${proofId}" não encontrada.`); }
    if (proof.user.id !== user.id) { throw new ForbiddenException('Você não tem permissão para deletar esta prova.'); }

    if (proof.originalVideoUrl) {
        await this.uploadService.deleteFile(proof.originalVideoUrl);
    }
    if (proof.thumbnailUrl) {
        await this.uploadService.deleteFile(proof.thumbnailUrl);
    }

    await this.proofsRepository.delete(proofId);
    this.eventsGateway.server.emit(`journey:${proof.journey.id}:proof_removed`, { proofId });
  }

  async markAsBestAssist(parentProofId: string, assistId: string, user: User): Promise<Proof> {
    const parentProof = await this.proofsRepository.findOne({
      where: { id: parentProofId },
      relations: ['journey', 'journey.user', 'assists', 'comments', 'supports'],
    });

    if (!parentProof) { throw new NotFoundException('O pedido de ajuda original não foi encontrado.'); }
    if (parentProof.journey.user.id !== user.id) { throw new ForbiddenException('Apenas o autor pode marcar a melhor resposta.'); }

    const assistProof = await this.proofsRepository.findOne({ where: { id: assistId }, relations: ['user'] });
    if (!assistProof || !assistProof.user) { throw new NotFoundException('A prova de resposta não foi encontrada.'); }

    const isLegitAssist = parentProof.assists.some(assist => assist.id === assistId);
    if (!isLegitAssist) { throw new BadRequestException('Esta não é uma resposta válida.'); }

    parentProof.bestAssistId = assistId;
    const updatedParentProof = await this.proofsRepository.save(parentProof);

    await this.notificationsService.createNotification({
        recipient: assistProof.user,
        sender: user,
        type: NotificationType.BEST_ASSIST,
        journeyId: parentProof.journey.id,
        proofId: parentProof.id,
    });
    
    this.eventsGateway.server.emit(`proof:${parentProofId}:updated`, updatedParentProof);
    return updatedParentProof;
  }
}