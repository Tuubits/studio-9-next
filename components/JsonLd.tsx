import Head from 'next/head';

export { productJsonLd, organizationJsonLd } from '../lib/structuredData';

// Renders Schema.org JSON-LD (built in lib/structuredData.ts) into <head>.
export default function JsonLd({ data, id }: { data: object; id: string }) {
  return (
    <Head>
      <script
        type="application/ld+json"
        key={id}
        // Escape "<" so text in the data can never close the script tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
      />
    </Head>
  );
}
