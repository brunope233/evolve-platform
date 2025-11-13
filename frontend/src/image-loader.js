'use client';

// Este é o nosso "loader" personalizado.
// Ele simplesmente recebe o 'src' da imagem e o retorna sem modificação.
export default function customImageLoader({ src }) {
  return src;
}