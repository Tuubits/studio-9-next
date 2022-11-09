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
    domains: ['source.unsplash.com', 'app.snipcart.com', 'cdn.snipcart.com'],
    formats: ['image/avif', 'image/webp'],
  },
  env: {
    lightbox: 'E20B-8C81-0A08-930B',
    snipcartPublicTestKey: 'NGJhYzFjZDEtYzMyMC00NmFjLWI1MjItZTVmZmQ1N2M3NDIyNjM4MDM1NTM2NzA4NjgwMDc0' 
  },
};