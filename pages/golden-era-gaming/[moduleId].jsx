import React from 'react';
import Link from 'next/link';
import GoldenEraLayout from '../../components/goldenEraLayout';
import ModuleCard from '../../components/moduleCard';
import { getProduct, getProductsByCategory } from '../../lib/catalog';

export default function ModulePage({ product }) {
  return (
    <GoldenEraLayout title={`${product.name} | Golden Era Gaming`}>
      <div className="mt-4 mb-4">
        <Link href="/golden-era-gaming" className="link link-hover">
          &larr; All Golden Era modules
        </Link>
      </div>
      <ModuleCard product={product} headingLevel="h1" linkTitle={false} />
    </GoldenEraLayout>
  );
}

export async function getStaticProps({ params }) {
  return { props: { product: getProduct(params.moduleId) } };
}

export async function getStaticPaths() {
  return {
    paths: getProductsByCategory('golden-era-gaming').map((p) => ({ params: { moduleId: p.id } })),
    fallback: false,
  };
}
