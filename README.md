# Evolve Platform

**Evolve** é uma plataforma de vídeo social de próxima geração, focada em jornadas de progresso, desafios colaborativos e momentos de autenticidade verificada. É um antídoto para o conteúdo passivo e sintético, celebrando o esforço humano e a narrativa do crescimento pessoal.

## Core Features

*   **Journeys (Jornadas):** Linhas do tempo visuais que documentam o progresso de um usuário em direção a um objetivo.
*   **Proofs (Provas):** Vídeos curtos que servem como marcos ou atualizações dentro de uma Jornada.
*   **Selo RealTime:** Um recurso de verificação opcional que prova a autenticidade de um momento, combatendo deepfakes e conteúdo pré-fabricado.
*   **Desafios Colaborativos:** Jornadas que podem ser concluídas em equipe ou como parte de um desafio comunitário.

## Tech Stack

*   **Frontend:** Next.js (React)
*   **Backend:** NestJS (Node.js, TypeScript)
*   **Database:** PostgreSQL
*   **Video Processing:** FFmpeg (via um microserviço Node.js)
*   **Orchestration:** Docker

## Como Rodar (Ambiente de Desenvolvimento)

1.  Clone este repositório.
2.  Renomeie `.env.example` para `.env` e preencha as variáveis de ambiente.
3.  Execute `docker-compose up --build` na raiz do projeto.
4.  O Frontend estará disponível em `http://localhost:3000`.
5.  O Backend estará disponível em `http://localhost:3001`. 
