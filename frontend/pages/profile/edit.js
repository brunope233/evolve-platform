import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import withAuth from '../../components/withAuth';
import styles from '../../styles/EditProfile.module.css';
import toast from 'react-hot-toast';
import Avatar from '../../components/Avatar';

function EditProfilePage() {
  const [bio, setBio] = useState('');
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && user.username) {
      api.get(`/users/profile/${user.username}`)
        .then(res => {
          setBio(res.data.bio || '');
          setUserProfile(res.data);
          setLoading(false);
        })
        .catch(err => {
          console.error("Erro ao buscar perfil:", err);
          setLoading(false);
        });
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const promise = api.patch('/users/profile', { bio });
    toast.promise(promise, {
      loading: 'Salvando bio...',
      success: 'Bio atualizada com sucesso!',
      error: 'Não foi possível atualizar a bio.',
    });
    try {
      await promise;
      setTimeout(() => router.push(`/profile/${user.username}`), 1000);
    } catch (error) {
      console.error('Falha ao atualizar o perfil:', error);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    const promise = api.post('/users/profile/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    
    toast.promise(promise, {
        loading: 'Enviando novo avatar...',
        success: 'Avatar atualizado! Recarregando...',
        error: 'Não foi possível atualizar o avatar.'
    });

    try {
        await promise;
        // Força um recarregamento completo da página para buscar a nova URL do avatar
        router.reload();
    } catch (error) {
        console.error("Falha no upload do avatar:", error);
    }
  };

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className={styles.container}>
      <h1>Editar Perfil</h1>
      
      <div className={styles.avatarSection}>
        <Avatar user={userProfile} size={120} />
        <label htmlFor="avatarUpload" className={styles.avatarUploadLabel}>
          Mudar Foto
        </label>
        <input 
            id="avatarUpload"
            type="file" 
            accept="image/*"
            onChange={handleAvatarUpload}
            className={styles.avatarUploadInput}
        />
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="bio">Sua Bio</label>
          <textarea
            id="bio"
            className={styles.textarea}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Conte um pouco sobre você e suas jornadas..."
            rows="5"
          ></textarea>
        </div>
        <button type="submit" className={styles.submitButton}>Salvar Bio</button>
      </form>
    </div>
  );
}

export default withAuth(EditProfilePage);