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
        <div className="text-center mt-24">
            <h1 className="text-4xl text-gray-900 sm:text-5xl md:text-6xl"> 
                <span className="block xl:inline  tracking-tight font-extrabold">Thank you!</span>
                <p className="prose-xl mt-24 text-left">Thank you for ordering with Studio 9 Games/Studio 9 Inc. Your support means we can keep making independent products with all the wonder and magic possible. Please allow time for our gnomes to pack up and send your goods. If you have any questions about your order feel free to contact us at: <a href="mailto:studio9inc@mac.com">studio9inc@mac.com</a></p>
            </h1>

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
          <a className="prose-xl link link-hover">About us</a> 
          <a className="prose-xl link link-hover">Contact</a> 
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
