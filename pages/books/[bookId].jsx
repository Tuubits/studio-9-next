import React, { useContext, useEffect } from 'react';
import fs from 'fs'
import path from 'path'
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import 'lightbox.js-react/dist/index.css'
import {SlideshowLightbox, initLightboxJS} from 'lightbox.js-react'
import BookLayout from '../../components/bookLayout';
import { Store } from '../../utils/Store';
import YouTube from 'react-youtube';

function getBookDetails(props){
    useEffect(() => {
        initLightboxJS(`${process.env.lightbox}`, 'team');
    });

    const router = useRouter();
    const { state, dispatch } = useContext(Store);

    const addToCartHandler = () => {
        const existItem = state.cart.cartItems.find((x) => x.slug === props.bookDetails.slug);
        const quantity = existItem ? existItem.quantity + 1 : 1;

        dispatch({ type: 'CART_ADD_ITEM', payload: { ...props.bookDetails, quantity } });
        router.push('/cart');
    };

    const onPlayerReady = (event) => {
        // access to player in all event handlers via event.target
        event.target.pauseVideo();
    }

    const opts = {
        width: '100%',
        playerVars: {
        // https://developers.google.com/youtube/player_parameters
        autoplay: 1,
        },
    };

    return (
        <BookLayout>
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
            {props.bookDetails.videoLink ? <YouTube videoId={props.bookDetails.videoLink} opts={opts} onReady={onPlayerReady} /> : null }
            </div>
            <div className='col-span-2'>
                <div className='text-center py-4'>
                {props.bookDetails.bookLink ? 
                <Link href={`${props.bookDetails.bookLink}`} passHref>
                <button
                className={`${props.bookDetails.outOfStock ? 'btn-disabled text-gray-700' : 'btn-primary'} w-full items-center rounded-md border-2 border-transparent px-6 py-3 text-lg font-medium shadow-sm focus:outline-none focus:ring-2`}
                >
                PURCHASE HERE
                </button>
                </Link>
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
            <SlideshowLightbox className={`container grid ${ props.bookDetails.sideImages.length < 2 ? 'grid-cols-1' : 'grid-cols-2'} gap-2 mx-auto`} theme='lightbox' lightboxIdentifier="lightbox1" framework="next" images={props.bookDetails.sideImages}>
                    {props.bookDetails.sideImages.map((image, index) => (
                        <Image
                            key={index}
                            src={image.src}
                            alt={image.alt}
                            height={300}
                            width={300}
                            data-lightboxjs="lightbox1"
                            quality={80}
                        />
                    ))}
            </SlideshowLightbox>
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
                    <p className='font-medium'><a className="text-gray-600" href={i.link}>{i.src}</a></p>
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

export async function getStaticProps(context) {
    const { params } = context
    const bookId = params.bookId
    const fileToRead = path.join(process.cwd(), 'book_details.json')
    const data = JSON.parse(await fs.readFileSync(fileToRead))
    const book = data.books.find(book => book.id === bookId)
    return {
        props: {
            bookDetails: book
        },
    };
}

export async function getStaticPaths() {
    return {
        paths: [
            {  params: { bookId: 'dottie-and-me-activity-book' } },
            {  params: { bookId: 'blessed-is-the-spot' } },
            {  params: { bookId: 'sweet-neighbors-come-in-all-colors' } },
            {  params: { bookId: 'zanjan' } },
        ],
        fallback: false
    }
}

export default getBookDetails
