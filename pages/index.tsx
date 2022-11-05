import Head from 'next/head'
import Image from 'next/image'
import { primaryFeatures, secondaryFeatures } from '../components/features';
import { footer } from '../components/navigation';
import { motion } from 'framer-motion';
import headLogo from '../public/s9gamesLOGO_alpha.png';

export default function Home() {
  return (
    <div>
      <Head>
        <title>Studio 9 Inc</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/s9incLOGOsml.png" />
      </Head>

      <main className='mx-auto max-w-7xl pt-8 px-4 sm:pt-12 sm:px-6 lg:px-8'>
        <div>
          <Image
            src={headLogo}
            className={'mx-auto'}
            alt={'Studio 9 Inc'}
            width={450}
            height={450}
          />
        </div>
        <p className="text-2xl py-8 px-8 sm:py-12 sm:px-12 lg:px-16 mx-auto w-full sm:w-4/5">Provident cupiditate voluptatem et in. Quaerat fugiat ut assumenda excepturi exercitationem quasi. In deleniti eaque aut repudiandae et a id nisi.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
        {primaryFeatures.map((i, index) => 
          <motion.div
            key={index}
            className='mx-auto'
            whileHover={{
              position: 'relative',
              zIndex: 1,
            scale: 1.2,
            transition: {
            duration: .2
            }}}
            whileTap={{
              position: 'relative',
              zIndex: 1,
            scale: 1.2,
            transition: {
            duration: .2
            }}}
          >
            <Image
              src={i.image}
              alt={i.title}
              width={450}
              height={450}
            />
          </motion.div>
        )}
        </div>
        <div className='grid grid-cols-2 gap-2 sm:grid-cols-6 sm:gap-4 pt-4'>
        {secondaryFeatures.map((i, index) => 
          <motion.div
            key={index}
            className='mx-auto'
            whileHover={{
              position: 'relative',
              zIndex: 1,
            scale: 1.2,
            transition: {
            duration: .2
            }}}
            whileTap={{
              position: 'relative',
              zIndex: 1,
            scale: 1.2,
            transition: {
            duration: .2
            }}}
          >
            <Image
              src={i.image}
              alt={i.title}
              width={250}
              height={250}
            />
          </motion.div>
        )}
        </div>
      </main>

      <footer className="bg-white pt-8 sm:pt-12">
      <div className="mx-auto max-w-7xl py-12 px-4 sm:px-6 md:flex md:items-center md:justify-between lg:px-8">
        <div className="flex justify-center space-x-6 md:order-2">
          {footer.map((item) => (
            <a key={item.name} href={item.href} className="text-gray-400 hover:text-gray-500">
              <span className="sr-only">{item.name}</span>
              <item.icon className="h-6 w-6" aria-hidden="true" />
            </a>
          ))}
        </div>
        <div className="mt-8 md:order-1 md:mt-0">
          <p className="text-center text-base text-gray-400">&copy; Studio 9 Inc. All rights reserved.</p>
        </div>
      </div>
    </footer>
    </div>
  )
}
