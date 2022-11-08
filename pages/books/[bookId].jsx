import fs from 'fs'
import path from 'path'
import Image from 'next/image';
import gamesLogo from '../../public/s9gamesLOGOclearSML.png'

const basePath = '/secondary'

function getBookDetails(props){
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
                src={`${basePath}/${props.bookDetails.mainImage}`}
                className={'text-left'}
                alt={props.bookDetails.title}
                width={200}
                height={200}
            />
        </div>
        <div>
            {props.bookDetails.title}
        </div>
        <div>
            {props.bookDetails.details}
        </div>
        <div>
            {props.bookDetails.testimonials}
        </div>
        </>
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
