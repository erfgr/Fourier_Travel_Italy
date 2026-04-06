const fs = require('fs')
const path = require('path')
const pdf = require('pdf-parse')

const pdfPath = path.resolve(__dirname, '..', '2026.04意大利攻略.pdf')
const outText = path.resolve(__dirname, '..', 'data', 'pdf-extract.txt')
const outGuess = path.resolve(__dirname, '..', 'data', 'itinerary_guess.json')

if (!fs.existsSync(pdfPath)){
  console.error('找不到 PDF 文件：', pdfPath)
  process.exit(2)
}

const dataBuffer = fs.readFileSync(pdfPath)

pdf(dataBuffer).then(function(data) {
  // 全文写入，供人工校对
  fs.writeFileSync(outText, data.text, 'utf8')
  console.log('已将提取的文本写入', outText)

  // 简单尝试：按日期（格式 04.09 或 04.09 周）分段
  const lines = data.text.split(/\r?\n/).map(l=>l.trim()).filter(Boolean)
  const chunks = []
  let current = {title: '其他', places: []}
  for (const line of lines){
    if (/^\d{2}\.\d{2}/.test(line)){
      if (current && current.places.length) chunks.push(current)
      current = {title: line, places: []}
      continue
    }
    // 尝试捕获景点行（简化规则：含中文地名或英文括号）
    if (/\p{Han}+/.test(line) || /\(|\)/.test(line)){
      current.places.push({raw: line})
    }
  }
  if (current && current.places.length) chunks.push(current)

  fs.writeFileSync(outGuess, JSON.stringify({chunks}, null, 2), 'utf8')
  console.log('已写入初步解析结果：', outGuess)
  console.log('\n注意：该解析为启发式分割，需要人工校对并补充经纬度与时间信息。')
}).catch(err=>{
  console.error('解析 PDF 出错：', err)
})
