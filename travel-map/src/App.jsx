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
          // export per-day PDF pages using html2canvas + jsPDF
          let html2canvas, jsPDF
          try{ const m1 = await import('html2canvas'); html2canvas = m1 && (m1.default || m1) }catch(e){ console.error(e); return alert('缺少依赖 html2canvas，请运行 npm install') }
          try{ const m2 = await import('jspdf'); jsPDF = (m2 && (m2.jsPDF || m2.default || m2)) }catch(e){ console.error(e); return alert('缺少依赖 jspdf，请运行 npm install') }

          const pdf = new jsPDF('p','pt','a4')
          const pageWidth = pdf.internal.pageSize.getWidth()
          const pageHeight = pdf.internal.pageSize.getHeight()

          // helper to render a day layout into a temporary DOM node
          const renderDayNode = (day)=>{
            const wrap = document.createElement('div')
            wrap.style.boxSizing = 'border-box'
            wrap.style.width = '1024px'
            wrap.style.padding = '28px'
            wrap.style.fontFamily = getComputedStyle(document.body).fontFamily || 'sans-serif'
            wrap.style.backgroundImage = "url('/assets/bg-oil.jpg')"
            wrap.style.backgroundSize = 'cover'
            wrap.style.backgroundPosition = 'center'
            wrap.style.position = 'relative'

            const overlay = document.createElement('div')
            overlay.style.position = 'absolute'
            overlay.style.inset = '0'
            overlay.style.background = 'rgba(8,8,10,0.12)'
            overlay.style.pointerEvents = 'none'
            wrap.appendChild(overlay)

            const container = document.createElement('div')
            container.style.position = 'relative'
            container.style.zIndex = '2'
            container.style.color = '#0f1720'

            const h = document.createElement('h2')
            h.textContent = `${day.title || ''}`
            h.style.color = 'var(--accent)'
            h.style.margin = '6px 0 12px'
            container.appendChild(h)

            for(const p of day.places){
              const item = document.createElement('div')
              item.style.marginBottom = '10px'
              const name = document.createElement('div')
              name.textContent = p.name
              name.style.fontWeight = '800'
              name.style.marginBottom = '4px'
              const desc = document.createElement('div')
              desc.textContent = p.desc || ''
              desc.style.marginBottom = '4px'
              const meta = document.createElement('div')
              meta.style.fontSize = '13px'
              meta.style.opacity = '0.9'
              const parts = []
              if(p.time) parts.push(`时间: ${p.time}`)
              if(p.duration_minutes !== undefined) parts.push(`预计停留: ${p.duration_minutes} 分钟`)
              if(p.transport) parts.push(`交通: ${p.transport}`)
              meta.textContent = parts.join(' · ')
              item.appendChild(name)
              item.appendChild(desc)
              item.appendChild(meta)
              container.appendChild(item)
            }

            wrap.appendChild(container)
            return wrap
          }

          // generate pages for each day
          // try capture current visible map once to reuse as thumbnail
          let mapThumbData = null
          try{
            const mapEl = document.querySelector('.map-wrap')
            if(mapEl){
              const mapCanvas = await html2canvas(mapEl, {useCORS:true, scale:1, backgroundColor: null})
              mapThumbData = mapCanvas.toDataURL('image/png')
            }
          }catch(e){ console.warn('map capture failed, skipping thumbnail', e) }

          for(let i=0;i<itinerary.days.length;i++){
            const day = itinerary.days[i]
            const node = renderDayNode(day)
            node.style.position = 'fixed'
            node.style.left = '-9999px'
            document.body.appendChild(node)
            try{
              const canvas = await html2canvas(node, {useCORS:true, scale:2, backgroundColor: null})
              const imgData = canvas.toDataURL('image/jpeg', 0.95)
              const imgW = canvas.width
              const imgH = canvas.height
              const ratio = Math.min(pageWidth / imgW, pageHeight / imgH)
              const drawW = imgW * ratio
              const drawH = imgH * ratio
              if(i>0) pdf.addPage()
              pdf.addImage(imgData, 'JPEG', (pageWidth - drawW)/2, 20, drawW, drawH)
              // add map thumbnail if available (top-right)
              if(mapThumbData){
                const thumbW = 140
                const thumbH = 100
                pdf.addImage(mapThumbData, 'PNG', pageWidth - thumbW - 28, 28, thumbW, thumbH)
              }
              // footer / page number
              const footerText = `Page ${i+1} / ${itinerary.days.length}`
              pdf.setFontSize(10)
              pdf.setTextColor(80)
              pdf.text(footerText, pageWidth - 80, pageHeight - 30)
            }catch(e){ console.error('render day failed', e); alert('导出某页失败：' + (e.message||e)) }
            document.body.removeChild(node)
          }

          pdf.save('Fourier_Travel_Itinerary.pdf')
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
