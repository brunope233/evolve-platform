import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Support } from './support.entity';
import { User } from 'src/users/user.entity';
import { Proof } from 'src/proofs/proof.entity';
import { EventsGateway } from 'src/websockets/events.gateway';
import { NotificationsService } from 'src/notifications/notifications.service';
import { NotificationType } from 'src/notifications/notification.entity';

@Injectable()
export class SupportsService {
  constructor(
    @InjectRepository(Support)
    private supportsRepository: Repository<Support>,
    @InjectRepository(Proof)
    private proofsRepository: Repository<Proof>,
    private readonly eventsGateway: EventsGateway,
    private readonly notificationsService: NotificationsService,
  ) {}

  async toggleSupport(proofId: string, user: User): Promise<{ supported: boolean }> {
    const proof = await this.proofsRepository.findOne({
      where: { id: proofId },
      relations: ['journey', 'journey.user'],
    });
    if (!proof) { throw new NotFoundException(`Prova com ID "${proofId}" não encontrada.`); }

    const existingSupport = await this.supportsRepository.findOne({
      where: {
        proof: { id: proofId },
        user: { id: user.id },
      },
    });

    let supported = false;
    if (existingSupport) {
      await this.supportsRepository.remove(existingSupport);
      supported = false;
    } else {
      const newSupport = this.supportsRepository.create({ user, proof });
      await this.supportsRepository.save(newSupport);
      supported = true;
      
      await this.notificationsService.createNotification({
        recipient: proof.journey.user,
        sender: user,
        type: NotificationType.NEW_SUPPORT,
        journeyId: proof.journey.id,
        proofId: proof.id,
      });
    }

    const newSupportCount = await this.supportsRepository.count({ where: { proof: { id: proofId } } });
    this.eventsGateway.server.emit(`proof:${proofId}:support_updated`, { newSupportCount });
    return { supported };
  }
}