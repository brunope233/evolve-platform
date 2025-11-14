/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // A configuração de imagens para domínios externos ainda é necessária
  images: {
    remotePatterns: [
      {
        protocol: 'https', // Use https para produção
        hostname: 'storage.googleapis.com', // O hostname real do GCS
        pathname: '/evolve-platform-uploads-bruno/**', // O nome do seu bucket
      },
    ],
  },
};

module.exports = nextConfig;