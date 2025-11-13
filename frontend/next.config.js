/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Esta configuração diz ao Next.js para não tentar otimizar as imagens
    // que são URLs absolutas. Ele simplesmente as passará direto para o src.
    loader: 'custom',
    loaderFile: './src/image-loader.js',
  },
};

module.exports = nextConfig;