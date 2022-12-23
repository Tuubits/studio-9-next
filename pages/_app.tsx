import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { StoreProvider } from '../utils/Store';
import { PayPalScriptProvider } from '@paypal/react-paypal-js';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <StoreProvider>
      <PayPalScriptProvider options={{"client-id": `${process.env.PAYPAL_CLIENT}`}} deferLoading={true}>
        <Component {...pageProps} />
      </PayPalScriptProvider>
    </StoreProvider>
  );
}
