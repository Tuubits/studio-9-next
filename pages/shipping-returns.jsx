import React from 'react';
import BookLayout from '../components/bookLayout';

export default function ShippingReturns() {
  return (
    <BookLayout
      title="Shipping & Returns | Studio 9 Inc"
      seo={{
        description: 'Shipping and returns for Studio 9 Inc and Studio 9 Games: we ship physical orders within the United States only and accept returns of defective items within 14 days. PDF editions are sold through DriveThruRPG.',
        path: '/shipping-returns',
      }}
    >
      <div className="mx-auto max-w-3xl prose lg:prose-xl pb-8">
        <h1>Shipping &amp; Returns</h1>

        <h2>Shipping</h2>
        <p>We ship physical orders (games, books and signed Golden Era Gaming modules) <strong>within the United States only</strong>. We are unable to fulfill orders outside of the United States.</p>
        <p>Shipping is charged per order at checkout: the item with the highest shipping cost is charged in full, the second item at 50%, the third at 25%, and each additional item at 12.5%.</p>

        <h2>Returns</h2>
        <p>Once an order is placed, returns are only possible within <strong>14 days of receipt</strong>, if the product is found defective. Send us pictures and a note describing the defect.</p>
        <p>If your order arrives damaged or doesn&apos;t arrive, contact us and we will make every effort to help you get a refund from USPS by providing a receipt of purchase. In addition, send us pictures of the damage and we will help you replace your items at cost.</p>

        <h2>PDF editions</h2>
        <p>PDF editions of Golden Era Gaming modules are sold and delivered by DriveThruRPG. For downloads, refunds or other help with a PDF purchase, please contact DriveThruRPG.</p>

        <h2>Contact</h2>
        <p>Questions about an order? Email <a href="mailto:info@studio9inc.com">info@studio9inc.com</a>.</p>
      </div>
    </BookLayout>
  );
}
