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
    shipping
  } = state;
  const [isPaid, setIsPaid] = useState(false);  
  const [info, setInfo] = useState('');
  const [totalValue, setTotalValue] = useState(0);
  const [message, setMessage] = useState('');


  useEffect(() => {
    if (state.shipping !== shipping) {
      setShipping(state.shipping);
    }
  }, [state.shipping, shipping]);

  const removeItemHandler = (item) => {
    dispatch({ type: 'CART_REMOVE_ITEM', payload: item });
  };

  const updateCartHandler = (item, qty) => {
    const quantity = Number(qty);
    dispatch({ type: 'CART_ADD_ITEM', payload: { ...item, quantity } });
    dispatch({ type: 'UPDATE_SHIPPING', payload: shipping });
  };

  const setShipping = () => {
    dispatch({ type: 'UPDATE_SHIPPING', payload: shipping });
  };

  const [{ isPending }, paypalDispatch] = usePayPalScriptReducer();

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
  }, [paypalDispatch, cartItems]);

useEffect(() => {
  let total = cartItems.reduce((a, c) => a + c.quantity * c.price, 0).toFixed(2);
  setTotalValue(total);
  dispatch({ type: 'UPDATE_SHIPPING', payload: shipping });
}, [cartItems])

useEffect(() => {
    if (isPaid) {
      router.push({
        pathname:'/',
        query: { message: info },
      });
      dispatch({ type: 'CART_CLEAR' });
    }
}, [isPaid])

const createOrder = async (data, actions, extraParams) => {
    const { shipping } = await extraParams;
    const total = (Number(totalValue) + Number(shipping)).toFixed(2);
  return await actions.order.create(
    {
      purchase_units: [{
          amount: { 
            value: total,
            breakdown:{
              item_total:{
                currency_code: 'USD',
                value: totalValue
              },
              shipping: {
                currency_code: 'USD',
                value: shipping,
              },
              description: message,
          }
          },
          items: cartItems.map((item) => ({
            name: item.name,
            quantity: item.quantity.toString(),
            unit_amount: {
              currency_code: "USD",
              value: item.price.toFixed(2),
            },
          })),
    }],
    application_context: {
      shipping_preference: 'GET_FROM_FILE',
    },
    }
  )
    .then((orderID) => {
      return orderID;
    });
}

function onError(err) {
  console.error(err);
}

const onApprove = (data, actions) => {
  // Capture the payment and update the order status
  return actions.order.capture().then(function(details) {
    // Show a success message to the buyer
    setIsPaid(true);
    setInfo(details.payer.name.given_name);
  });
};

useEffect(() => {
  dispatch({ type: 'CALCULATE_SHIPPING' });
}, [cartItems, dispatch]);

  return (
    <GoldenEraLayout title="Shopping Cart">
      <Link className='flex flex-wrap' href={'/'}>
        <button className="btn btn-accent normal-case mb-4 text-xl">Continue Shopping</button>
      </Link>
      <h1 className='font-bold text-2xl text-center'>PLEASE NOTE: We are unable to fulfill orders outside of the United States.</h1>
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
      <label htmlFor="comment" className="block text-xl pt-6 font-bold leading-6 text-gray-900">
        Add any details you would like us to know about your order:
      </label>
      <div className="mt-2">
        <textarea
          rows={4}
          name="comment"
          id="comment"
          className="block w-full md:w-2/3 rounded-md border-0 py-1.5 px-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-xl sm:leading-6"
          defaultValue={''}
          onChange={(e) => setMessage(e.target.value)}
          value={message}
        />
      </div>
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
                  {isPending ? ( <div>Loading...</div>):
                  <div className='w-full'>
                      <PayPalButtons
                        createOrder={(data, actions) => {
                          return(
                            createOrder(data, actions, { shipping: state.shipping})
                          )
                        }
                        }
                        onApprove={onApprove}
                        onError={onError}
                      >
                      </PayPalButtons>
                  </div>
                  }
              </li>
            </ul>
          </div>
        </div>
      )}
    </GoldenEraLayout>
  );
}