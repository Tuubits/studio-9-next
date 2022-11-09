// pages/_document.js
import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html>
      <Head>
      <link rel="preconnect" href="https://app.snipcart.com" />
      <link rel="preconnect" href="https://cdn.snipcart.com" />
      <link rel="stylesheet" href="https://cdn.snipcart.com/themes/v3.2.1/default/snipcart.css"/>
      </Head>
      <body>
        <Main />
        <NextScript />
        <script
            async
            src="https://cdn.snipcart.com/themes/v3.2.1/default/snipcart.js"
          ></script>
          <div
            id="snipcart"
            data-config-modal-style="side"
            data-api-key={`${process.env.snipcartPublicTestKey}`}
            hidden
          >
          </div>
      </body>
    </Html>
  )
}