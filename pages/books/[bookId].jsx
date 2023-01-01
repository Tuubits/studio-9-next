import React, { useContext, useEffect } from 'react';
import fs from 'fs'
import path from 'path'
import Image from 'next/image';
import { useRouter } from 'next/router';
import 'lightbox.js-react/dist/index.css'
import {SlideshowLightbox, initLightboxJS} from 'lightbox.js-react'
import BookLayout from '../../components/bookLayout';
import { Store } from '../../utils/Store';

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
            {/* <h1 className="text-yellow-600">{props.gameDetails.title}</h1> */}
            <div className="mx-auto grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-6">
            <div className='col-span-4'>
            <p className='prose lg:prose-xl py-2'>{props.bookDetails.details}</p>
            <p className='prose lg:prose-xl py-2'>{props.bookDetails.moreDetails}</p>
            </div>
            <div className='col-span-2'>
                <div className='text-center py-4'>
            <button
              className="w-full items-center rounded-md btn-primary border-2 border-transparent px-6 py-3 text-lg font-medium shadow-sm focus:outline-none focus:ring-2"
              onClick={addToCartHandler}
            >
              Add to cart
            </button>
            </div>
            <div className='prose lg:prose-xl pl-4 py-4'>
                <h2>Reviews</h2>
                <p>{props.bookDetails.reviews}</p>
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
