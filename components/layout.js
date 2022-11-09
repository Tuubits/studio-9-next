import Image from 'next/image';
import Link from 'next/link';
import useSnipcartCount from "../lib/useSnipcartCount";
import gamesLogo from '../public/s9gamesLOGOclearSML.png'

export default function Layout({children}) {
    const { cart } = useSnipcartCount();
    const cartHasItems = cart.items.count !== 0;
    return(
        <div className="mx-auto max-w-7xl py-4 sm:py-6 lg:py-8 px-4 sm:px-6 lg:px-8">
        <div className='flex justify-between'>
          <div>
              <Link href={'/'}>
              <Image
                  src={gamesLogo}
                  className={'text-left'}
                  alt={'Studio 9 Games'}
                  width={150}
                  height={150}
              />
              </Link>
          </div>
          <div className='pt-12'>
              <button
              className="snipcart-checkout appearance-none px-2 text-gray-800 hover:text-yellow-600 rounded-md cursor-pointer focus:outline-none focus:text-yellow-600 transition relative"
              aria-label="Cart"
              >
              {cartHasItems && (
                  <span className="absolute bg-yellow-600 rounded-full w-2 h-2 top-0 right-0 -mt-1 -mr-1"></span>
              )}
              <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  className="w-6 h-6 fill-current"
              >
                  <path fill="none" d="M0 0h24v24H0z" />
                  <path d="M4 16V4H2V2h3a1 1 0 0 1 1 1v12h12.438l2-8H8V5h13.72a1 1 0 0 1 .97 1.243l-2.5 10a1 1 0 0 1-.97.757H5a1 1 0 0 1-1-1zm2 7a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm12 0a2 2 0 1 1 0-4 2 2 0 0 1 0 4z" />
              </svg>
              </button>
          </div>
      </div>
        {children}
    </div>
    )
}