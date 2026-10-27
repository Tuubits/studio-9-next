import Image from 'next/image';
import Link from 'next/link';
import React, { useContext, useEffect, useState } from 'react';
import { MinusCircleIcon } from '@heroicons/react/24/outline'
import GoldenEraLayout from '../components/goldenEraLayout';
import { useRouter } from 'next/router';
import { Store } from '../utils/Store';
import { PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js';

export default function CartScreen() {
  const router = useRouter();
  const { state, dispatch } = useContext(Store);
  const {
    cart: { cartItems },
  } = state;
  const [isPaid, setIsPaid] = useState(false);  
  const [info, setInfo] = useState('');
  const [error, setError] = useState(null);

  const removeItemHandler = (item) => {
    dispatch({ type: 'CART_REMOVE_ITEM', payload: item });
  };

  const updateCartHandler = (item, qty) => {
    const quantity = Number(qty);
    dispatch({ type: 'CART_ADD_ITEM', payload: { ...item, quantity } });
  };

  const [, paypalDispatch] = usePayPalScriptReducer();

  useEffect(() => {
    const loadPaypalScript = async () => {
        paypalDispatch({
            type: 'resetOptions',
            value: {
                clientId: process.env.PAYPAL_CLIENT,
                currency: 'USD',
            },
        });
        paypalDispatch({ type: 'setLoadingStatus', value: 'pending'});
    };
    loadPaypalScript();
  }, [paypalDispatch, cartItems]);

const totalValue = cartItems.reduce((a, c) => a + c.quantity * c.price, 0).toFixed(2);

useEffect(() => {
    if (isPaid) {
      router.push({
        pathname:'/',
        query: { message: info },
      });
      dispatch({ type: 'CART_CLEAR' });
    }
}, [isPaid])

// The server prices the order from the catalog; send only ids and quantities.
const createOrder = async () => {
  setError(null);
  const response = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items: cartItems.map((item) => ({ id: item.slug, quantity: item.quantity })) }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    // Take items that can't be ordered (e.g. a module now sold only as a PDF) out of the cart.
    const rejected = (data.rejected ?? []).map((r) => {
      const item = cartItems.find((i) => i.slug === r.id);
      if (item) dispatch({ type: 'CART_REMOVE_ITEM', payload: item });
      return `${item?.name ?? r.id}: ${r.reason}`;
    });
    setError({
      text: data.error ?? 'We couldn’t start the PayPal checkout. Please try again.',
      details: rejected.length ? [...rejected, 'We removed these from your cart.'] : [],
    });
    throw new Error(data.error ?? `Creating the order failed (${response.status})`);
  }
  return data.id;
}

function onError(err) {
  console.error(err);
  setError((current) => current ?? { text: 'Something went wrong with PayPal. Please try again.', details: [] });
}

const onApprove = async (data, actions) => {
  const response = await fetch(`/api/orders/${encodeURIComponent(data.orderID)}/capture`, { method: 'POST' });
  const result = await response.json().catch(() => ({}));
  if (result.restart) return actions.restart();
  if (!response.ok) {
    setError({ text: result.error ?? 'We couldn’t confirm your payment.', details: [] });
    return;
  }
  setInfo(result.payerName ?? '');
  setIsPaid(true);
};

useEffect(() => {
  dispatch({ type: 'CALCULATE_SHIPPING' });
}, [cartItems, dispatch]);

  return (
    <GoldenEraLayout title="Shopping Cart" seo={{ path: '/cart', noindex: true }}>
      <div className='flex flex-wrap'>
        <Link className="btn btn-accent normal-case mb-4 text-xl" href={'/'}>Continue Shopping</Link>
      </div>
      <h1 className='font-bold text-2xl text-center'>PLEASE NOTE: We are unable to fulfill orders outside of the United States.</h1>
      {error ? (
        <div role="alert" className="alert alert-error my-4 block text-xl">
          <p>{error.text}</p>
          {error.details.length ? <ul className="list-disc pl-6">{error.details.map((d) => <li key={d}>{d}</li>)}</ul> : null}
        </div>
      ) : null}
      {cartItems.length === 0 ? (
        <div>
          Cart is empty.
        </div>
      ) : (
        <div className="grid md:grid-cols-4 md:gap-5">
          <div className="overflow-x-auto md:col-span-3">
            <table className="min-w-full ">
              <thead className="border-b border-stone-700">
                <tr>
                  <th className="p-5 text-left">Item</th>
                  <th className="p-5 text-right">Quantity</th>
                  <th className="p-5 text-right">Price</th>
                  <th className="p-5">Remove</th>
                </tr>
              </thead>
              <tbody>
                {cartItems.map((item) => (
                  <tr key={item.slug} className="border-b border-stone-700">
                    <td className="flex items-center">
                      <Link className='flex flex-wrap' href={item.path ?? `/${item.category}/${item.slug}`}>
                          <Image
                            src={`${item.mainImage}`}
                            alt={item.name}
                            width={100}
                            height={100}
                          ></Image>
                          &nbsp;
                          <div className='text-2xl mt-auto mb-auto sm:ml-4'>
                          {item.name}
                          </div>
                      </Link>

                    </td>
                    <td className="p-5 text-right text-xl">
                      <select
                        className='bg-base-100'
                        value={item.quantity}
                        onChange={(e) =>
                          updateCartHandler(item, e.target.value)
                        }
                      >
                        {[...Array(item.countInStock).keys()].map((x) => (
                          <option key={x + 1} value={x + 1}>
                            {x + 1}
                          </option>
                        ))}
                      </select>
                      {/* {item.quantity} */}
                    </td>
                    <td className="p-5 text-right text-xl">${item.price}</td>
                    <td className="p-5 text-center text-xl">
                      <button onClick={() => removeItemHandler(item)}>
                        <MinusCircleIcon className="h-5 w-5"></MinusCircleIcon>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div>
      <p className="pt-6 text-xl leading-6 text-gray-900">
        Feel free to reach out to us with any comments about your order.
      </p>
    </div>
          </div>
          <div className="card p-5">
            <ul>
              <li>
                <div className="pb-3 text-xl">
                  Total ({cartItems.reduce((a, c) => a + c.quantity, 0)}) : $
                  {totalValue}
                </div>
              </li>
              <li>
                  <div className='w-full'>
                      <PayPalButtons
                        createOrder={createOrder}
                        onApprove={onApprove}
                        onError={onError}
                      >
                      </PayPalButtons>
                  </div>
              </li>
            </ul>
          </div>
        </div>
      )}
    </GoldenEraLayout>
  );
}