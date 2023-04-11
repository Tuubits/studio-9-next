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
  const [shippingCost, setShippingCost] = useState(0);

  const removeItemHandler = (item) => {
    dispatch({ type: 'CART_REMOVE_ITEM', payload: item });
  };

  const updateCartHandler = (item, qty) => {
    const quantity = Number(qty);
    dispatch({ type: 'CART_ADD_ITEM', payload: { ...item, quantity } });
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
  }, [paypalDispatch]);

let updatedCartItems;
let separateQuantities = [];
useEffect(() => {
  cartItems.forEach(item => { 
    if (item.quantity > 1) {
    for (let i = 0; i < item.quantity; i++) {
      separateQuantities.push({...item, quantity: 1});
    }
    } else {
      separateQuantities.push(item);
    }
  });

  updatedCartItems = separateQuantities.map((item) => {
    return ({
      unit_amount: {
        currency_code: 'USD',
        value: item.price,
      },
      quantity: item.quantity,
      name: item.name,
    });
  })
  calculateShipping();
}, [cartItems])

const calculateShipping = () => {
  let cost = 0;
  if(cartItems.length !== 0) {
  let sortedItems = [...separateQuantities].sort((a, b) => b.shippingCost - a.shippingCost);
  const sortedItemCount = sortedItems.length;
  cost = sortedItems[0].shippingCost * sortedItems[0].quantity;
  setShippingCost(cost);
  if (sortedItemCount > 1 && sortedItemCount < 3) {
    cost += sortedItems[1].shippingCost * 0.5
  }
  if (sortedItemCount === 3) {
    cost += sortedItems[1].shippingCost * 0.5 * sortedItems[1].quantity;
    cost += sortedItems[2].shippingCost * 0.25 * sortedItems[2].quantity;
  }
  if (sortedItemCount > 3) {
    cost += sortedItems[1].shippingCost * 0.5 * sortedItems[1].quantity;
    cost += sortedItems[2].shippingCost * 0.25 * sortedItems[2].quantity;
    for(let i = 3; i < sortedItemCount; i++) {
    cost += sortedItems[i].shippingCost * 0.125 * sortedItems[i].quantity;
    }
  }
  setShippingCost(cost);
}
};

useEffect(() => {
    if (isPaid) {
      router.push({
        pathname:'/',
        query: { message: info },
      });
      updatedCartItems = [];
    }
}, [isPaid])

  // add multiple items to purchase_units in paypal createOrder function

  const totalPrice = cartItems.reduce((a, c) => a + c.quantity * c.price, 0)

  function createOrder(data, actions) {
    return actions.order.create({
        purchase_units: [{
            amount: { 
              value: (totalPrice + shippingCost),
              breakdown:{
                item_total:{
                  currency_code: 'USD',
                  value: totalPrice
                },
                shipping: {
                  currency_code: 'USD',
                  value: shippingCost,
                },
            }
            },
          items: updatedCartItems
      }],
      application_context: {
        shipping_preference: 'GET_FROM_FILE',
      },
      })
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
      // alert('Transaction completed by ' + details.payer.name.given_name + '!');
    });
  };

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
                  {cartItems.reduce((a, c) => a + c.quantity * c.price, 0).toFixed(2)}
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