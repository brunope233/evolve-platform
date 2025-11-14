/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Define as variáveis de ambiente que estarão disponíveis tanto no servidor quanto no cliente
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_GCS_URL: process.env.NEXT_PUBLIC_GCS_URL,
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        pathname: `/${process.env.NEXT_PUBLIC_GCS_BUCKET_NAME}/**`,
      },
    ],
  },
};

module.exports = nextConfig;