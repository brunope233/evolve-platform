const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const os = require('os');
const fs = require('fs');
const axios = require('axios');
const { Storage } = require('@google-cloud/storage');

const storage = new Storage();
const bucketName = process.env.GCS_BUCKET_NAME; // Vamos ler o nome do bucket das variáveis de ambiente

const api = axios.create({
    baseURL: 'http://backend:3001/api/v1',
});

const processVideo = async (proofId, videoFilePath) => {
    const bucket = storage.bucket(bucketName);
    const remoteFile = bucket.file(videoFilePath);

    const tempInputPath = path.join(os.tmpdir(), `input-${proofId}`);
    const thumbnailFileName = `${path.parse(videoFilePath).name}.jpg`;
    const tempOutputPath = path.join(os.tmpdir(), thumbnailFileName);
    
    try {
        // 1. Baixa o vídeo do GCS para um arquivo temporário
        console.log(`Baixando ${videoFilePath} para ${tempInputPath}...`);
        await remoteFile.download({ destination: tempInputPath });
        console.log('Download concluído.');

        // 2. Gera a thumbnail usando FFmpeg
        await new Promise((resolve, reject) => {
            ffmpeg(tempInputPath)
              .on('end', resolve)
              .on('error', reject)
              .screenshots({
                timestamps: ['00:00:01'],
                filename: thumbnailFileName,
                folder: os.tmpdir(),
                size: '640x480'
              });
        });
        console.log(`✅ Thumbnail gerada em ${tempOutputPath}`);

        // 3. Faz o upload da thumbnail de volta para o GCS
        const destination = `proofs/thumbnails/${thumbnailFileName}`;
        await bucket.upload(tempOutputPath, {
            destination: destination,
            metadata: { contentType: 'image/jpeg' },
        });
        console.log(`Thumbnail enviada para ${destination}`);
        const thumbnailUrl = `https://storage.googleapis.com/${bucketName}/${destination}`;
        
        // 4. Notifica a API principal que o processamento terminou
        console.log(`Atualizando status da prova ${proofId} para READY.`);
        await api.patch(`/proofs/${proofId}/processed`, {
            status: 'READY',
            thumbnailUrl: thumbnailUrl, // Envia a URL pública completa
        });
        console.log(`Status da prova ${proofId} atualizado.`);

    } catch (error) {
        console.error(`❌ Erro no processamento da prova ${proofId}:`, error.message);
        // Notifica a API que o processamento falhou
        await api.patch(`/proofs/${proofId}/processed`, { status: 'FAILED' });
        throw error;
    } finally {
        // 5. Limpa os arquivos temporários
        if (fs.existsSync(tempInputPath)) fs.unlinkSync(tempInputPath);
        if (fs.existsSync(tempOutputPath)) fs.unlinkSync(tempOutputPath);
        console.log('Arquivos temporários limpos.');
    }
};

module.exports = processVideo;