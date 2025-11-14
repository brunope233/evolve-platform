/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        // O pathname precisa ser mais genérico para aceitar qualquer bucket
        pathname: `/**`, 
      },
    ],
  },
};

module.exports = nextConfig;