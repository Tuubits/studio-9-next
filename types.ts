declare global {
    interface Window {
      Snipcart: any;
    }
    namespace JSX {
      interface IntrinsicElements {
        "snipcart-label": any;
        "snipcart-input": any;
      }
    }
}

export {}