import { useState, useEffect } from 'react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import styles from '../styles/Comments.module.css';
import toast from 'react-hot-toast';
import io from 'socket.io-client';
import Avatar from './Avatar';
import Link from 'next/link'; // MUDANÇA 1: Importar o Link

// Componente auxiliar para renderizar um único comentário
const Comment = ({ comment, loggedInUser, onDelete }) => {
    const [formattedDate, setFormattedDate] = useState('');

    useEffect(() => {
        if (comment && comment.createdAt) {
            setFormattedDate(new Date(comment.createdAt).toLocaleString());
        }
    }, [comment]);

    if (!comment || !comment.user) {
        return null;
    }

    const isOwner = loggedInUser && loggedInUser.sub === comment.user.id;

    return (
        <div className={styles.comment}>
            {/* MUDANÇA 2: Envolver o Avatar em um Link para o perfil */}
            <Link href={`/profile/${comment.user.username}`} className={styles.avatarContainer}>
                <Avatar user={comment.user} size={35} />
            </Link>
            <div className={styles.commentBody}>
                <div className={styles.commentHeader}>
                    {/* MUDANÇA 3: Envolver o nome de usuário em um Link para o perfil */}
                    <Link href={`/profile/${comment.user.username}`} className={styles.usernameLink}>
                        <strong>{comment.user.username}</strong>
                    </Link>
                    {isOwner && (
                        <button className={styles.deleteCommentBtn} onClick={() => onDelete(comment.id)}>
                            &times;
                        </button>
                    )}
                </div>
                <p>{comment.content}</p>
                <span className={styles.commentDate}>
                    {formattedDate}
                </span>
            </div>
        </div>
    );
};


// O resto do componente CommentsSection continua exatamente o mesmo
const CommentsSection = ({ proof }) => {
  const [comments, setComments] = useState(proof.comments || []);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user: loggedInUser, isLoggedIn } = useAuth();

  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_API_URL.replace('/api/v1', ''));
    const newCommentEvent = `proof:${proof.id}:new_comment`;
    const deleteCommentEvent = `proof:${proof.id}:comment_deleted`;

    socket.on(newCommentEvent, (newCommentFromServer) => {
        setComments((prevComments) => {
            if (prevComments.find(c => c.id === newCommentFromServer.id)) { return prevComments; }
            return [...prevComments, newCommentFromServer];
        });
    });

    socket.on(deleteCommentEvent, ({ commentId }) => {
        toast('Um comentário foi removido.', { icon: '🗑️' });
        setComments((prevComments) => prevComments.filter(c => c.id !== commentId));
    });

    return () => {
        socket.off(newCommentEvent);
        socket.off(deleteCommentEvent);
        socket.disconnect();
    };
  }, [proof.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setIsSubmitting(true);
    try {
      await api.post(`/proofs/${proof.id}/comments`, { content: newComment });
      setNewComment('');
    } catch (error) {
      console.error('Falha ao adicionar comentário:', error);
      toast.error('Não foi possível adicionar o comentário.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Deletar este comentário?')) return;
    
    try {
        await api.delete(`/comments/${commentId}`);
    } catch (error) {
        console.error('Falha ao deletar comentário:', error);
        toast.error('Não foi possível deletar o comentário.');
    }
  };

  return (
    <div className={styles.commentsWrapper}>
      <div className={styles.commentsList}>
        {comments.length > 0 ? (
          comments.map(comment => (
            <Comment 
              key={comment.id} 
              comment={comment} 
              loggedInUser={loggedInUser} 
              onDelete={handleDeleteComment}
            />
          ))
        ) : (
          <p className={styles.noComments}>Seja o primeiro a comentar!</p>
        )}
      </div>
      
      {isLoggedIn && (
        <form onSubmit={handleSubmit} className={styles.commentForm}>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Adicionar um comentário..."
            disabled={isSubmitting}
          />
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Enviando...' : 'Enviar'}
          </button>
        </form>
      )}
    </div>
  );
};

export default CommentsSection;