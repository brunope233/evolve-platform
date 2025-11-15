import { Controller, Post, Body, UseGuards, Request, UseInterceptors, UploadedFile, BadRequestException, Delete, Param, Patch, ValidationPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ProofsService } from './proofs.service';
import { CreateProofDto } from './dto/create-proof.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ProofStatus } from './proof.entity';

@Controller('proofs')
export class ProofsController {
  constructor(private readonly proofsService: ProofsService) {}

  @Post('upload')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FileInterceptor('video', {
    limits: { fileSize: 1024 * 1024 * 100 }, // 100MB
    fileFilter: (req, file, callback) => {
        if (!file.mimetype.startsWith('video/')) {
            return callback(new BadRequestException('Apenas arquivos de vídeo são permitidos!'), false);
        }
        callback(null, true);
    },
  }))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
    @Request() req,
  ) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo de vídeo recebido!');
    }

    // Validação Manual para lidar com FormData
    const createProofDto = new CreateProofDto();
    createProofDto.journeyId = body.journeyId;
    createProofDto.title = body.title;
    createProofDto.description = body.description;
    createProofDto.parentProofId = body.parentProofId;
    createProofDto.requestRealTimeSeal = body.requestRealTimeSeal === 'true';

    const validationPipe = new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true });
    try {
      const validatedDto = await validationPipe.transform(createProofDto, { type: 'body', metatype: CreateProofDto });
      return this.proofsService.create(validatedDto, req.user, file);
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  remove(@Param('id') id: string, @Request() req) {
    return this.proofsService.remove(id, req.user);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':parentProofId/mark-best/:assistId')
  markAsBestAssist(
    @Param('parentProofId') parentProofId: string,
    @Param('assistId') assistId: string,
    @Request() req,
  ) {
    return this.proofsService.markAsBestAssist(parentProofId, assistId, req.user);
  }

  @Patch(':id/processed')
  updateProofStatus(
    @Param('id') id: string,
    @Body() body: { status: ProofStatus, thumbnailUrl?: string }
  ) {
    return this.proofsService.updateProofStatus(id, body.status, body.thumbnailUrl);
  }
}