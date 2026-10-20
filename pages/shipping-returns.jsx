import React from 'react';
import GoldenEraLayout from '../components/goldenEraLayout';

// TODO: owner to confirm. Every policy statement marked "to be confirmed"
// below is a placeholder until Aaron and Lisa supply the real policy.
export default function ShippingReturns() {
  return (
    <GoldenEraLayout
      title="Shipping & Returns | Studio 9 Inc"
      seo={{
        description: 'Shipping and returns for Studio 9 Inc and Studio 9 Games: we ship physical orders within the United States only. PDF editions are sold through DriveThruRPG.',
        path: '/shipping-returns',
      }}
    >
      <div className="mx-auto max-w-3xl prose lg:prose-xl pb-8">
        <h1>Shipping &amp; Returns</h1>

        <h2>Shipping</h2>
        <p>We ship physical orders (games, books and signed Golden Era Gaming modules) <strong>within the United States only</strong>. We are unable to fulfill orders outside of the United States.</p>
        <p>Shipping is charged per order at checkout: the item with the highest shipping cost is charged in full, the second item at 50%, the third at 25%, and each additional item at 12.5%.</p>
        <p>Orders usually ship within [to be confirmed] business days.</p>

        <h2>Returns</h2>
        <p>[To be confirmed: how many days customers have to request a return, whether items must be unopened, and who pays return shipping.]</p>
        <p>If your order arrives damaged or doesn&apos;t arrive, contact us and we will make it right. [To be confirmed.]</p>

        <h2>PDF editions</h2>
        <p>PDF editions of Golden Era Gaming modules are sold and delivered by DriveThruRPG. For downloads, refunds or other help with a PDF purchase, please contact DriveThruRPG.</p>

        <h2>Contact</h2>
        <p>Questions about an order? Email <a href="mailto:info@studio9inc.com">info@studio9inc.com</a>.</p>
      </div>
    </GoldenEraLayout>
  );
}
