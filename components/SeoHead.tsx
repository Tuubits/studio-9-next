import Head from 'next/head';
import { SITE_URL } from '../lib/catalog';
import { SITE_LOGO, SITE_NAME, SITE_TAGLINE } from '../lib/structuredData';

// Search snippets show about 155 characters; cut at a word boundary.
export function metaDescription(text: string, max = 155) {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  return clean.slice(0, clean.lastIndexOf(' ', max - 1)).replace(/[\s,;:.—-]+$/, '') + '…';
}

export type SeoProps = {
  title: string;
  description?: string;
  // Site-relative path of the page, e.g. "/games/borderlands"; sets the canonical URL.
  path?: string;
  image?: string;
  type?: 'website' | 'product';
  // For pages that should not appear in search results, like the cart.
  noindex?: boolean;
};

export default function SeoHead({ title, description = SITE_TAGLINE, path, image = SITE_LOGO, type = 'website', noindex = false }: SeoProps) {
  const desc = metaDescription(description);
  const url = path ? SITE_URL + path : null;
  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={desc} key="description" />
      {noindex ? <meta name="robots" content="noindex" key="robots" /> : null}
      {url ? <link rel="canonical" href={url} key="canonical" /> : null}
      <meta property="og:site_name" content={SITE_NAME} key="og:site_name" />
      <meta property="og:type" content={type} key="og:type" />
      <meta property="og:title" content={title} key="og:title" />
      <meta property="og:description" content={desc} key="og:description" />
      <meta property="og:image" content={image} key="og:image" />
      {url ? <meta property="og:url" content={url} key="og:url" /> : null}
      <meta name="twitter:card" content="summary_large_image" key="twitter:card" />
      <meta name="twitter:site" content="@Studio_9_Games" key="twitter:site" />
    </Head>
  );
}
