import { useState } from 'react';
import { useRouter } from 'next/router';
import api from '../../lib/api';
import withAuth from '../../components/withAuth'; 
import toast from 'react-hot-toast';

function CreateJourneyPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState(''); // Novo estado para tags
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title || !description) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    // Converte a string de tags em um array
    const tagsArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag);

    const promise = api.post('/journeys', { title, description, tags: tagsArray });

    toast.promise(promise, {
        loading: 'Criando jornada...',
        success: 'Jornada criada com sucesso!',
        error: 'Não foi possível criar a jornada.'
    });

    try {
        const res = await promise;
        setTimeout(() => router.push(`/journey/${res.data.id}`), 1000);
    } catch (err) {
        console.error(err);
    }
  };

  return (
    <div>
      <h1>Inicie uma Nova Jornada</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="title">Título</label>
          <input id="title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <label htmlFor="description">Descrição</label>
          <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)}></textarea>
        </div>
        {/* Novo campo de tags */}
        <div>
          <label htmlFor="tags">Tags (separadas por vírgula)</label>
          <input id="tags" type="text" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Ex: skate, iniciante, manobras" />
        </div>

        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit">Criar Jornada</button>
      </form>
    </div>
  );
}

export default withAuth(CreateJourneyPage);