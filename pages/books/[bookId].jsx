import fs from 'fs'
import path from 'path'
import { useEffect } from 'react';
import Image from 'next/image';
import 'lightbox.js-react/dist/index.css'
import {SlideshowLightbox, initLightboxJS} from 'lightbox.js-react'
import BookLayout from '../../components/bookLayout';

const images = [
    {
      src: 'https://source.unsplash.com/sQZ_A17cufs/549x711',
      alt: 'Mechanical keyboard with white keycaps.',
    },
    {
      src: 'https://source.unsplash.com/rsAeSMzOX9Y/768x512',
      alt: 'Mechanical keyboard with white, pastel green and red keycaps.',
    },
    {
      src: 'https://source.unsplash.com/Z6SXt1v5tP8/768x512',
      alt: 'Mechanical keyboard with white, pastel pink, yellow and red keycaps.',
    },
]

const basePath = '/secondary'

function getBookDetails(props){
    useEffect(() => {
        initLightboxJS(`${process.env.lightbox}`, 'team');
    });

    return (
        <BookLayout theme={props.bookDetails.theme}>
        <div>
            <Image
                src={`${basePath}/${props.bookDetails.mainImage}`}
                className={'mx-auto my-4 sm:my-6'}
                alt={props.bookDetails.title}
                width={400}
                height={200}
            />
        </div>
          <div className="">
            {/* <h1 className="text-yellow-600">{props.gameDetails.title}</h1> */}
            <div className="mx-auto grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-6">
            <div className='col-span-4'>
            <p className='prose lg:prose-xl py-2'>{props.bookDetails.details}</p>
            <p className='prose lg:prose-xl py-2'>{props.bookDetails.moreDetails}</p>
            </div>
            <div className='col-span-2'>
                <div className='text-center py-4'>
            <button
                className="snipcart-add-item w-full items-center rounded-md btn-primary border-2 border-transparent px-6 py-3 text-lg font-medium shadow-sm focus:outline-none focus:ring-2"
                data-item-id={props.bookDetails.title.replace(/\s+/g, '-').toLowerCase()}
                data-item-price="79.99"
                data-item-description="Item description here"
                data-item-image={`${basePath}/${props.bookDetails.mainImage}`}
                data-item-name={props.bookDetails.title}
            >
                Add to Cart
            </button>
            </div>
            <div className='prose lg:prose-xl pl-4 py-4'>
                <h2>Reviews</h2>
                <p>{props.bookDetails.reviews}</p>
            </div>
            <div className='pl-4 py-4'>
            <SlideshowLightbox className='container grid grid-cols-3 gap-2 mx-auto' theme='lightbox' lightboxIdentifier="lightbox1" framework="next" images={images}>
                    {images.map((image, index) => (
                        <Image
                            key={index}
                            src={image.src}
                            alt={image.alt}
                            height={200}
                            width={200}
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
            {  params: { bookId: 'blessedisthespot' } },
            {  params: { bookId: 'firstprayertenderplant' } },
            {  params: { bookId: 'sweetneighborscomeinallcolors' } },
            {  params: { bookId: 'zanjan' } },
        ],
        fallback: false
    }
}

export default getBookDetails
