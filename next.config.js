/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images:  {
    loader: 'cloudinary',
    path: 'https://res.cloudinary.com/rollfunkydice-com/image/upload'
  },
}

module.exports = {
  webpack: (config, { isServer }) => {
    if (!isServer) config.resolve.fallback.fs = false;
    return config;
  },
  env: {
    lightbox: 'E20B-8C81-0A08-930B',
  },
};