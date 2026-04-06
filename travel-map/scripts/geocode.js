const fs = require('fs')
const https = require('https')
const path = require('path')

const infile = path.resolve(__dirname, '..', 'data', 'itinerary_full.json')
const outfile = path.resolve(__dirname, '..', 'data', 'itinerary_full_geocoded.json')

function nominatimSearch(q){
  const url = 'https://nominatim.openstreetmap.org/search?q=' + encodeURIComponent(q) + '&format=json&limit=1&accept-language=en'
  const opts = {
    headers: {
      'User-Agent': 'travel-map-geocoder/1.0 (your-email@example.com)'
    }
  }
  return new Promise((resolve, reject)=>{
    https.get(url, opts, res=>{
      let raw = ''
      res.on('data', c=> raw += c)
      res.on('end', ()=>{
        if(res.statusCode === 429){
          return reject({rateLimit:true})
        }
        try{ const json = JSON.parse(raw); resolve({status:res.statusCode, body:json}) }catch(e){ reject(e) }
      })
    }).on('error', reject)
  })
}

async function run(){
  if(!fs.existsSync(infile)){
    console.error('缺少文件：', infile)
    process.exit(2)
  }
  const data = JSON.parse(fs.readFileSync(infile,'utf8'))
  for(const day of data.days){
    for(const place of day.places){
      const qParts = [place.name]
      if(place.desc) qParts.push(place.desc.split(',')[0])
      if(day.city) qParts.push(day.city)
      qParts.push('Italy')
      const q = qParts.join(', ')
      console.log('查询：', q)
      try{
        const res = await nominatimSearch(q)
        if(res.body && res.body.length>0){
          const r = res.body[0]
          place.lat = parseFloat(r.lat)
          place.lng = parseFloat(r.lon)
          place._geocoded = {display_name: r.display_name, osm_type: r.osm_type, osm_id: r.osm_id}
          console.log('->', place.lat, place.lng)
        }else{
          console.log('未找到匹配结果，跳过')
        }
      }catch(err){
        if(err && err.rateLimit){
          console.warn('遇到限流 (429)，等待 5s 后重试...')
          await new Promise(r=>setTimeout(r,5000))
          // retry once
          try{ const res2 = await nominatimSearch(q); if(res2.body && res2.body.length>0){ const r=res2.body[0]; place.lat=parseFloat(r.lat); place.lng=parseFloat(r.lon); place._geocoded={display_name:r.display_name,osm_type:r.osm_type,osm_id:r.osm_id}; console.log('->',place.lat,place.lng)} }catch(e){ console.error('重试失败，跳过', e) }
        }else{
          console.error('查询出错，跳过：', err)
        }
      }
      // 1s pause to be polite
      await new Promise(r=>setTimeout(r,1100))
    }
  }

  fs.writeFileSync(outfile, JSON.stringify(data,null,2),'utf8')
  console.log('已写入：', outfile)
}

run().catch(err=>{ console.error(err); process.exit(1) })
