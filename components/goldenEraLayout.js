import React, { useContext, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCartIcon } from '@heroicons/react/24/outline'
import gamesLogo from '../public/s9gamesLOGOclearSML.png'
import separator from '../public/bottom_separator.png';
import mobileSeparator from '../public/bottom_separatorSMLsize.png';
import { Store } from '../utils/Store';
import Footer from './footer';

export default function GoldenEraLayout({children}) {
  const { state } = useContext(Store);
  const { cart } = state;
  const [cartItemsCount, setCartItemsCount] = useState(0);
  useEffect(() => {
    setCartItemsCount(cart.cartItems.reduce((a, c) => a + c.quantity, 0));
  }, [cart.cartItems]);
    return(
        <div data-theme={'studio9'} className='bg-stone-400'>
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
          <div className='m-6'>
          <Link href="/cart" className='p-10'>         
          {cart.cartItems.length > 0 && 
                  (cartItemsCount > 0 && (
                    <span className="ml-2 -mb-2 rounded-full bg-accent px-2 py-1 text-xs font-bold text-black">
                      {cartItemsCount}
                    </span>
                  ))}        
                <ShoppingCartIcon />
              </Link>
          </div>
      </div>
        {children}
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
    </div>
    )
}