import { useEffect } from 'react';
import fs from 'fs'
import path from 'path'
import Image from 'next/image';
import Link from 'next/link';
import gamesLogo from '../../public/s9gamesLOGOclearSML.png'
import 'lightbox.js-react/dist/index.css'
import {SlideshowLightbox, initLightboxJS} from 'lightbox.js-react'

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

function getGameDetails(props){
    useEffect(() => {
        initLightboxJS(`${process.env.lightbox}`, 'team');
    });

    return (
        <div className="mx-auto max-w-7xl py-4 sm:py-6 lg:py-8 px-4 sm:px-6 lg:px-8">
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
        <div>
            <Image
                src={`${basePath}/${props.gameDetails.mainImage}`}
                className={'mx-auto my-4 sm:my-6'}
                alt={props.gameDetails.title}
                width={400}
                height={200}
            />
        </div>
          <div className="">
            {/* <h1 className="text-yellow-600">{props.gameDetails.title}</h1> */}
            <div className="mx-auto grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-6">
            <div className='col-span-4'>
            <p className='prose lg:prose-xl py-2'>{props.gameDetails.details}</p>
            <p className='prose lg:prose-xl py-2'>{props.gameDetails.moreDetails}</p>
            </div>
            <div className='col-span-2'>
                <div className='text-center py-4'>
            <button
                type="button"
                className="w-full items-center rounded-md border-2 border-transparent bg-amber-100 px-6 py-3 text-lg font-medium text-slate-800 shadow-sm hover:text-yellow-600 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
            >
                Add to Cart
            </button>
            </div>
            <div className='prose lg:prose-xl pl-4 py-4'>
                <h2>Reviews</h2>
                <p>{props.gameDetails.reviews}</p>
            </div>
            <div className='pl-4 py-4'>
            <SlideshowLightbox className='container grid grid-cols-3 gap-2 mx-auto' theme='lightbox' lightboxIdentifier="lightbox1" framework="next" images={images}>
                    {images.map((image) => (
                        <Image
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
        </div>
    )
}

export async function getStaticProps(context) {
    const { params } = context
    const gameId = params.gameId
    const fileToRead = path.join(process.cwd(), 'game_details.json')
    const data = JSON.parse(await fs.readFileSync(fileToRead))
    const game = data.games.find(game => game.id === gameId)
    return {
        props: {
            gameDetails: game
        },
    };
}

export async function getStaticPaths() {
    return {
        paths: [
            {  params: { gameId: 'villagersandvillains' } },
            {  params: { gameId: 'treasuresandtraps' } },
            {  params: { gameId: 'heroversusguardian' } },
            {  params: { gameId: 'midnightlegion' } },
            {  params: { gameId: 'globalcrisis' } },
        ],
        fallback: false
    }
}

export default getGameDetails
