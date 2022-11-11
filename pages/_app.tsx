import { useEffect } from 'react';
import '../styles/globals.css'
import type { AppProps } from 'next/app'
import {themeChange} from "theme-change";

export default function App({ Component, pageProps }: AppProps) {
  const themeValues = [
    "Dark",
    "Cupcake",
    "Bumblebee",
    "Emerald",
    "Corporate",
    "Synthwave",
    "Retro",
    "Cyberpunk",
    "Valentine",
    "Halloween",
    "Garden",
    "Forest",
    "Aqua",
    "Lofi",
    "Pastel",
    "Fantasy",
    "Wireframe",
    "Black",
    "Luxury",
    "Dracula",
    "Cmyk"
  ]
  useEffect(()=> {
    themeChange(false)
  });
  return (
    <>
    <div className='text-right mr-8 mt-8'>
      <select className="text-primary" data-choose-theme>
        <option className="text-primary" value="">Default Value</option>
        {themeValues.map((value) => (
          <option className="text-primary" key={value.toLowerCase()} value={value.toLowerCase()}>{value}</option>
        ))}
      </select>
    </div>
        <Component {...pageProps} />
    </>
  );
}
