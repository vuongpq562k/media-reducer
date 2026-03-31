import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export async function reduceFiles(files: File[], convertToWebp: boolean): Promise<void> {
  const form = new FormData()
  files.forEach(f => form.append('files', f))
  form.append('convert_to_webp', String(convertToWebp))

  const res = await axios.post(`${BASE_URL}/api/reduce`, form, {
    responseType: 'blob',
  })

  const disposition: string = res.headers['content-disposition'] ?? ''
  const match = disposition.match(/filename="(.+?)"/)
  const filename = match ? match[1] : 'reduced.zip'

  const url = URL.createObjectURL(res.data)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
