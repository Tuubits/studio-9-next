import React, { useContext, useEffect } from 'react';
import fs from 'fs'
import path from 'path'
import Image from 'next/image';
import { useRouter } from 'next/router';
import 'lightbox.js-react/dist/index.css'
import {SlideshowLightbox, initLightboxJS} from 'lightbox.js-react'
import GameLayout from '../../components/gameLayout';
import { Store } from '../../utils/Store';
import YouTube from 'react-youtube';

function getGameDetails(props){
    useEffect(() => {
        initLightboxJS(`${process.env.lightbox}`, 'team');
    });
    const router = useRouter();
    const { state, dispatch } = useContext(Store);

    const addToCartHandler = () => {
        const existItem = state.cart.cartItems.find((x) => x.slug === props.gameDetails.slug);
        const quantity = existItem ? existItem.quantity + 1 : 1;
        dispatch({ type: 'CART_ADD_ITEM', payload: { ...props.gameDetails, quantity } });
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
        <GameLayout>
        <div>
            <Image
                src={`${props.gameDetails.productImage}`}
                className={'mx-auto my-4 sm:my-6'}
                alt={props.gameDetails.title}
                width={500}
                height={200}
            />
        </div>
          <div className="mx-auto max-w-7xl py-4 sm:py-6 lg:py-8 px-4 sm:px-6 lg:px-8">
            {/* <h1 className="text-yellow-600">{props.gameDetails.title}</h1> */}
            <div className="mx-auto grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-6">
            <div className='col-span-4'>
            <p className='prose lg:prose-xl py-2'>{props.gameDetails.details}</p>
            <p className='prose lg:prose-xl py-2'>{props.gameDetails.moreDetails}</p>
            <p className='prose lg:prose-xl py-2 italic'>{props.gameDetails.quote}</p>
            {props.gameDetails.videoLink ? <YouTube videoId={props.gameDetails.videoLink} opts={opts} onReady={onPlayerReady} /> : null }
            </div>
            <div className='col-span-2'>
                <div className='text-center py-4 space-y-4'>
                <p className='prose lg:prose-xl font-bold'>{props.gameDetails.price ? `$${props.gameDetails.price.toFixed(2)}` : null}</p>
                {props.gameDetails.alternateBuyOptions ? 
                    (props.gameDetails.alternateBuyOptions.map((i, index) => 
                        i.addToCart ? 
                        <button
                        className={`${props.gameDetails.outOfStock ? 'btn-disabled text-gray-700' : 'btn-secondary'} w-full items-center rounded-md border-2 border-transparent px-6 py-3 text-lg font-medium shadow-sm focus:outline-none focus:ring-2`}
                        onClick={props.gameDetails.outOfStock ? null : addToCartHandler}
                        >
                        {props.gameDetails.outOfStock ? 'Out of Stock': i.name}
                        </button>
                        : 
                        <a key={index}
                        className={`text-base-100 block px-6 py-3 btn-primary w-full items-center rounded-md border-2 border-transparent text-lg font-medium shadow-sm focus:outline-none focus:ring-2`}
                        href={i.link} target="_blank" rel="noreferrer"
                    >
                        {i.name}
                    </a>

                    ))
                :
                <button
                className={`${props.gameDetails.outOfStock ? 'btn-disabled text-gray-700' : 'btn-primary'} w-full items-center rounded-md border-2 border-transparent px-6 py-3 text-lg font-medium shadow-sm focus:outline-none focus:ring-2`}
                onClick={props.gameDetails.outOfStock ? null : addToCartHandler}
                >
                {props.gameDetails.outOfStock ? 'Out of Stock': 'Add to cart'}
                </button>
                }
            </div>
            <div className='pl-4 py-4'>
            <SlideshowLightbox className={`container grid ${ props.gameDetails.sideImages.length < 2 ? 'grid-cols-1' : 'grid-cols-2'} gap-2 mx-auto`} theme='lightbox' lightboxIdentifier="lightbox1" framework="next" images={props.gameDetails.sideImages}>
                    {props.gameDetails.sideImages.map((image, index) => (
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
            {props.gameDetails.reviews ?
            <h2>Reviews</h2>
            : null}
            {props.gameDetails.reviews ?
                 props.gameDetails.reviews.map((i, index) => (
                    <div key={index}>
                    <p className=' font-bold'>{i.review}</p>
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
          </GameLayout>
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
            {  params: { gameId: 'charms-antiracism' } },
            {  params: { gameId: 'villagers-and-villains' } },
            {  params: { gameId: 'borderlands' } },
            {  params: { gameId: 'city-builder' } },
            {  params: { gameId: 'treasures-and-traps' } },
            {  params: { gameId: 'random-encounters' } },
            {  params: { gameId: 'expanded-realms-1' } },
            {  params: { gameId: 'expanded-realms-2' } },
            {  params: { gameId: 'hero-versus-guardian' } },
            {  params: { gameId: 'midnight-legion' } },
            {  params: { gameId: 'global-crisis' } },
            {  params: { gameId: 'charms' } },
        ],
        fallback: false
    }
}

export default getGameDetails
