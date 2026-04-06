import React, { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, Tooltip, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix default marker icon path in some bundlers
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

export default function MapView({ day }){
  const positions = day.places.map(p => [p.lat, p.lng])
  const [showLabels, setShowLabels] = React.useState(true)

  // build segment list (pairs) with transport/time info
  const segments = []
  for (let i = 0; i < day.places.length - 1; i++){
    const a = day.places[i]
    const b = day.places[i+1]
    const info = a.to_next || b.to_prev || null
    segments.push({positions:[[a.lat,a.lng],[b.lat,b.lng]], info})
  }

  const center = positions.length? positions[0] : [0,0]

  // auto center component: fit bounds to today's positions when `day` changes
  function AutoCenter({positions, center}){
    const map = useMap()
    useEffect(()=>{
      if(!positions || positions.length===0) return
      try{
        if(positions.length === 1){
          map.setView(center, 14)
        } else {
          map.fitBounds(positions, {padding: [60,60]})
        }
      }catch(e){console.warn(e)}
    }, [positions?.length])
    return null
  }

  // watch zoom to decide whether to show permanent labels
  function ZoomManager({setShow}){
    const map = useMap()
    useEffect(()=>{
      const update = ()=> setShow(map.getZoom() >= 13)
      update()
      map.on('zoomend', update)
      return ()=> map.off('zoomend', update)
    }, [map])
    return null
  }

    // numbered badge icon for sequence order
    const makeNumberIcon = (num) => {
      return L.divIcon({
        className: 'comic-marker-number',
        html: `<div class="marker-number">${num}</div>`,
        iconSize: [36,36],
        iconAnchor: [18,36]
      })
    }

    // arrow icon for segment direction
    const makeArrowIcon = (angle)=>{
      const html = `<div class="segment-arrow" style="transform: rotate(${angle}deg)">➤</div>`
      return L.divIcon({
        className: 'segment-arrow-icon',
        html,
        iconSize: [24,24],
        iconAnchor: [12,12]
      })
    }

    const pickTransportEmoji = (transport)=>{
      if(!transport) return '❓'
      const t = transport.toLowerCase()
      if(/步行|walk/.test(t)) return '🚶'
      if(/bus|公交|coach|airlink/.test(t)) return '🚌'
      if(/train|火车|rail/.test(t)) return '🚆'
      if(/metro|地铁/.test(t)) return '🚇'
      if(/boat|water|vaporetti|gondola|船/.test(t)) return '🛶'
      return '🚗'
    }

    const makeTransportIcon = (emoji) => {
      return L.divIcon({
        className: 'transport-icon',
        html: `<div class="transport-badge">${emoji}</div>`,
        iconSize: [28,28],
        iconAnchor: [14,14]
      })
    }

  // (removed old emoji maker) keep numeric and arrow icons only

  return (
    <div className="map-wrap" style={{position:'relative'}}>
      <MapContainer center={center} zoom={13} style={{height: '55vh', width: '100%'}}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {/* legend overlay */}
        <div className="map-legend" style={{zIndex:600}}>
          <b>说明</b>
          <div style={{display:'flex',gap:8,alignItems:'center'}}><div style={{width:18}}>📍</div><div>景点</div></div>
          <div style={{display:'flex',gap:8,alignItems:'center',marginTop:6}}><div style={{width:18}}>🚶</div><div>步行</div></div>
          <div style={{display:'flex',gap:8,alignItems:'center',marginTop:6}}><div style={{width:18}}>🚆</div><div>火车</div></div>
          <div style={{display:'flex',gap:8,alignItems:'center',marginTop:6}}><div style={{width:18}}>🚌</div><div>公交车</div></div>
        </div>

        <AutoCenter positions={positions} center={center} />
        <ZoomManager setShow={setShowLabels} />

        {day.places.map((p, idx) => (
          <Marker key={idx} position={[p.lat, p.lng]} icon={makeNumberIcon(idx+1)}>
            <Popup>
              <div style={{maxWidth: 260}}>
                <h3 style={{margin:'4px 0'}}>{p.name}</h3>
                <p style={{margin: '6px 0'}}>{p.desc}</p>
                {p.time && <p><strong>时间：</strong>{p.time}</p>}
                {p.duration_minutes !== undefined && <p><strong>预计停留：</strong>{p.duration_minutes} 分钟</p>}
                {p.transport && <p><strong>常见交通：</strong>{p.transport}</p>}
                <a href={`https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}`} target="_blank" rel="noreferrer">在 Google Maps 打开</a>
              </div>
            </Popup>
            {/* permanent label near marker to show name on map */}
            <Tooltip direction="top" offset={[0,-30]} permanent={showLabels} className="place-label">{p.name}</Tooltip>
          </Marker>
        ))}

        {segments.map((seg, i) => (
          <React.Fragment key={i}>
            <Polyline positions={seg.positions} color={'#d9557a'} weight={4} opacity={0.9} />
            {seg.info && seg.info.duration_minutes && (
              <Polyline positions={seg.positions} interactive={false} weight={0}>
                <Tooltip sticky>
                  <div style={{fontSize:12}}>{seg.info.transport} · 约 {seg.info.duration_minutes} 分钟</div>
                </Tooltip>
              </Polyline>
            )}
            {/* arrow at midpoint */}
            {(() => {
              const [a,b] = seg.positions
              const mid = [(a[0]+b[0])/2, (a[1]+b[1])/2]
              // compute angle in degrees from a->b (lon/lat) approximate
              const dy = b[0]-a[0]
              const dx = b[1]-a[1]
              const angle = Math.atan2(dy, dx) * 180 / Math.PI
              const transportEmoji = seg.info ? pickTransportEmoji(seg.info.transport || '') : null
              return (
                transportEmoji ? <Marker key={'trans-'+i} position={mid} icon={makeTransportIcon(transportEmoji)} interactive={false} /> : null
              )
            })()}
          </React.Fragment>
        ))}
      </MapContainer>
    </div>
  )
}
