// processor.js
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const axios = require('axios');

// Configura o Axios para falar com a API principal.
// Usamos o nome do serviço 'backend' como hostname, pois estamos dentro da rede Docker.
const api = axios.create({
    baseURL: 'http://backend:3001/api/v1',
});

const processVideo = (proofId, videoFileName) => {
  return new Promise((resolve, reject) => {
    const inputPath = path.join(__dirname, 'uploads', videoFileName);
    const thumbnailFileName = `${path.parse(videoFileName).name}.jpg`;
    const outputPath = path.join(__dirname, 'uploads', 'thumbnails', thumbnailFileName);
    const thumbnailUrl = `uploads/thumbnails/${thumbnailFileName}`;

    console.log(`Iniciando geração de thumbnail para: ${inputPath}`);

    ffmpeg(inputPath)
      .on('end', async () => {
        console.log(`✅ Thumbnail gerada com sucesso: ${outputPath}`);
        try {
          // Notifica a API principal que o processamento terminou
          console.log(`Atualizando status da prova ${proofId} para READY.`);
          await api.patch(`/proofs/${proofId}/processed`, {
            status: 'READY',
            thumbnailUrl: thumbnailUrl,
          });
          console.log(`Status da prova ${proofId} atualizado.`);
          resolve();
        } catch (error) {
          console.error('Erro ao notificar a API principal:', error.response?.data || error.message);
          reject(error);
        }
      })
      .on('error', (err) => {
        console.error(`❌ Erro no FFmpeg: ${err.message}`);
        // TODO: Notificar a API principal que o processamento FALHOU
        reject(err);
      })
      .screenshots({
        timestamps: ['00:00:01'],
        filename: thumbnailFileName,
        folder: path.join(__dirname, 'uploads', 'thumbnails'),
        size: '320x240'
      });
  });
};

module.exports = processVideo;