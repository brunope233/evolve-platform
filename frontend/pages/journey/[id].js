import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import styles from '../../styles/JourneyDetail.module.css';
import ProofUploader from '../../components/ProofUploader';
import CommentsSection from '../../components/CommentsSection';
import SupportButton from '../../components/SupportButton';
import Spinner from '../../components/Spinner';
import Tag from '../../components/Tag';
import Link from 'next/link';
import AssistCard from '../../components/AssistCard';
import toast from 'react-hot-toast';
import io from 'socket.io-client';

export default function JourneyDetailPage({ initialJourney }) {
  const [journey, setJourney] = useState(initialJourney);
  const [assistingProofId, setAssistingProofId] = useState(null);
  const { user, isLoggedIn } = useAuth();
  const router = useRouter();

  // URL base para os arquivos de mídia no Google Cloud Storage
  const BUCKET_BASE_URL = 'https://storage.googleapis.com/evolve-platform-uploads-bruno';

  const fetchJourney = useCallback(async () => {
    if (!journey?.id) return;
    try {
      const res = await api.get(`/journeys/${journey.id}`);
      setJourney(res.data);
    } catch (error) {
      console.error("Falha ao buscar dados frescos da jornada:", error);
      toast.error("Não foi possível atualizar a jornada.");
    }
  }, [journey?.id]);

  useEffect(() => {
    if (!journey) return;
    const socket = io(process.env.NEXT_PUBLIC_API_URL.replace('/api/v1', ''));
    
    const newProofEvent = `journey:${journey.id}:proof_added`;
    const proofRemovedEvent = `journey:${journey.id}:proof_removed`;

    const refetchHandler = () => fetchJourney();

    socket.on(newProofEvent, refetchHandler);
    socket.on(proofRemovedEvent, refetchHandler);

    const allProofs = journey.proofs?.flatMap(p => [p, ...(p.assists || [])]) || [];
    const proofUpdateListeners = allProofs.map(proof => {
      const eventName = `proof:${proof.id}:updated`;
      socket.on(eventName, refetchHandler);
      return { eventName, handler: refetchHandler };
    });

    return () => {
      socket.off(newProofEvent, refetchHandler);
      socket.off(proofRemovedEvent, refetchHandler);
      proofUpdateListeners.forEach(({ eventName, handler }) => socket.off(eventName, handler));
      socket.disconnect();
    };
  }, [journey, fetchJourney]);

  const mainProofs = useMemo(() => {
    if (!journey?.proofs) return [];
    return journey.proofs.filter(p => !p.parentProof && p.id);
  }, [journey]);

  if (!journey) { return <div>Jornada não encontrada.</div>; }

  const isOwner = isLoggedIn && user && user.sub === journey.user.id;

  const handleUploadSuccess = () => {
    if (assistingProofId) {
        setAssistingProofId(null);
    }
    // A UI agora espera pelo evento do WebSocket para atualizar
  };

  const handleDeleteProof = async (proofId) => {
    if (!window.confirm('Tem certeza?')) { return; }
    toast.promise(api.delete(`/proofs/${proofId}`), {
        loading: 'Deletando...',
        success: 'Ação enviada!',
        error: 'Falha ao deletar.',
    });
  };

  const handleDeleteJourney = async () => {
    if (!window.confirm('ATENÇÃO: Deletar a jornada e TODAS as provas?')) { return; }
    const promise = api.delete(`/journeys/${journey.id}`);
    toast.promise(promise, {
        loading: 'Deletando jornada...',
        success: 'Jornada deletada!',
        error: 'Não foi possível deletar.'
    });
    try {
        await promise;
        setTimeout(() => router.push('/'), 1500);
    } catch (error) { console.error(error); }
  };

  const handleMarkAsBest = async (parentProofId, assistId) => {
    toast.promise(api.post(`/proofs/${parentProofId}/mark-best/${assistId}`), {
      loading: 'Marcando...',
      success: 'Ação enviada!',
      error: 'Ocorreu um erro.',
    });
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>{journey.title}</h1>
        <Link href={`/profile/${journey.user.username}`} className={styles.authorLink}>
            <p className={styles.author}>por {journey.user.username}</p>
        </Link>
        <p className={styles.description}>{journey.description}</p>
        <div className={styles.tagsContainer}>
            {journey.tags && journey.tags.map(tag => ( <Tag key={tag} tag={tag} /> ))}
        </div>
        <div className={styles.status}>Status: {journey.status}</div>
        {isOwner && (
            <button className={`${styles.deleteButton} ${styles.deleteJourneyButton}`} onClick={handleDeleteJourney}>
                Deletar Jornada Inteira
            </button>
        )}
      </header>
      
      <div className={styles.proofsSection}>
        <h2>Provas da Jornada</h2>
        
        {isOwner && !assistingProofId && (
          <ProofUploader journeyId={journey.id} onUploadSuccess={handleUploadSuccess} />
        )}

        {isLoggedIn && !isOwner && assistingProofId && (
            <ProofUploader 
                journeyId={journey.id} 
                parentProofId={assistingProofId}
                onUploadSuccess={handleUploadSuccess} 
                onCancel={() => setAssistingProofId(null)}
            />
        )}
        
        <div className={styles.proofsGrid}>
          {mainProofs.length > 0 ? (
            mainProofs.map((proof) => (
              <div key={proof.id} className={styles.proofCard}>
                <div className={styles.videoContainer}>
                  {proof.status === 'PROCESSING' && ( <div className={styles.processingOverlay}><Spinner /><p>Processando...</p></div> )}
                  {proof.status === 'FAILED' && ( <div className={styles.processingOverlay}><span className={styles.errorIcon}>⚠️</span><p>Falha no processamento</p></div> )}
                  {proof.status === 'READY' && (
                    <video 
                      key={proof.thumbnailUrl} 
                      className={styles.videoPlayer} 
                      controls 
                      poster={proof.thumbnailUrl ? `${BUCKET_BASE_URL}/${proof.thumbnailUrl}` : ''} 
                      src={`${BUCKET_BASE_URL}/${proof.originalVideoUrl}`}
                    >
                      Seu navegador não suporta vídeos.
                    </video>
                  )}
                  {proof.hasRealTimeSeal && ( <div className={styles.realTimeSeal} title="Prova com Selo RealTime">✔️</div> )}
                </div>

                <div className={styles.proofInfo}>
                  <div className={styles.proofHeader}>
                    <h3>{proof.title || 'Prova sem título'}</h3>
                    <SupportButton proof={proof} />
                  </div>
                  <p>{proof.description}</p>
                  
                  {isLoggedIn && !isOwner && !assistingProofId && (
                    <button className={styles.assistButton} onClick={() => setAssistingProofId(proof.id)}>
                      Ajudar (Assist)
                    </button>
                  )}

                  <small>Status: {proof.status}</small>
                  {isOwner && ( <button className={styles.deleteButton} onClick={() => handleDeleteProof(proof.id)}>Deletar</button> )}
                </div>
                
                <div className={styles.assistsSection}>
                    <h4>Respostas da Comunidade ({proof.assists?.length || 0})</h4>
                    <div className={styles.assistsList}>
                        {proof.assists && proof.assists.sort((a, b) => a.id === proof.bestAssistId ? -1 : b.id === proof.bestAssistId ? 1 : 0).map(assist => (
                            <AssistCard 
                                key={assist.id}
                                assist={assist}
                                isBest={proof.bestAssistId === assist.id}
                                isOwner={isOwner}
                                onMarkAsBest={() => handleMarkAsBest(proof.id, assist.id)}
                            />
                        ))}
                    </div>
                </div>

                <CommentsSection proof={proof} />
              </div>
            ))
          ) : ( <p>Nenhuma prova foi adicionada a esta jornada ainda.</p> )}
        </div>
      </div>
    </div>
  );
}

export async function getServerSideProps(context) {
  try {
    const { id } = context.params;
    const { req } = context;
    const config = req.cookies.token ? { headers: { Authorization: `Bearer ${req.cookies.token}` } } : {};
    const res = await api.get(`/journeys/${id}`, config);
    return { props: { initialJourney: res.data } };
  } catch (error) {
    return { props: { initialJourney: null } };
  }
}