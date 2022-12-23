/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
}

module.exports = {
  webpack: (config, { isServer }) => {
    if (!isServer) config.resolve.fallback.fs = false;
    return config;
  },
  images: {
    domains: ['placeimg.com', 'source.unsplash.com', 'res.cloudinary.com'],
    formats: ['image/avif', 'image/webp'],
  },
  env: {
    lightbox: 'E20B-8C81-0A08-930B',
    PAYPAL_CLIENT: `${process.env.PAYPAL_CLIENT}`
  },
};