import { createContext, useEffect, useReducer } from 'react';
import { shippingFor } from '../lib/shipping';

export const Store = createContext();

// The cart is saved in the browser so it survives a reload. Only ids,
// quantities and names are kept; prices come back from the catalog.
const STORAGE_KEY = 'studio9-cart';
const MAX_QUANTITY = 10; // lib/orders.ts

const initialState = {
  cart: { cartItems: [] },
  shipping: 0,
  // False until the saved cart has been read (after the first render, so the
  // server and browser render the same page).
  hydrated: false,
  // Items taken out of a saved cart because they can no longer be bought here.
  cartNotice: [],
};

function readSavedCart() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]');
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function saveCart(cartItems) {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(cartItems.map(({ slug, quantity, name }) => ({ slug, quantity, name }))),
    );
  } catch {}
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
      return { ...state, shipping: shippingFor(state.cart.cartItems) };
    }
    case 'UPDATE_SHIPPING': {
      const newShipping = action.payload;
      return { ...state, shipping: newShipping };
    }
    case 'CART_CLEAR': {
      return { ...state, cart: { cartItems: [] }, shipping: 0 };
    }
    case 'CART_HYDRATE': {
      // Anything added before the saved cart loaded wins over the saved line.
      const current = state.cart.cartItems;
      const saved = action.payload.cartItems.filter((s) => !current.some((c) => c.slug === s.slug));
      return {
        ...state,
        hydrated: true,
        cart: { ...state.cart, cartItems: [...saved, ...current] },
        cartNotice: action.payload.dropped,
      };
    }
    case 'CART_ADD_ITEMS': {
      // From a /cart?add= link: add to what is there, up to the limit.
      let cartItems = state.cart.cartItems;
      for (const item of action.payload) {
        const existing = cartItems.find((c) => c.slug === item.slug);
        cartItems = existing
          ? cartItems.map((c) => (c.slug === item.slug ? { ...c, quantity: Math.min(c.quantity + item.quantity, MAX_QUANTITY) } : c))
          : [...cartItems, item];
      }
      return { ...state, cart: { ...state.cart, cartItems } };
    }
    case 'CART_NOTICE_CLEAR': {
      return { ...state, cartNotice: [] };
    }
    
    default:
      return state;
  }
}

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const saved = readSavedCart();
    if (!saved.length) {
      dispatch({ type: 'CART_HYDRATE', payload: { cartItems: [], dropped: [] } });
      return;
    }
    // Rebuild the lines from today's catalog (loaded only now, not with every page).
    import('../lib/cartItems')
      .then(({ refreshCart }) => dispatch({ type: 'CART_HYDRATE', payload: refreshCart(saved) }))
      .catch(() => dispatch({ type: 'CART_HYDRATE', payload: { cartItems: [], dropped: [] } }));
  }, []);

  useEffect(() => {
    if (state.hydrated) saveCart(state.cart.cartItems);
  }, [state.hydrated, state.cart.cartItems]);

  const value = { state, dispatch };
  return <Store.Provider value={value}>{children}</Store.Provider>;
}