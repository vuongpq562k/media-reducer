import axios from 'axios'
import JSZip from 'jszip'
 
const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'
 
/** Wake up a Render free-tier service before sending the real request. */
async function ensureBackendAwake(): Promise<void> {
  try {
    await axios.get(`${BASE_URL}/api/health`, { timeout: 60_000 })
  } catch {
    // ignore — the real request will surface any actual error
  }
}
 
export type VideoSize = 'original' | '1280' | '480'
 
/** Max files sent in a single /api/reduce request. */
const BATCH_SIZE = 5
 
export interface ReducedFile {
  name: string
  size: number
  blob: Blob
  url: string
}
 
export interface ReducedResult {
  zipBlob: Blob
  zipFilename: string
  files: ReducedFile[]
}
 
export interface BatchProgress {
  done: number
  total: number
}
 
/** Send one batch of files to the backend and unpack the returned ZIP sequentially. */
export async function reduceFiles(
  files: File[],
  convertToWebp: boolean,
  aggressive: boolean,
  videoSize: VideoSize,
): Promise<ReducedResult> {
  const form = new FormData()
  files.forEach(f => form.append('files', f))
  form.append('convert_to_webp', String(convertToWebp))
  form.append('aggressive', String(aggressive))
  form.append('video_size', videoSize)
 
  await ensureBackendAwake()
 
  const res = await axios.post(`${BASE_URL}/api/reduce`, form, {
    responseType: 'blob',
    timeout: 5 * 60_000, // 5 minutes — enough for large video compression
  })
 
  const disposition: string = res.headers['content-disposition'] ?? ''
  const match = disposition.match(/filename="(.+?)"/)
  const zipFilename = match ? match[1] : 'reduced.zip'
  const zipBlob: Blob = res.data
 
  // Unpack ZIP entries sequentially to avoid memory spikes from concurrent blob materialisation
  const zip = await JSZip.loadAsync(zipBlob)
  const entries = Object.entries(zip.files).filter(([, entry]) => !entry.dir)
  const reduced: ReducedFile[] = []
 
  for (const [relativePath, entry] of entries) {
    const blob = await entry.async('blob')
    // Strip the folder prefix (e.g. "reduced_1234567890/photo.webp" → "photo.webp")
    const name = relativePath.split('/').pop() ?? relativePath
    const url = URL.createObjectURL(blob)
    reduced.push({ name, size: blob.size, blob, url })
  }
 
  reduced.sort((a, b) => a.name.localeCompare(b.name))
 
  return { zipBlob, zipFilename, files: reduced }
}
 
/**
 * Split files into batches of BATCH_SIZE, process each batch sequentially,
 * merge all results, then rebuild a single combined ZIP in the browser.
 */
export async function reduceFilesInBatches(
  files: File[],
  convertToWebp: boolean,
  aggressive: boolean,
  videoSize: VideoSize,
  onProgress: (progress: BatchProgress) => void,
): Promise<ReducedResult> {
  const batches: File[][] = []
  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    batches.push(files.slice(i, i + BATCH_SIZE))
  }
 
  const allFiles: ReducedFile[] = []
 
  for (let i = 0; i < batches.length; i++) {
    const result = await reduceFiles(batches[i], convertToWebp, aggressive, videoSize)
    allFiles.push(...result.files)
    onProgress({ done: i + 1, total: batches.length })
  }
 
  allFiles.sort((a, b) => a.name.localeCompare(b.name))
 
  // Rebuild a single combined ZIP from all individual file blobs
  const combinedZip = new JSZip()
  const ts = Date.now()
  const folderName = `reduced_${ts}`
  for (const f of allFiles) {
    combinedZip.file(`${folderName}/${f.name}`, f.blob)
  }
  const zipBlob = await combinedZip.generateAsync({ type: 'blob', compression: 'DEFLATE' })
  const zipFilename = `${folderName}.zip`
 
  return { zipBlob, zipFilename, files: allFiles }
}
 
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}