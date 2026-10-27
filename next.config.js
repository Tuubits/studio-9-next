/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  // A stray package-lock.json higher up the file tree confuses root detection.
  turbopack: { root: __dirname },
  images: {
    loader: 'custom',
    loaderFile: './utils/cloudinaryLoader.js',
    remotePatterns: [{ protocol: 'https', hostname: 'res.cloudinary.com' }],
    formats: ['image/avif', 'image/webp'],
    // The lightbox thumbnails request quality 80; Next 16 only allows 75 by default.
    qualities: [75, 80],
  },
  env: {
    // The PayPal client id is public; expose it to the browser.
    // Netlify and .env call it Paypal_Client_2026; the code reads PAYPAL_CLIENT.
    PAYPAL_CLIENT: process.env.Paypal_Client_2026,
  },
};
