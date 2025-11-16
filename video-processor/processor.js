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
    timeout: 10000, // Timeout de 10 segundos
});

// Cliente da IA
const videoClient = new videoIntelligence.v1.VideoIntelligenceServiceClient();

// Função helper para notificar a API com retentativas
const notifyApiWithRetry = async (url, data, retries = 3, delay = 3000) => {
    try {
        console.log(`Tentando notificar a API: PATCH ${url}`);
        await api.patch(url, data);
        console.log("Notificação para a API bem-sucedida!");
    } catch (error) {
        if (retries > 0) {
            console.warn(`Falha ao notificar a API. Tentando novamente em ${delay}ms... (${retries} tentativas restantes)`);
            await new Promise(res => setTimeout(res, delay));
            // Aumenta o delay para a próxima tentativa
            return notifyApiWithRetry(url, data, retries - 1, delay * 1.5);
        } else {
            console.error("ERRO FINAL: Não foi possível notificar a API após várias tentativas.", error.message);
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
        // 1. Baixa o vídeo do GCS
        console.log(`Baixando ${videoFilePath} para arquivo temporário...`);
        await bucket.file(videoFilePath).download({ destination: tempInputPath });

        // 2. Gera a thumbnail
        await new Promise((resolve, reject) => {
            ffmpeg(tempInputPath)
              .on('end', resolve)
              .on('error', reject)
              .screenshots({
                timestamps: ['00:00:01.000'],
                filename: thumbnailFileName,
                folder: os.tmpdir(),
                size: '640x480'
              });
        });
        console.log(`✅ Thumbnail gerada em: ${tempOutputPath}`);

        // 3. Faz o upload da thumbnail para o GCS
        const destination = `proofs/thumbnails/${thumbnailFileName}`;
        await bucket.upload(tempOutputPath, {
            destination: destination,
            metadata: { contentType: 'image/jpeg' },
        });
        console.log(`Thumbnail enviada para: ${destination}`);
        
        // 4. Analisa o vídeo com IA
        console.log(`Analisando rótulos de vídeo para: ${gcsUri}`);
        const request = {
            inputUri: gcsUri,
            features: ['LABEL_DETECTION'],
        };
        const [operation] = await videoClient.annotateVideo(request);
        console.log('Aguardando a análise da IA terminar...');
        const [response] = await operation.promise();

        const labels = response.annotationResults[0].segmentLabelAnnotations
            .map(annotation => annotation.entity.description)
            .slice(0, 5);
        console.log('Tags sugeridas pela IA:', labels);

        // 5. Notifica a API principal com retentativas
        console.log(`Atualizando status da prova ${proofId} para READY.`);
        await notifyApiWithRetry(`/proofs/${proofId}/processed`, {
            status: 'READY',
            thumbnailUrl: destination,
            suggestedTags: labels,
        });

    } catch (error) {
        console.error(`❌ Erro no processamento da prova ${proofId}:`, error.message);
        // Tenta notificar a falha com retentativas
        await notifyApiWithRetry(`/proofs/${proofId}/processed`, { status: 'FAILED' });
        throw error;
    } finally {
        // 6. Limpa os arquivos temporários
        if (fs.existsSync(tempInputPath)) fs.unlinkSync(tempInputPath);
        if (fs.existsSync(tempOutputPath)) fs.unlinkSync(tempOutputPath);
        console.log('Arquivos temporários limpos.');
    }
};

module.exports = processVideo;