import { useState } from 'react';
import Image from 'next/image';
import GoldenEraLayout from '../components/goldenEraLayout';
import modules from '../module_details.json';

export default function GoldenEraGaming() {
    const feature = modules[0]
    const [options, setOptions] = useState(modules.map(i => i.title))
    const [selected, setSelected] = useState(feature.title)
    const basePath = '/modules'
    const handleChange = (value) => {
        setSelected(value)
    }

  return (
    <GoldenEraLayout theme={'light'}>
        <select 
            className="select select-accent select-lg mt-4 mb-4 w-full max-w-xs"
            onChange={(e)=>{handleChange(e.currentTarget.value)}}
        >
            <option>Pick a module</option>
            {options.map(i => 
                <option>{i}</option>    
            )}
        </select>
      <div>
      {selected === feature.title ? 
            <div key={feature.id} className="card sm:card-side bg-base-100 m-4 sm:m-0 sm:mb-4 shadow-xl">
                <figure className='relative h-96 sm:w-full'>
                    <Image
                        src={`${basePath}/${feature.mainImage}`}
                        className='mt-6 sm:mt-0 rounded'
                        alt={feature.title}
                        layout={'fill'}
                        objectFit='cover'
                    />
                </figure>
            <div className="card-body">
                <h2 className="card-title">{feature.title}</h2>
                <p>{feature.details}</p>
                <div className="card-actions justify-end">
                    <button
                        type="button"
                        className="snipcart-add-item btn btn-primary"
                        data-item-id={feature.title.replace(/\s+/g, '-').toLowerCase()}
                        data-item-price="79.99"
                        data-item-description="Item description here"
                        data-item-image={`${basePath}/${feature.mainImage}`}
                        data-item-name={feature.title}
                    >
                        Add to Cart
                    </button>
                </div>
            </div>
        </div>
      :
    modules.filter(j => j.title === selected).map(i => (
            <div key={i.id} className="card sm:card-side bg-base-100 m-4 sm:m-0 sm:mb-4 shadow-xl">
                <figure className='relative h-96 sm:w-full'>
                    <Image
                        src={`${basePath}/${i.mainImage}`}
                        className='mt-6 sm:mt-0 rounded'
                        alt={i.title}
                        layout={'fill'}
                        objectFit='cover'
                    />
                </figure>
            <div className="card-body">
                <h2 className="card-title">{i.title}</h2>
                <p>{i.details}</p>
                <div className="card-actions justify-end">
                    <button
                        type="button"
                        className="snipcart-add-item btn btn-primary"
                        data-item-id={i.title.replace(/\s+/g, '-').toLowerCase()}
                        data-item-price="79.99"
                        data-item-description="Item description here"
                        data-item-image={`${basePath}/${i.mainImage}`}
                        data-item-name={i.title}
                    >
                        Add to Cart
                    </button>
                </div>
            </div>
            </div>
        ))}
      </div>
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
        {modules.filter(j => j.title !== selected).map(i => 
            <div key={i.id} className="card bg-base-100 max-w-md shadow-xl">
                <figure className='relative h-96 sm:w-full'>
                    <Image
                        src={`${basePath}/${i.mainImage}`}
                        className='mt-6 sm:mt-0 rounded'
                        alt={i.title}
                        layout={'fill'}
                        objectFit='cover'
                    />
                </figure>
            <div className="card-body">
                <h2 className="card-title">{i.title}</h2>
                <p>{i.details}</p>
                <div className="card-actions justify-end">
                    <button
                        type="button"
                        className="snipcart-add-item btn btn-primary"
                        data-item-id={i.title.replace(/\s+/g, '-').toLowerCase()}
                        data-item-price="79.99"
                        data-item-description="Item description here"
                        data-item-image={`${basePath}/${i.mainImage}`}
                        data-item-name={i.title}
                    >
                        Add to Cart
                    </button>
                </div>
            </div>
            </div>
        )}

      </div>
    </GoldenEraLayout>
  );
}
