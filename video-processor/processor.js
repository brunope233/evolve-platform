const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const os = require('os');
const fs = require('fs');
const axios = require('axios');
const { Storage } = require('@google-cloud/storage');
const videoIntelligence = require('@google-cloud/video-intelligence');

const storage = new Storage();
const bucketName = process.env.GCS_BUCKET_NAME;

const api = axios.create({
    baseURL: process.env.API_URL_INTERNAL || 'http://backend:3001/api/v1',
    timeout: 15000,
});

const videoClient = new videoIntelligence.v1.VideoIntelligenceServiceClient();

const notifyApiWithRetry = async (url, data, retries = 3, delay = 3000) => {
    try {
        await api.patch(url, data);
        console.log(`Notificação para a API em ${url} bem-sucedida!`);
    } catch (error) {
        if (retries > 0) {
            console.warn(`Falha ao notificar a API. Tentando novamente em ${delay}ms...`);
            await new Promise(res => setTimeout(res, delay));
            return notifyApiWithRetry(url, data, retries - 1, delay * 1.5);
        } else {
            console.error(`ERRO FINAL: Não foi possível notificar a API em ${url}.`, error.message);
            throw error;
        }
    }
};

const processVideo = async (proofId, videoFilePath) => {
    const bucket = storage.bucket(bucketName);
    const gcsUri = `gs://${bucketName}/${videoFilePath}`;
    const tempInputPath = path.join(os.tmpdir(), `input-${path.basename(videoFilePath)}`);
    const thumbnailFileName = `${path.parse(videoFilePath).name}.jpg`;
    const tempOutputPath = path.join(os.tmpdir(), thumbnailFileName);
    
    try {
        await bucket.file(videoFilePath).download({ destination: tempInputPath });

        await new Promise((resolve, reject) => {
            ffmpeg(tempInputPath).on('end', resolve).on('error', reject)
              .screenshots({ timestamps: ['00:00:01.000'], filename: thumbnailFileName, folder: os.tmpdir(), size: '640x480' });
        });
        
        const thumbDestination = `proofs/thumbnails/${thumbnailFileName}`;
        await bucket.upload(tempOutputPath, { destination: thumbDestination });
        
        const request = { inputUri: gcsUri, features: ['LABEL_DETECTION'] };
        const [operation] = await videoClient.annotateVideo(request);
        const [response] = await operation.promise();

        const labels = response.annotationResults[0].segmentLabelAnnotations
            .map(annotation => annotation.entity.description.toLowerCase())
            .slice(0, 5);
        
        console.log('Rótulos da IA encontrados:', labels);

        await notifyApiWithRetry(`/proofs/${proofId}/processed`, {
            status: 'READY',
            thumbnailUrl: thumbDestination,
            suggestedTags: labels,
            aiLabels: labels,
        });

    } catch (error) {
        console.error(`❌ Erro no processamento da prova ${proofId}:`, error);
        await notifyApiWithRetry(`/proofs/${proofId}/processed`, { status: 'FAILED' });
        throw error;
    } finally {
        if (fs.existsSync(tempInputPath)) fs.unlinkSync(tempInputPath);
        if (fs.existsSync(tempOutputPath)) fs.unlinkSync(tempOutputPath);
    }
};

module.exports = processVideo;