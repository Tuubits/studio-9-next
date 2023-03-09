import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { primaryFeatures, secondaryFeatures } from '../components/features';
import { motion } from 'framer-motion';
import { CldImage } from 'next-cloudinary';
import separator from '../public/bottom_separator.png';
import mobileSeparator from '../public/bottom_separatorSMLsize.png';

export default function Home() {
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
      <footer className="footer footer-center pt-2 pb-10 text-base-content rounded">
        <div className="grid grid-flow-col gap-4">
          <a className="prose-xl link link-hover link-warning">About us</a> 
          <a className="prose-xl link link-hover link-secondary">Contact</a> 
        </div> 
        <div>
          <div className="grid grid-flow-col gap-4">
            <a><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" className="fill-current"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"></path></svg></a> 
            <a><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" className="fill-current"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"></path></svg></a> 
            <a><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" className="fill-current"><path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"></path></svg></a>
          </div>
        </div> 
        <div>
          <p className='prose-xl'>Copyright © {(new Date().getFullYear())} - All right reserved by Studio 9 Inc</p>
        </div>
      </footer>
    </div>
  );
}
