// pages/_document.js
import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html>
      <Head>
      <script
            async
            defer
            data-domain="studio9inc.com"
            src="https://plausible.io/js/script.js"
          />
      </Head>
      <body>
      <form name="contact" netlify="true" netlify-honeypot="field-bot" hidden>
        <textarea name="message"></textarea>
      </form>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}