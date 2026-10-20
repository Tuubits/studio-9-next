import { useContext } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Store } from '../utils/Store';

const buttonClasses = 'items-center rounded-md border-2 border-transparent px-6 py-3 text-lg font-medium shadow-sm focus:outline-none focus:ring-2';

// A Golden Era module from lib/catalog.ts, as a side-by-side card (the
// selected module, and the module's own page) or a grid card.
export default function ModuleCard({ product, layout = 'side', featured = false, headingLevel = 'h2', linkTitle = true }) {
  const router = useRouter();
  const { state, dispatch } = useContext(Store);
  const side = layout === 'side';
  const width = side ? 'w-full lg:w-2/4' : 'w-full';
  const Heading = headingLevel;
  const pdfOffer = product.externalOffers.find((o) => o.kind === 'pdf');
  const storeOffer = product.externalOffers.find((o) => o.kind === 'store');
  const outOfStock = product.availability === 'out_of_stock';

  const addToCart = (variant = null) => {
    const id = variant ? variant.id : product.id;
    const existItem = state.cart.cartItems.find((x) => x.slug === id);
    dispatch({
      type: 'CART_ADD_ITEM',
      payload: {
        slug: id,
        name: variant ? `${product.name} (${variant.name})` : product.name,
        price: variant ? variant.price : product.price,
        shippingCost: variant ? variant.shippingCost : product.shippingCost,
        mainImage: product.image,
        category: product.category,
        path: product.path,
        countInStock: 10,
        quantity: existItem ? existItem.quantity + 1 : 1,
      },
    });
    router.push('/cart');
  };

  return (
    <div className={side ? 'card sm:card-side bg-base-100 mb-4 shadow-xl' : 'card bg-base-100 sm:max-w-md shadow-xl'}>
      <figure className={`relative h-96 ${featured ? 'sm:h-auto ' : ''}sm:w-full`}>
        <Image
          src={product.image}
          className='mt-6 sm:mt-0 rounded'
          alt={product.name}
          fill
          style={{ objectFit: 'cover' }}
          sizes={side ? '(min-width: 640px) 50vw, 100vw' : '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw'}
        />
      </figure>
      <div className={side ? 'card-body max-w-[50%] max-sm:max-w-full' : 'card-body'}>
        <Heading className="card-title">
          {linkTitle ? <Link href={product.path}>{product.name}</Link> : product.name}
        </Heading>
        <p>{product.description}</p>
        <div className="btn-group btn-group-vertical lg:btn-group-horizontal card-actions justify-end">
          {product.format === 'digital' ? null : !product.sellDirect && storeOffer ?
            <Link href={storeOffer.url} target="_blank" rel="noreferrer" className={`${width} block text-center btn-secondary text-base-100 ${buttonClasses}`}>
              {storeOffer.label}
            </Link>
          : product.variants.length ?
            product.variants.map((variant) => (
              <button
                key={variant.id}
                className={`btn-primary text-base-100 ${width} ${buttonClasses}`}
                onClick={() => addToCart(variant)}
              >
                Add {variant.name} - ${variant.price.toFixed(2)}
              </button>
            ))
          :
            <button
              className={`${outOfStock ? 'btn-disabled text-gray-700' : 'btn-primary text-base-100'} ${width} ${buttonClasses}`}
              disabled={outOfStock}
              onClick={() => addToCart()}
            >
              {outOfStock ? 'Signed Copies Out of Stock' : 'Add Signed Copy to Cart'}
            </button>
          }
          {pdfOffer ?
            <Link href={pdfOffer.url} target="_blank" rel="noreferrer" className={`${width} block text-center btn-secondary text-base-100 ${buttonClasses}`}>
              {pdfOffer.label}
            </Link>
          : null}
        </div>
      </div>
    </div>
  );
}
