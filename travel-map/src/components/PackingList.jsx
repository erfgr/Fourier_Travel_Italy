import React from 'react'
import packing from '../../data/packing.json'

export default function PackingList(){
  return (
    <div style={{padding:12}}>
      <h2 className="packing-title">行李清单</h2>
      {packing.sections.map((sec, idx) => (
        <section key={idx} style={{marginBottom:12}}>
          <h3 style={{margin:'8px 0'}}>{sec.title}</h3>
          <ul style={{paddingLeft:20}}>
            {sec.items.map((it, i) => (
              <li key={i}><input type="checkbox" style={{marginRight:8}} />{it}</li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
