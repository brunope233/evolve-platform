const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const os = require('os');
const fs = require('fs');
const axios = require('axios');
const { Storage } = require('@google-cloud/storage');

const storage = new Storage();
const bucketName = process.env.GCS_BUCKET_NAME;

const api = axios.create({
    baseURL: process.env.API_URL_INTERNAL || 'http://backend:3001/api/v1',
});

const processVideo = async (proofId, videoFilePath) => {
    const bucket = storage.bucket(bucketName);
    const remoteFile = bucket.file(videoFilePath);

    const tempInputPath = path.join(os.tmpdir(), `input-${path.basename(videoFilePath)}`);
    const thumbnailFileName = `${path.parse(videoFilePath).name}.jpg`;
    const tempOutputPath = path.join(os.tmpdir(), thumbnailFileName);
    
    try {
        console.log(`Baixando ${videoFilePath}...`);
        await remoteFile.download({ destination: tempInputPath });

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
        console.log(`✅ Thumbnail gerada: ${tempOutputPath}`);

        const destination = `proofs/thumbnails/${thumbnailFileName}`;
        await bucket.upload(tempOutputPath, {
            destination: destination,
            metadata: { contentType: 'image/jpeg' },
        });
        
        console.log(`Atualizando status da prova ${proofId}.`);
        await api.patch(`/proofs/${proofId}/processed`, {
            status: 'READY',
            thumbnailUrl: destination, // Envia o caminho relativo
        });

    } catch (error) {
        console.error(`❌ Erro no processamento da prova ${proofId}:`, error.message);
        await api.patch(`/proofs/${proofId}/processed`, { status: 'FAILED' });
        throw error;
    } finally {
        if (fs.existsSync(tempInputPath)) fs.unlinkSync(tempInputPath);
        if (fs.existsSync(tempOutputPath)) fs.unlinkSync(tempOutputPath);
    }
};

module.exports = processVideo;