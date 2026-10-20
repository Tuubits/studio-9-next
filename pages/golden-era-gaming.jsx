import React, { useState } from 'react';
import GoldenEraLayout from '../components/goldenEraLayout';
import ModuleCard from '../components/moduleCard';
import { getProductsByCategory, getSourceRecord } from '../lib/catalog';

export default function GoldenEraGaming({ modules, options }) {
    const feature = modules[0]
    const [selected, setSelected] = useState(feature.name)

  return (
    <GoldenEraLayout title={'Golden Era Gaming'}>
        <select
            aria-label="Select a module"
            className="select select-accent select-lg mt-4 mb-4 w-full max-w-xs"
            onChange={(e)=>{setSelected(e.currentTarget.value)}}
        >
            <option>Pick a module</option>
            {options.map((o, index) => o.group ?
                <optgroup key={index} label={o.group} className="font-bold text-warning bg-accent">
                    {o.titles.map(t => <option key={t} className="font-normal text-warning bg-base-100">{t}</option>)}
                </optgroup>
            :
                <option key={index}>{o.titles[0]}</option>
            )}
        </select>
      <div>
        {modules.filter(m => m.name === selected).map(m => (
            <ModuleCard key={m.id} product={m} featured={m.id === feature.id} />
        ))}
      </div>
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
        {modules.filter(m => m.name !== selected).map(m => (
            <ModuleCard key={m.id} product={m} layout='grid' />
        ))}
      </div>
    </GoldenEraLayout>
  );
}

export async function getStaticProps() {
    const modules = getProductsByCategory('golden-era-gaming')
    // Consecutive modules sharing a `group` are collected into one dropdown optgroup
    const options = modules.reduce((acc, m) => {
        const group = getSourceRecord('golden-era-gaming', m.id).group ?? null
        const last = acc[acc.length - 1]
        if (group && last && last.group === group) {
            last.titles.push(m.name)
        } else {
            acc.push({ group, titles: [m.name] })
        }
        return acc
    }, [])
    return { props: { modules, options } }
}
