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
  const [isPaid, setIsPaid] = useState(false);

  const {
    cart: { cartItems },
  } = state;
  const removeItemHandler = (item) => {
    dispatch({ type: 'CART_REMOVE_ITEM', payload: item });
  };
  const updateCartHandler = (item, qty) => {
    const quantity = Number(qty);
    dispatch({ type: 'CART_ADD_ITEM', payload: { ...item, quantity } });
  };

  const [{ isPending }, paypalDispatch] = usePayPalScriptReducer();


  const updatedCartItems = cartItems.map((item) => {
    return ({
      unit_amount: {
        currency_code: 'USD',
        value: item.price,
      },
      quantity: item.quantity,
      name: item.name,
    });
  })

  useEffect(() => {
    const loadPaypalScript = async () => {
        paypalDispatch({
            type: 'resetOptions',
            value: {
                'client-id': `${process.env.PAYPAL_CLIENT}`,
                currency: 'USD',
            },
        });
        paypalDispatch({ type: 'setLoadingStatus', value: 'pending'});
    };
    loadPaypalScript();
  }, [paypalDispatch]);

  // add multiple items to purchase_units in paypal createOrder function
console.log('cart item outside of createorder function', cartItems);
  const totalPrice = cartItems.reduce((a, c) => a + c.quantity * c.price, 0)
  console.log('udpated cart items', updatedCartItems);
  function createOrder(data, actions) {
    return actions.order.create({
        purchase_units: [{
            amount: { 
              value: totalPrice,
              breakdown:{
                item_total:{
                    currency_code: 'USD',
                    value: totalPrice
                }
            }
            },
          items: updatedCartItems
      }],
      })
      .then((orderID) => {
        return orderID;
      });
  }

  function onApprove(data, actions) {
    return actions.order.capture().then(async function (details) {
      try {
        dispatch({ type: 'PAY_REQUEST' });
        const { data } = await axios.put(
          `/api/orders/${order._id}/pay`,
          details
        );
        console.log('data?', data);
        dispatch({ type: 'PAY_SUCCESS', payload: data });
        console.success('Order is paid successfully');
      } catch (err) {
        dispatch({ type: 'PAY_FAIL', payload: getError(err) });
        console.error(getError(err));
      }
    });
  }
  function onError(err) {
    console.error(err);
  }

  return (
    <GoldenEraLayout title="Shopping Cart">
      <h1 className="mb-4 text-xl">Shopping Cart</h1>
      {cartItems.length === 0 ? (
        <div>
          Cart is empty.
        </div>
      ) : (
        <div className="grid md:grid-cols-4 md:gap-5">
          <div className="overflow-x-auto md:col-span-3">
            <table className="min-w-full ">
              <thead className="border-b">
                <tr>
                  <th className="p-5 text-left">Item</th>
                  <th className="p-5 text-right">Quantity</th>
                  <th className="p-5 text-right">Price</th>
                  <th className="p-5">Remove</th>
                </tr>
              </thead>
              <tbody>
                {cartItems.map((item) => (
                  <tr key={item.slug} className="border-b">
                    <td className="flex items-center">
                      {item.category === "" ?
                      <Link className='flex flex-wrap' href={`/${item.category === "" ? 'golden-era-gaming' : item.slug}`}>
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
                      :
                      <Link className='flex flex-wrap' href={`/${item.category}/${item.slug}`}>
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
                      }

                    </td>
                    <td className="p-5 text-right text-xl">
                        {item.quantity}
                      {/* <select
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
                      </select> */}
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
          </div>
          <div className="card p-5">
            <ul>
              <li>
                <div className="pb-3 text-xl">
                  Total ({cartItems.reduce((a, c) => a + c.quantity, 0)}) : $
                  {cartItems.reduce((a, c) => a + c.quantity * c.price, 0)}
                </div>
              </li>
                {!isPaid && (
                    <li>
                        {isPending ? ( <div>Loading...</div>):
                        <div className='w-full'>
                            <PayPalButtons
                                createOrder={createOrder}
                                onApprove={onApprove}
                                onError={onError}
                            >
                            </PayPalButtons>
                        </div>
                        }
                    </li>
                )}
            </ul>
          </div>
        </div>
      )}
    </GoldenEraLayout>
  );
}