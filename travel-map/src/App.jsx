import React, { useState } from 'react'
import MapView from './components/MapView'
import itinerary from '../data/itinerary_full.json'
import PackingList from './components/PackingList'

export default function App(){
  const [dayIndex, setDayIndex] = useState(0)
  const [showPacking, setShowPacking] = useState(false)

  return (
    <div className="app">
      <header className="header">
        <h1>Fourier Travel Italy</h1>
        <p className="subtitle">点击地图标记查看详细信息，点击“在 Google Maps 打开”跳转</p>
      </header>

      <section className="controls">
        {itinerary.days.map((d, i) => {
          const formatLabel = (title, idx, day) => {
            if(!title) return `DAY${idx+1}`
            // try to extract 'DAYn' + following text
            const m = title.match(/(DAY\s*\d+)\s*[\-–—:]?\s*(.*)$/i)
            if(m){
              const dayPart = m[1].toUpperCase().replace(/\s+/,'') // DAY1
              const place = m[2] ? m[2].trim() : (day.city || '')
              return place ? `${dayPart} ${place}` : dayPart
            }
            // fallback: if contains 'DAY' standalone
            const m2 = title.match(/DAY\s*\d+/i)
            if(m2){
              const dayPart = m2[0].toUpperCase().replace(/\s+/,'')
              const rest = title.split(m2[0])[1] || ''
              const place = rest.replace(/^[\s\-–—:]+/, '').trim() || (day.city || '')
              return place ? `${dayPart} ${place}` : dayPart
            }
            // otherwise, use provided city or generic DAY index
            return day.city ? `DAY${idx+1} ${day.city}` : `DAY${idx+1}`
          }

          const label = formatLabel(d.title, i, d)
          return <button key={i} className={i===dayIndex? 'active':''} onClick={()=>{setShowPacking(false);setDayIndex(i)}}>{label}</button>
        })}
        <button onClick={()=>setShowPacking(s=>!s)} style={{marginLeft:12}}>{showPacking? '返回地图':'行李清单'}</button>
      </section>

      <main className="main">
        {showPacking ? <PackingList /> : <MapView day={itinerary.days[dayIndex]} />}
      </main>
    </div>
  )
}
