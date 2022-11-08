import fs from 'fs'
import path from 'path'
import Image from 'next/image';
import gamesLogo from '../../public/s9gamesLOGOclearSML.png'

const basePath = '/secondary'

function getGameDetails(props){
    return (
        <>
        <div>
        <Image
            src={gamesLogo}
            className={'text-left'}
            alt={'Studio 9 Games'}
            width={200}
            height={200}
          />
        </div>
        <div>
            <Image
                src={`${basePath}/${props.gameDetails.mainImage}`}
                className={'text-left'}
                alt={props.gameDetails.title}
                width={200}
                height={200}
            />
        </div>
        <div>
            {props.gameDetails.title}
        </div>
        <div>
            {props.gameDetails.details}
        </div>
        <div>
            {props.gameDetails.testimonials}
        </div>
        </>
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
