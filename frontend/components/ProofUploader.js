import { useState } from 'react';
import api from '../lib/api';
import styles from '../styles/ProofUploader.module.css';
import toast from 'react-hot-toast';

const ProofUploader = ({ journeyId, onUploadSuccess, parentProofId, onCancel }) => {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [requestRealTimeSeal, setRequestRealTimeSeal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.type.startsWith('video/')) {
        setError('Por favor, selecione um arquivo de vídeo.');
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Nenhum arquivo de vídeo selecionado.');
      return;
    }

    setIsUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('video', file);
    formData.append('journeyId', journeyId);
    formData.append('title', title);
    formData.append('description', description);
    formData.append('requestRealTimeSeal', requestRealTimeSeal);
    
    // Se for uma resposta, envia o ID da prova "pai"
    if (parentProofId) {
        formData.append('parentProofId', parentProofId);
    }

    try {
      const config = {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        },
      };

      const res = await api.post('/proofs/upload', formData, config);
      
      onUploadSuccess(res.data);
      toast.success(parentProofId ? 'Resposta enviada com sucesso!' : 'Upload da prova concluído!');
      
      // Limpa o formulário
      setFile(null);
      document.getElementById('videoFile').value = '';
      setTitle('');
      setDescription('');
      setRequestRealTimeSeal(false);
      
      // Se for um "assist", chama a função onCancel para fechar o uploader
      if (onCancel) {
        onCancel();
      }
      
    } catch (err) {
      console.error(err);
      const errorMessage = err.response?.data?.message || 'Falha no upload.';
      toast.error(`Erro: ${errorMessage}`);
      setError('Falha no upload. Verifique o console para mais detalhes.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className={styles.uploaderContainer}>
      {onCancel ? (
        <div className={styles.header}>
            <h3>Respondendo a um Pedido de Ajuda</h3>
            <button onClick={onCancel} className={styles.cancelButton}>Cancelar</button>
        </div>
      ) : (
        <h3>Adicionar Nova Prova</h3>
      )}

      <form onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label htmlFor="title">Título (Opcional)</label>
          <input id="title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={parentProofId ? "Ex: Tente desta forma..." : "Ex: Minha primeira braçada"} disabled={isUploading}/>
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="description">Descrição (Opcional)</label>
          <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="O que aconteceu neste vídeo?" disabled={isUploading}></textarea>
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="videoFile">Arquivo de Vídeo</label>
          <input id="videoFile" type="file" accept="video/*" onChange={handleFileChange} disabled={isUploading} />
        </div>
        <div className={styles.checkboxGroup}>
            <input 
                type="checkbox"
                id="realTimeSeal"
                checked={requestRealTimeSeal}
                onChange={(e) => setRequestRealTimeSeal(e.target.checked)}
                disabled={isUploading}
            />
            <label htmlFor="realTimeSeal">Adicionar Selo RealTime</label>
        </div>
        {isUploading && (
            <div className={styles.progressContainer}>
                <p>Enviando... {uploadProgress}%</p>
                <progress value={uploadProgress} max="100" />
            </div>
        )}
        {error && <p className={styles.error}>{error}</p>}
        <button type="submit" disabled={!file || isUploading}>
          {isUploading ? 'Enviando...' : (parentProofId ? 'Enviar Resposta' : 'Enviar Prova')}
        </button>
      </form>
    </div>
  );
};

export default ProofUploader;