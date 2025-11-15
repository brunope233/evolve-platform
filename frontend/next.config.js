/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Permite que o Next/Image carregue imagens de qualquer domínio.
    // Em um ambiente de produção real com mais segurança, você restringiria isso.
    // Para depurar e fazer funcionar, esta é a melhor opção.
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
      },
    ],
  },
};

module.exports = nextConfig;