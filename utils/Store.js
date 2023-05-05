import { createContext, useReducer } from 'react';

export const Store = createContext();

const initialState = {
  cart: { cartItems: [] },
  shipping: 0
};

function createObjectsFromQuantity(obj) {
  const { quantity } = obj;
  const result = [];
  for (let i = 0; i < quantity; i++) {
    result.push({ ...obj, quantity: 1 });
  }
  return result;
}

function reducer(state, action) {
  switch (action.type) {
    case 'CART_ADD_ITEM': {
      const newItem = action.payload;
      const existItem = state.cart.cartItems.find(
        (item) => item.slug === newItem.slug
      );
      const cartItems = existItem
        ? state.cart.cartItems.map((item) =>
            item.name === existItem.name ? newItem : item
          )
        : [...state.cart.cartItems, newItem];
      return { ...state, cart: { ...state.cart, cartItems } };
    }
    case 'CART_REMOVE_ITEM': {
        const cartItems = state.cart.cartItems.filter(
          (item) => item.slug !== action.payload.slug
        );
        return { ...state, cart: { ...state.cart, cartItems } };
    }
    case 'CALCULATE_SHIPPING': { 
      if(state.cart.cartItems.length !== 0) {
      let cost = 0;
      let combinedArray = [];
      for (let obj of state.cart.cartItems) {
        const objArray = createObjectsFromQuantity(obj);
        combinedArray = combinedArray.concat(objArray);
      }
      console.log('combinedArray: ', combinedArray);
      let sortedItems = combinedArray.sort((a, b) => b.shippingCost - a.shippingCost);
      console.log('sortedItems: ', sortedItems);
      const sortedItemCount = sortedItems.length;
      console.log('sortedItemCount: ', sortedItemCount)
      if(sortedItems.length > 0) {
        cost = sortedItems[0].shippingCost * sortedItems[0].quantity;
      }
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
      console.log('shipping cost in context: ', cost)
      console.log('quantity in context', state.cart.cartItems[0].quantity)
      return { ...state, cart: { ...state.cart }, shipping: cost };
    } else if(state.cart.cartItems.length === 0) {
      return { ...state, cart: { ...state.cart }, shipping: 0 };
    }
    }
    case 'UPDATE_SHIPPING': {
      const newShipping = action.payload;
      return { ...state, shipping: newShipping };
    }
    case 'CART_CLEAR': {
      return { ...state, cart: { cartItems: [] }, shipping: 0 };
    }
    
    default:
      return state;
  }
}

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const value = { state, dispatch };
  return <Store.Provider value={value}>{children}</Store.Provider>;
}