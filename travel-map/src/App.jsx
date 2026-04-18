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
        <button className="export-btn" onClick={async ()=>{
          // dynamic import to keep bundle small
          const [{default: html2canvas}, {jsPDF}] = await Promise.all([import('html2canvas'), import('jspdf')])
          const appEl = document.querySelector('.app')
          if(!appEl){ return alert('找不到页面内容，无法导出') }

          // clone node and apply background matching .body-bg styles
          const clone = appEl.cloneNode(true)
          clone.style.boxSizing = 'border-box'
          clone.style.width = getComputedStyle(appEl).width
          clone.style.backgroundImage = "url('/assets/bg-oil.jpg')"
          clone.style.backgroundSize = 'cover'
          clone.style.backgroundPosition = 'center'
          clone.style.backgroundRepeat = 'no-repeat'

          // add overlay similar to .body-bg::after
          const overlay = document.createElement('div')
          overlay.style.position = 'absolute'
          overlay.style.inset = '0'
          overlay.style.background = 'rgba(8,8,10,0.16)'
          overlay.style.pointerEvents = 'none'
          clone.style.position = 'relative'
          clone.appendChild(overlay)

          // attach offscreen
          clone.style.position = 'fixed'
          clone.style.left = '-9999px'
          document.body.appendChild(clone)

          try{
            const canvas = await html2canvas(clone, {useCORS:true, scale:2, backgroundColor: null})
            const imgData = canvas.toDataURL('image/jpeg', 0.95)
            const pdf = new jsPDF('p','pt','a4')
            const pageWidth = pdf.internal.pageSize.getWidth()
            const pageHeight = pdf.internal.pageSize.getHeight()
            // fit canvas into page while preserving aspect
            const imgW = canvas.width
            const imgH = canvas.height
            const ratio = Math.min(pageWidth / imgW, pageHeight / imgH)
            const drawW = imgW * ratio
            const drawH = imgH * ratio
            pdf.addImage(imgData, 'JPEG', (pageWidth - drawW)/2, 20, drawW, drawH)
            pdf.save('Fourier_Travel_Itinerary.pdf')
          }catch(e){
            console.error(e)
            alert('导出失败：' + (e.message||e))
          }finally{
            document.body.removeChild(clone)
          }
        }}>导出为 PDF</button>
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
