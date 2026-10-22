import { createContext, useReducer } from 'react';
import { shippingFor } from '../lib/shipping';

export const Store = createContext();

const initialState = {
  cart: { cartItems: [] },
  shipping: 0
};

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
      return { ...state, shipping: shippingFor(state.cart.cartItems) };
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