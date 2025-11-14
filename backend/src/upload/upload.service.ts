import { Injectable } from '@nestjs/common';
import { Storage } from '@google-cloud/storage';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UploadService {
  private storage: Storage;
  private bucketName: string;

  constructor(private configService: ConfigService) {
    this.storage = new Storage();
    this.bucketName = this.configService.get<string>('GCS_BUCKET_NAME');
  }

  async uploadFile(file: Express.Multer.File, destination: string): Promise<string> {
    if (!this.bucketName) {
        throw new Error('GCS_BUCKET_NAME não está configurado.');
    }
    const bucket = this.storage.bucket(this.bucketName);
    const blob = bucket.file(destination);

    const blobStream = blob.createWriteStream({
      resumable: false,
      contentType: file.mimetype,
    });

    return new Promise((resolve, reject) => {
      blobStream.on('error', (err) => reject(err));
      blobStream.on('finish', () => {
        // Retorna apenas o caminho do arquivo, não a URL completa
        resolve(destination);
      });
      blobStream.end(file.buffer);
    });
  }

  async deleteFile(fileName: string): Promise<void> {
    if (!this.bucketName) {
        console.error('GCS_BUCKET_NAME não configurado, não é possível deletar o arquivo.');
        return;
    }
    try {
      // O fileName já é o caminho completo dentro do bucket
      await this.storage.bucket(this.bucketName).file(fileName).delete();
    } catch (error) {
      // Ignora o erro se o arquivo não for encontrado, pois pode já ter sido deletado
      if (error.code !== 404) {
        console.error(`Falha ao deletar arquivo ${fileName} do GCS:`, error.message);
      }
    }
  }
}