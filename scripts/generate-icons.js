// scripts/generate-icons.js
// Run: node scripts/generate-icons.js
// Generates placeholder SVG-based PNG icons for PWA

const fs = require('fs')
const path = require('path')

const iconsDir = path.join(__dirname, '../public/icons')
if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true })

// Create SVG icon content
function createSVG(size) {
  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="#09090b"/>
  <text x="50%" y="55%" text-anchor="middle" dominant-baseline="middle" 
        font-size="${size * 0.5}" font-family="serif">🏏</text>
</svg>`
}

// Write SVG files (rename to .svg)
const sizes = [192, 512]
for (const size of sizes) {
  fs.writeFileSync(path.join(iconsDir, `icon-${size}.svg`), createSVG(size))
  console.log(`Created icon-${size}.svg`)
}

console.log('Icons created as SVG. For production, convert to PNG using a tool like sharp or Inkscape.')
console.log('Or replace with proper PNG icons.')
