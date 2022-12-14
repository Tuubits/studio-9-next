import React, { useContext, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import GoldenEraLayout from '../components/goldenEraLayout';
import modules from '../module_details.json';
import { Store } from '../utils/Store';


export default function GoldenEraGaming() {
    const router = useRouter();
    const { state, dispatch } = useContext(Store);

    const feature = modules[0]
    const [options, setOptions] = useState(modules.map(i => i.title))
    const [selected, setSelected] = useState(feature.title)

    const handleChange = (value) => {
        setSelected(value)
    }

    const addToCartHandler = (mod) => {
        const existItem = state.cart.cartItems.find((x) => x.slug === mod.slug);
        const quantity = existItem ? existItem.quantity + 1 : 1;
        if(mod.i) {
          dispatch({ type: 'CART_ADD_ITEM', payload: { ...mod.i, quantity } });
        } else if(mod.feature) {
            dispatch({ type: 'CART_ADD_ITEM', payload: { ...mod.feature, quantity } });
        } else {
            dispatch({ type: 'CART_ADD_ITEM', payload: { ...mod, quantity } });
        }

    };

  return (
    <GoldenEraLayout theme={'light'}>
        <select 
            className="select select-accent select-lg mt-4 mb-4 w-full max-w-xs"
            onChange={(e)=>{handleChange(e.currentTarget.value)}}
        >
            <option>Pick a module</option>
            {options.map((i, index) => 
                <option key={index}>{i}</option>    
            )}
        </select>
      <div>
      {selected === feature.title ? 
            <div key={feature.id} className="card sm:card-side bg-base-100 m-4 sm:m-0 sm:mb-4 shadow-xl">
                <figure className='relative h-96 sm:w-full'>
                    <Image
                        src={`${feature.mainImage}`}
                        className='mt-6 sm:mt-0 rounded'
                        alt={feature.title}
                        layout={'fill'}
                        objectFit='cover'
                    />
                </figure>
            <div className="card-body">
                <h2 className="card-title">{feature.title}</h2>
                <p>{feature.details}</p>
                <div className="btn-group btn-group-vertical lg:btn-group-horizontal card-actions justify-end">
                <Link href={`${feature.driveThruLink}`} passHref className='w-full lg:w-2/4'>
                  <button
                    className={`btn-primary w-full items-center rounded-md border-2 border-transparent px-6 py-3 text-lg font-medium shadow-sm focus:outline-none focus:ring-2`}
                  >
                    Purchase PDF Here
                  </button>
                </Link>
                <button
                    className={`${feature.outOfStock ? 'btn-disabled text-gray-700' : 'btn-primary'} w-full lg:w-2/4 items-center rounded-md border-2 border-transparent px-6 py-3 text-lg font-medium shadow-sm focus:outline-none focus:ring-2`}
                    onClick={()=>{addToCartHandler({feature}); router.push('/cart')}}  
                >
                    {feature.outOfStock ? 'Signed Copies Out of Stock': 'Add Signed Copy to Cart'}
                </button>
                </div>
            </div>
        </div>
      :
    modules.filter(j => j.title === selected).map(i => (
            <div key={i.id} className="card sm:card-side bg-base-100 m-4 sm:m-0 sm:mb-4 shadow-xl">
                <figure className='relative h-96 sm:w-full'>
                    <Image
                        src={`${i.mainImage}`}
                        className='mt-6 sm:mt-0 rounded'
                        alt={i.title}
                        layout={'fill'}
                        objectFit='cover'
                    />
                </figure>
            <div className="card-body">
                <h2 className="card-title">{i.title}</h2>
                <p>{i.details}</p>
                <div className="btn-group btn-group-vertical lg:btn-group-horizontal card-actions justify-end">
                <Link href={`${i.driveThruLink}`} passHref className='w-full lg:w-2/4'>
                  <button
                    className={`btn-primary w-full items-center rounded-md border-2 border-transparent px-6 py-3 text-lg font-medium shadow-sm focus:outline-none focus:ring-2`}
                  >
                    Purchase PDF Here
                  </button>
                </Link>
                <button
                    className={`${i.outOfStock ? 'btn-disabled text-gray-700' : 'btn-primary'} w-full lg:w-2/4 items-center rounded-md border-2 border-transparent px-6 py-3 text-lg font-medium shadow-sm focus:outline-none focus:ring-2`}
                    onClick={()=>{addToCartHandler({i}); router.push('/cart')}}  
                >
                    {i.outOfStock ? 'Signed Copies Out of Stock': 'Add Signed Copy to Cart'}
                </button>
                </div>
            </div>
            </div>
        ))}
      </div>
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
        {modules.filter(j => j.title !== selected).map(i => 
            <div key={i.id} className="card bg-base-100 max-w-md shadow-xl">
                <figure className='relative h-96 sm:w-full'>
                    <Image
                        src={`${i.mainImage}`}
                        className='mt-6 sm:mt-0 rounded'
                        alt={i.title}
                        layout={'fill'}
                        objectFit='cover'
                    />
                </figure>
            <div className="card-body">
                <h2 className="card-title">{i.title}</h2>
                <p>{i.details}</p>
                <div className="btn-group btn-group-vertical lg:btn-group-horizontal card-actions justify-end">
                <Link href={`${i.driveThruLink}`} passHref className='w-full'>
                  <button
                    className={`btn-primary w-full items-center rounded-md border-2 border-transparent px-6 py-3 text-lg font-medium shadow-sm focus:outline-none focus:ring-2`}
                  >
                    Purchase PDF Here
                  </button>
                </Link>
                <button
                    className={`${i.outOfStock ? 'btn-disabled text-gray-700' : 'btn-primary'} w-full items-center rounded-md border-2 border-transparent px-6 py-3 text-lg font-medium shadow-sm focus:outline-none focus:ring-2`}
                    onClick={()=>{addToCartHandler({i}); router.push('/cart')}}  
                >
                    {i.outOfStock ? 'Signed Copies Out of Stock': 'Add Signed Copy to Cart'}
                </button>
                </div>
            </div>
            </div>
        )}

      </div>
    </GoldenEraLayout>
  );
}
