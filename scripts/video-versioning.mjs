import { createHash } from 'crypto'
import path from 'path'

export function hashBuffer(buffer, length = 16) {
  return createHash('sha256').update(buffer).digest('hex').slice(0, length)
}

export function buildVersionedFilename(baseName, hash) {
  const ext = path.extname(baseName)
  const stem = baseName.slice(0, -ext.length)
  return `${stem}.${hash}${ext}`
}

export function selectBlobsToDelete(blobs, keepUrl, baseFilename) {
  const ext = path.extname(baseFilename)
  const stem = baseFilename.slice(0, -ext.length)

  return blobs.filter((blob) => {
    const matchesVideo = blob.pathname.startsWith(`${stem}.`) && blob.pathname.endsWith(ext)
    return matchesVideo && blob.url !== keepUrl
  })
}
