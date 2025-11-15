const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const os = require('os');
const fs = require('fs');
const axios = require('axios');
const { Storage } = require('@google-cloud/storage');
const videoIntelligence = require('@google-cloud/video-intelligence'); // IMPORTAR IA

const storage = new Storage();
const bucketName = process.env.GCS_BUCKET_NAME;

const api = axios.create({
    baseURL: process.env.API_URL_INTERNAL || 'http://backend:3001/api/v1',
});

// Cria um cliente para a Video Intelligence API
const videoClient = new videoIntelligence.v1.VideoIntelligenceServiceClient();

const processVideo = async (proofId, videoFilePath) => {
    const bucket = storage.bucket(bucketName);
    const gcsUri = `gs://${bucketName}/${videoFilePath}`; // A IA funciona melhor com o URI do GCS

    const tempInputPath = path.join(os.tmpdir(), `input-${path.basename(videoFilePath)}`);
    const thumbnailFileName = `${path.parse(videoFilePath).name}.jpg`;
    const tempOutputPath = path.join(os.tmpdir(), thumbnailFileName);
    
    try {
        // --- 1. Geração de Thumbnail (lógica que já tínhamos) ---
        await bucket.file(videoFilePath).download({ destination: tempInputPath });
        await new Promise((resolve, reject) => {
            ffmpeg(tempInputPath)
              .on('end', resolve).on('error', reject)
              .screenshots({ timestamps: ['00:00:01'], filename: thumbnailFileName, folder: os.tmpdir(), size: '640x480' });
        });
        const thumbDestination = `proofs/thumbnails/${thumbnailFileName}`;
        await bucket.upload(tempOutputPath, { destination: thumbDestination });
        const thumbnailUrl = `https://storage.googleapis.com/${bucketName}/${thumbDestination}`;
        
        // --- 2. Análise de Rótulos com IA (A Nova Mágica) ---
        console.log(`Analisando rótulos de vídeo para: ${gcsUri}`);
        const request = {
            inputUri: gcsUri,
            features: ['LABEL_DETECTION'],
        };
        const [operation] = await videoClient.annotateVideo(request);
        console.log('Aguardando a análise da IA terminar...');
        const [response] = await operation.promise();

        // Extrai os rótulos mais relevantes
        const labels = response.annotationResults[0].segmentLabelAnnotations
            .map(annotation => annotation.entity.description)
            .slice(0, 5); // Pega as 5 tags mais prováveis
        console.log('Tags sugeridas pela IA:', labels);

        // --- 3. Atualização Final ---
        console.log(`Atualizando status da prova ${proofId} para READY.`);
        await api.patch(`/proofs/${proofId}/processed`, {
            status: 'READY',
            thumbnailUrl: thumbDestination,
            suggestedTags: labels, // Envia as tags para o backend
        });

    } catch (error) {
        console.error(`❌ Erro no processamento da prova ${proofId}:`, error);
        await api.patch(`/proofs/${proofId}/processed`, { status: 'FAILED' });
        throw error;
    } finally {
        if (fs.existsSync(tempInputPath)) fs.unlinkSync(tempInputPath);
        if (fs.existsSync(tempOutputPath)) fs.unlinkSync(tempOutputPath);
    }
};

module.exports = processVideo;