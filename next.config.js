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
    domains: ['source.unsplash.com'],
    formats: ['image/avif', 'image/webp'],
  },
  env: {
    lightbox: 'E20B-8C81-0A08-930B',
  },
};