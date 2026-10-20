import React, { useContext, useState } from 'react';
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
    // Consecutive modules sharing a `group` are collected into one dropdown optgroup
    const [options] = useState(modules.reduce((acc, i) => {
        const last = acc[acc.length - 1]
        if (i.group && last && last.group === i.group) {
            last.titles.push(i.title)
        } else {
            acc.push({ group: i.group, titles: [i.title] })
        }
        return acc
    }, []))
    const [selected, setSelected] = useState(feature.title)

    const handleChange = (value) => {
        setSelected(value)
    }

    const addToCartHandler = (mod, variant = null) => {
        const baseModule = mod.i || mod.feature || mod;
        const cartSlug = variant ? `${baseModule.slug}-${variant.name.toLowerCase()}` : baseModule.slug;
        const existItem = state.cart.cartItems.find((x) => x.slug === cartSlug);
        const quantity = existItem ? existItem.quantity + 1 : 1;

        const cartItem = variant
          ? {
              ...baseModule,
              slug: cartSlug,
              name: `${baseModule.name} (${variant.name})`,
              price: variant.price,
              shippingCost: variant.shippingCost
            }
          : baseModule;

        dispatch({ type: 'CART_ADD_ITEM', payload: { ...cartItem, quantity } });
    };

  return (
    <GoldenEraLayout title={'Golden Era Gaming'}>
        <select
            aria-label="Select a module"
            className="select select-accent select-lg mt-4 mb-4 w-full max-w-xs"
            onChange={(e)=>{handleChange(e.currentTarget.value)}}
        >
            <option>Pick a module</option>
            {options.map((o, index) => o.group ?
                <optgroup key={index} label={o.group} className="font-bold text-warning bg-accent">
                    {o.titles.map(t => <option key={t} className="font-normal text-warning bg-base-100">{t}</option>)}
                </optgroup>
            :
                <option key={index}>{o.titles[0]}</option>
            )}
        </select>
      <div>
      {selected === feature.title ? 
            <div key={feature.id} className="card sm:card-side bg-base-100 mb-4 shadow-xl">
                <figure className='relative h-96 sm:h-auto sm:w-full'>
                    <Image
                        src={`${feature.mainImage}`}
                        className='mt-6 sm:mt-0 rounded'
                        alt={feature.title}
                        fill
                        style={{ objectFit: 'cover' }}
                        sizes="(min-width: 640px) 50vw, 100vw"
                    />
                </figure>
            <div className="card-body max-w-[50%] max-sm:max-w-full">
                <h2 className="card-title">{feature.title}</h2>
                <p>{feature.details}</p>
                <div className="btn-group btn-group-vertical lg:btn-group-horizontal card-actions justify-end">
                {feature.pdfOnly ? null : feature.alternateBuyOptions ?
                  <Link href={`${feature.alternateBuyOptions[0].link}`} target="_blank" rel="noreferrer" className={`w-full lg:w-2/4 block text-center btn-secondary text-base-100 items-center rounded-md border-2 border-transparent px-6 py-3 text-lg font-medium shadow-sm focus:outline-none focus:ring-2`}>
                    {feature.alternateBuyOptions[0].name}
                  </Link>
                : feature.signedCopyOptions ?
                  feature.signedCopyOptions.map((option, idx) => (
                    <button
                      key={idx}
                      className={`btn-primary text-base-100 w-full lg:w-2/4 items-center rounded-md border-2 border-transparent px-6 py-3 text-lg font-medium shadow-sm focus:outline-none focus:ring-2`}
                      onClick={() => { addToCartHandler({ feature }, option); router.push('/cart'); }}
                    >
                      Add {option.name} to Cart
                    </button>
                  ))
                :
                <button
                className={`btn-primary text-base-100 w-full lg:w-2/4 items-center rounded-md border-2 border-transparent px-6 py-3 text-lg font-medium shadow-sm focus:outline-none focus:ring-2`}
                onClick={()=>{addToCartHandler({feature}); router.push('/cart')}}
                >
                     Add Signed Copy to Cart
                </button>
                }
                <Link href={`${feature.driveThruLink}`} target="_blank" rel="noreferrer" className={`w-full lg:w-2/4 block text-center btn-secondary text-base-100 items-center rounded-md border-2 border-transparent px-6 py-3 text-lg font-medium shadow-sm focus:outline-none focus:ring-2`}>
                  Purchase PDF Edition
                </Link>
                </div>
            </div>
        </div>
      :
    modules.filter(j => j.title === selected).map(i => (
            <div key={i.id} className="card sm:card-side bg-base-100 mb-4 shadow-xl">
                <figure className='relative h-96 sm:w-full'>
                    <Image
                        src={`${i.mainImage}`}
                        className='mt-6 sm:mt-0 rounded'
                        alt={i.title}
                        fill
                        style={{ objectFit: 'cover' }}
                        sizes="(min-width: 640px) 50vw, 100vw"
                    />
                </figure>
            <div className="card-body max-w-[50%] max-sm:max-w-full">
                <h2 className="card-title">{i.title}</h2>
                <p>{i.details}</p>
                <div className="btn-group btn-group-vertical lg:btn-group-horizontal card-actions justify-end">
                {i.pdfOnly ? null : i.alternateBuyOptions ?
                  <Link href={`${i.alternateBuyOptions[0].link}`} target="_blank" rel="noreferrer" className={`w-full lg:w-2/4 block text-center btn-secondary text-base-100 items-center rounded-md border-2 border-transparent px-6 py-3 text-lg font-medium shadow-sm focus:outline-none focus:ring-2`}>
                    {i.alternateBuyOptions[0].name}
                  </Link>
                : i.signedCopyOptions ?
                  i.signedCopyOptions.map((option, idx) => (
                    <button
                      key={idx}
                      className={`btn-primary text-base-100 w-full lg:w-2/4 items-center rounded-md border-2 border-transparent px-6 py-3 text-lg font-medium shadow-sm focus:outline-none focus:ring-2`}
                      onClick={() => { addToCartHandler({ i }, option); router.push('/cart'); }}
                    >
                      Add {option.name} - ${option.price.toFixed(2)}
                    </button>
                  ))
                :
                <button
                className={`${i.outOfStock ? 'btn-disabled text-gray-700' : 'btn-primary text-base-100'} w-full lg:w-2/4 items-center rounded-md border-2 border-transparent px-6 py-3 text-lg font-medium shadow-sm focus:outline-none focus:ring-2`}
                onClick={()=>{addToCartHandler({i}); router.push('/cart')}}
                >
                    {i.outOfStock ? 'Signed Copies Out of Stock': 'Add Signed Copy to Cart'}
                </button>
                }
                <Link href={`${i.driveThruLink}`} target="_blank" rel="noreferrer" className={`w-full lg:w-2/4 block text-center btn-secondary text-base-100 items-center rounded-md border-2 border-transparent px-6 py-3 text-lg font-medium shadow-sm focus:outline-none focus:ring-2`}>
                  Purchase PDF Edition
                </Link>
                </div>
            </div>
            </div>
        ))}
      </div>
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
        {modules.filter(j => j.title !== selected).map(i => 
            <div key={i.id} className="card bg-base-100 sm:max-w-md shadow-xl">
                <figure className='relative h-96 sm:w-full'>
                    <Image
                        src={`${i.mainImage}`}
                        className='mt-6 sm:mt-0 rounded'
                        alt={i.title}
                        fill
                        style={{ objectFit: 'cover' }}
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    />
                </figure>
            <div className="card-body">
                <h2 className="card-title">{i.title}</h2>
                <p>{i.details}</p>
                <div className="btn-group btn-group-vertical lg:btn-group-horizontal card-actions justify-end">
                {i.pdfOnly ? null : i.alternateBuyOptions ?
                  <Link href={`${i.alternateBuyOptions[0].link}`} target="_blank" rel="noreferrer" className={`w-full block text-center btn-secondary text-base-100 items-center rounded-md border-2 border-transparent px-6 py-3 text-lg font-medium shadow-sm focus:outline-none focus:ring-2`}>
                    {i.alternateBuyOptions[0].name}
                  </Link>
                : i.signedCopyOptions ?
                  i.signedCopyOptions.map((option, idx) => (
                    <button
                      key={idx}
                      className={`btn-primary text-base-100 w-full items-center rounded-md border-2 border-transparent px-6 py-3 text-lg font-medium shadow-sm focus:outline-none focus:ring-2`}
                      onClick={() => { addToCartHandler({ i }, option); router.push('/cart'); }}
                    >
                      Add {option.name} - ${option.price.toFixed(2)}
                    </button>
                  ))
                :
                <button
                className={`${i.outOfStock ? 'btn-disabled text-gray-700' : 'btn-primary text-base-100'} w-full items-center rounded-md border-2 border-transparent px-6 py-3 text-lg font-medium shadow-sm focus:outline-none focus:ring-2`}
                onClick={()=>{addToCartHandler({i}); router.push('/cart')}}
                >
                    {i.outOfStock ? 'Signed Copies Out of Stock': 'Add Signed Copy to Cart'}
                </button>
                }
                <Link href={`${i.driveThruLink}`} target="_blank" rel="noreferrer" className={`w-full block text-center btn-secondary text-base-100 items-center rounded-md border-2 border-transparent px-6 py-3 text-lg font-medium shadow-sm focus:outline-none focus:ring-2`}>
                  Purchase PDF Edition
                </Link>
                </div>
            </div>
            </div>
        )}

      </div>
    </GoldenEraLayout>
  );
}
