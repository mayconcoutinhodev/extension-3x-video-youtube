/**
 * Generates minimal PNG icons using only Node.js built-ins (no npm packages needed).
 * Run: node scripts/generate-icons.mjs
 */
import { createDeflate } from 'zlib'
import { writeFileSync, mkdirSync } from 'fs'
import { promisify } from 'util'
import { pipeline } from 'stream'
import { Writable, Readable } from 'stream'

const pipelineAsync = promisify(pipeline)

function crc32(buf) {
  let crc = -1
  const table = new Uint32Array(256).map((_, i) => {
    let c = i
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    return c
  })
  for (const byte of buf) crc = table[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  return (crc ^ -1) >>> 0
}

function chunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii')
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const payload = Buffer.concat([typeBytes, data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(payload), 0)
  return Buffer.concat([len, payload, crc])
}

async function deflateBuffer(buf) {
  const chunks = []
  const deflate = createDeflate({ level: 9 })
  const output = new Writable({
    write(chunk, _, cb) { chunks.push(chunk); cb() }
  })
  await pipelineAsync(Readable.from(buf), deflate, output)
  return Buffer.concat(chunks)
}

async function makePNG(size, r, g, b) {
  // PNG signature
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

  // IHDR
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8   // bit depth
  ihdr[9] = 2   // color type: RGB
  // compression, filter, interlace = 0
  const ihdrChunk = chunk('IHDR', ihdr)

  // Raw image data: filter byte (0) + RGB pixels per row
  const rowSize = 1 + size * 3
  const raw = Buffer.alloc(size * rowSize)
  for (let y = 0; y < size; y++) {
    const off = y * rowSize
    raw[off] = 0 // filter byte
    for (let x = 0; x < size; x++) {
      // Draw a filled circle with anti-aliasing
      const cx = size / 2, cy = size / 2, radius = size / 2 - 0.5
      const dx = x - cx + 0.5, dy = y - cy + 0.5
      const dist = Math.sqrt(dx * dx + dy * dy)
      const alpha = Math.max(0, Math.min(1, radius - dist + 0.5))
      const pr = Math.round(r * alpha + 30 * (1 - alpha))
      const pg = Math.round(g * alpha + 30 * (1 - alpha))
      const pb = Math.round(b * alpha + 30 * (1 - alpha))
      raw[off + 1 + x * 3] = pr
      raw[off + 1 + x * 3 + 1] = pg
      raw[off + 1 + x * 3 + 2] = pb
    }
  }

  const compressed = await deflateBuffer(raw)
  const idatChunk = chunk('IDAT', compressed)
  const iendChunk = chunk('IEND', Buffer.alloc(0))

  return Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk])
}

async function main() {
  mkdirSync('public/icons', { recursive: true })

  const sizes = [16, 32, 48, 128]
  for (const size of sizes) {
    const png = await makePNG(size, 204, 0, 0) // YouTube red
    writeFileSync(`public/icons/icon${size}.png`, png)
    console.log(`✓ icon${size}.png`)
  }
  console.log('\nIcons generated in public/icons/')
  console.log('Add them to manifest.json → "icons" and "action.default_icon" when ready.')
}

main().catch(console.error)
