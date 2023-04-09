import { useState, useEffect, useLayoutEffect } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { primaryFeatures, secondaryFeatures } from '../components/features';
import { motion } from 'framer-motion';
import { CldImage } from 'next-cloudinary';
import separator from '../public/bottom_separator.png';
import mobileSeparator from '../public/bottom_separatorSMLsize.png';
import Footer from '../components/footer';

export default function Home() {
  const [query, setQuery] = useState(null);
  const router = useRouter();

  useEffect(() => {
    if(router.components.initial !== true || router.query.message !== undefined) {
      setQuery(router.query);
    }
  }, [router.components]);

  return (
    <div>
      <Head>
        <title>Studio 9 Inc</title>
        <meta name="description" content="A family friendly media company • Creating joy since 2005" />
        <link rel="icon" href="/s9incLOGOsml.png" />
      </Head>

      <main data-theme={'light'} className="mx-auto max-w-7xl pt-8 px-4 sm:pt-12 sm:px-6 lg:px-8">
        <div>
          <Image
            src={'https://res.cloudinary.com/rollfunkydice-com/image/upload/q_auto,f_auto/v1672721304/studio9/s9incLOGO_covCLEAR_kwlbz5.png'}
            className={'mx-auto'}
            alt={'Studio 9 Inc'}
            width={450}
            height={450}
            priority
          />
        </div>
        <p className="prose-xl lg:prose-2xl py-8 px-8 sm:py-12 sm:px-12 lg:px-16 mx-auto text-center w-full sm:w-4/5">
          A family friendly media company • Creating joy since 2005
        </p>
        {router.query.message !== undefined ? 
          <div>
            <p className="prose-xl lg:prose-2xl pb-8 px-6 sm:pb-12 sm:px-12 lg:px-18 mx-auto text-left w-full sm:w-4/5">
            Thank you {router.query.message}, for ordering with Studio 9 Games/Studio 9 Inc. Your support means we can keep making independent products with all the wonder and magic possible. Please allow time for our gnomes to pack up and send your goods. If you have any questions about your order feel free to contact us at: <a className='link link-hover' href="mailto:studio9inc@mac.com">studio9inc@mac.com</a>
            </p>
          </div>
        : null }
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
          {primaryFeatures.map((i, index) => (
            <motion.div
              key={index}
              className="mx-auto"
              whileHover={{
                position: 'relative',
                zIndex: 1,
                scale: 1.2,
                transition: {
                  duration: 0.2,
                },
              }}
              whileTap={{
                position: 'relative',
                zIndex: 1,
                scale: 1.2,
                transition: {
                  duration: 0.2,
                },
              }}
            >
              <Link href={`${i.link}`}>
                <CldImage src={i.image} alt={i.title} width={450} height={450} />
              </Link>
            </motion.div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-6 sm:gap-4 pt-4">
          {secondaryFeatures.map((i, index) => (
            <motion.div
              key={index}
              className="mx-auto"
              whileHover={{
                position: 'relative',
                zIndex: 1,
                scale: 1.2,
                transition: {
                  duration: 0.2,
                },
              }}
              whileTap={{
                position: 'relative',
                zIndex: 1,
                scale: 1.2,
                transition: {
                  duration: 0.2,
                },
              }}
            >
              <Link href={`${i.link}`}>
              <Image src={i.image} alt={i.title} width={250} height={250} />
              </Link>
            </motion.div>
          ))}
        </div>
      </main>
      <div className='relative hidden md:block h-20 mt-24'>
          <Image 
            src={separator}
            alt={'separator'}
            fill
            sizes="100vw" 
          />
      </div>
      <div className='relative md:hidden h-20 mt-24'>
          <Image 
            src={mobileSeparator}
            alt={'separator'}
            fill
            sizes="100vw" 
          />
      </div>
      <Footer />
    </div>
  );
}
