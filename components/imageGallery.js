import { useState } from 'react';
import Image from 'next/image';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';

// Grid of product side images; clicking one opens it in a full-screen lightbox.
export default function ImageGallery({ images }) {
  const [index, setIndex] = useState(-1);

  return (
    <>
      <div className={`container grid ${images.length < 2 ? 'grid-cols-1' : 'grid-cols-2'} gap-2 mx-auto`}>
        {images.map((image, i) => (
          <button key={i} type="button" className="cursor-zoom-in" aria-label={`Enlarge ${image.alt}`} onClick={() => setIndex(i)}>
            <Image src={image.src} alt={image.alt} height={300} width={300} quality={80} />
          </button>
        ))}
      </div>
      <Lightbox
        open={index >= 0}
        index={index}
        close={() => setIndex(-1)}
        slides={images.map(({ src, alt }) => ({ src, alt }))}
      />
    </>
  );
}
