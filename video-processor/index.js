// index.js
const processVideo = require('./processor');

console.log('🚀 Video Processor iniciado e pronto para o trabalho!');

// --- SIMULAÇÃO DE UMA FILA DE JOBS ---
// Em um sistema real, isso seria um consumidor de uma fila (RabbitMQ, SQS, etc.).
// Por enquanto, vamos simular recebendo um "job" a cada 10 segundos.
// Esta parte será substituída por uma chamada da nossa API principal.
const simulateJobQueue = () => {
  console.log('Aguardando por novos vídeos para processar...');
  // No futuro, aqui teríamos a lógica para buscar "jobs" do banco de dados ou de uma fila.
};

simulateJobQueue();

// Para o nosso caso, vamos expor uma API simples para que o backend principal
// possa nos dizer quando um novo vídeo está pronto.
const express = require('express');
const app = express();
app.use(express.json());

app.post('/process', async (req, res) => {
    const { proofId, videoFileName } = req.body;
    if (!proofId || !videoFileName) {
        return res.status(400).send('proofId e videoFileName são obrigatórios.');
    }

    console.log(`Recebido novo job para a prova: ${proofId}`);
    res.status(202).send('Job recebido. O processamento começará em breve.');

    // Executa o processamento em segundo plano, sem fazer o cliente esperar.
    try {
        await processVideo(proofId, videoFileName);
    } catch (error) {
        console.error(`Falha ao processar a prova ${proofId}:`, error.message);
    }
});

const PORT = 3002;
app.listen(PORT, () => {
    console.log(`Servidor do Video Processor escutando na porta ${PORT}`);
});