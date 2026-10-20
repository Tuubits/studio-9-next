import React, { useContext } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/router';
import ImageGallery from '../../components/imageGallery';
import BookLayout from '../../components/bookLayout';
import { Store } from '../../utils/Store';
import { getProductsByCategory, getSourceRecord } from '../../lib/catalog';
import YouTube from 'react-youtube';

function BookDetails(props){
    const router = useRouter();
    const { state, dispatch } = useContext(Store);

    const addToCartHandler = () => {
        const existItem = state.cart.cartItems.find((x) => x.slug === props.bookDetails.slug);
        const quantity = existItem ? existItem.quantity + 1 : 1;

        dispatch({ type: 'CART_ADD_ITEM', payload: { ...props.bookDetails, quantity } });
        router.push('/cart');
    };

    const opts = {
        width: '100%',
    };

    return (
        <BookLayout title={props.bookDetails.title}>
        <div>
            <Image
                src={`${props.bookDetails.productImage}`}
                className={'mx-auto my-4 sm:my-6'}
                alt={props.bookDetails.title}
                width={400}
                height={200}
            />
        </div>
          <div className="mx-auto max-w-7xl py-4 sm:py-6 lg:py-8 px-4 sm:px-6 lg:px-8">
            <div className="mx-auto grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-6">
            <div className='col-span-4'>
            <p className='prose lg:prose-xl py-2'>{props.bookDetails.details}</p>
            <p className='prose lg:prose-xl py-2'>{props.bookDetails.moreDetails}</p>
            {props.bookDetails.videoLink ? <YouTube videoId={props.bookDetails.videoLink} opts={opts} /> : null }
            </div>
            <div className='col-span-2'>
                <div className='text-center py-4 space-y-4'>
                <p className='prose lg:prose-xl font-bold'>{props.bookDetails.price ? `$${props.bookDetails.price.toFixed(2)}` : null}</p>
                {props.bookDetails.alternateBuyOptions ? 
                    (props.bookDetails.alternateBuyOptions.map((i, index) => 
                    <a key={index}
                        className={`${i.addToCart ? '' : 'btn-secondary'} text-base-100 block px-6 py-3 btn-primary w-full items-center rounded-md border-2 border-transparent text-lg font-medium shadow-sm focus:outline-none focus:ring-2`}
                        href={i.link} target="_blank" rel="noreferrer"
                    >
                            {i.name}</a>
                    ))
                :
                <button
                className={`${props.bookDetails.outOfStock ? 'btn-disabled text-gray-700' : 'btn-primary'} w-full items-center rounded-md border-2 border-transparent px-6 py-3 text-lg font-medium shadow-sm focus:outline-none focus:ring-2`}
                onClick={props.bookDetails.outOfStock ? null : addToCartHandler}
                >
                {props.bookDetails.outOfStock ? 'Out of Stock': 'Add to cart'}
                </button>
                }
            </div>
            <div className='pl-4 py-4'>
            <ImageGallery images={props.bookDetails.sideImages} />
            </div>
            <div className='prose lg:prose-xl pl-4 py-4'>
            {props.bookDetails.reviews ?
            <h2>Reviews</h2>
            : null}
            {props.bookDetails.reviews ?
                 props.bookDetails.reviews.map((i, index) => (
                    <div key={index}>
                    <p className=' font-bold -mb-10'>{i.review}</p>
                    {i.link ? 
                    <p className='font-medium'><a className="text-gray-600" href={i.link} target="_blank" rel="noreferrer">{i.src}</a></p>
                    :
                    <p className='font-medium'>{i.src}</p>
                    }
                    </div>
                )) : null}
            </div>
            </div>

            </div>
          </div>
        </BookLayout>
    )
}

export async function getStaticProps({ params }) {
    return {
        props: {
            bookDetails: getSourceRecord('books', params.bookId)
        },
    };
}

export async function getStaticPaths() {
    return {
        paths: getProductsByCategory('books').map((p) => ({ params: { bookId: p.id } })),
        fallback: false
    }
}

export default BookDetails
