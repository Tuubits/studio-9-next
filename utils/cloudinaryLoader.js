// Custom next/image loader: Cloudinary resizes remote images, so Netlify's
// image function (and its sharp dependency) is never used.
export default function cloudinaryLoader({ src, width, quality }) {
  if (src.includes('res.cloudinary.com') && src.includes('/upload/')) {
    const transforms = `f_auto,q_${quality || 'auto'},w_${width},c_limit`;
    return src.replace('/upload/', `/upload/${transforms}/`);
  }
  // Local images are served as-is; the width param only satisfies next/image
  return `${src}?w=${width}`;
}
