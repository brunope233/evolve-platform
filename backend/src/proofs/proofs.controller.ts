import { Controller, Post, Body, UseGuards, Request, UseInterceptors, UploadedFile, BadRequestException, Delete, Param, Patch } from '@nestjs/common';
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
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, callback) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = extname(file.originalname);
        const filename = `${uniqueSuffix}${ext}`;
        callback(null, filename);
      },
    }),
    fileFilter: (req, file, callback) => {
        if (!file.mimetype.startsWith('video/')) {
            return callback(new BadRequestException('Apenas arquivos de vídeo são permitidos!'), false);
        }
        callback(null, true);
    },
    limits: {
        fileSize: 1024 * 1024 * 100
    }
  }))
  uploadFile(
    @UploadedFile() file: any,
    @Body() body: CreateProofDto,
    @Request() req,
  ) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo recebido pelo controller!');
    }
    
    return this.proofsService.create(body, req.user, file.filename);
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