import axios from 'axios'
import JSZip from 'jszip'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export type VideoSize = 'original' | '1280' | '480'

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

  const res = await axios.post(`${BASE_URL}/api/reduce`, form, {
    responseType: 'blob',
  })

  const disposition: string = res.headers['content-disposition'] ?? ''
  const match = disposition.match(/filename="(.+?)"/)
  const zipFilename = match ? match[1] : 'reduced.zip'
  const zipBlob: Blob = res.data

  // Unpack the ZIP to extract individual files
  const zip = await JSZip.loadAsync(zipBlob)
  const reduced: ReducedFile[] = []

  await Promise.all(
    Object.entries(zip.files)
      .filter(([, entry]) => !entry.dir)
      .map(async ([relativePath, entry]) => {
        const blob = await entry.async('blob')
        // Strip the folder prefix (e.g. "reduced_1234567890/photo.webp" → "photo.webp")
        const name = relativePath.split('/').pop() ?? relativePath
        const url = URL.createObjectURL(blob)
        reduced.push({ name, size: blob.size, blob, url })
      }),
  )

  // Sort alphabetically by name
  reduced.sort((a, b) => a.name.localeCompare(b.name))

  return { zipBlob, zipFilename, files: reduced }
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
