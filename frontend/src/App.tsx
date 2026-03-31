import { useState } from 'react'
import { Minimize2 } from 'lucide-react'
import DropZone from './components/DropZone'
import FileList from './components/FileList'
import ProgressBar from './components/ProgressBar'
import { reduceFiles } from './api'

export default function App() {
  const [files, setFiles] = useState<File[]>([])
  const [convertToWebp, setConvertToWebp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleAddFiles = (incoming: File[]) => {
    setSuccess(false)
    setError(null)
    setFiles(prev => {
      const existing = new Set(prev.map(f => f.name))
      return [...prev, ...incoming.filter(f => !existing.has(f.name))]
    })
  }

  const handleRemove = (name: string) => {
    setFiles(prev => prev.filter(f => f.name !== name))
  }

  const handleReduce = async () => {
    if (!files.length) return
    setLoading(true)
    setError(null)
    setSuccess(false)
    try {
      await reduceFiles(files, convertToWebp)
      setSuccess(true)
      setFiles([])
    } catch {
      setError('Something went wrong. Make sure the backend is running and try again.')
    } finally {
      setLoading(false)
    }
  }

  const hasImages = files.some(f => f.type.startsWith('image/'))

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">

        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex items-center justify-center rounded-2xl bg-blue-600/20 p-3 ring-1 ring-blue-500/30">
            <Minimize2 size={28} className="text-blue-400" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white">Media Reducer</h1>
          <p className="mt-2 text-slate-400">Compress images & videos — keep quality, lose the weight.</p>
        </div>

        {/* Card */}
        <div className="space-y-5 rounded-2xl border border-slate-700 bg-slate-800/50 p-6 shadow-2xl backdrop-blur">

          <DropZone onFilesAdded={handleAddFiles} disabled={loading} />

          {files.length > 0 && (
            <FileList files={files} onRemove={handleRemove} disabled={loading} />
          )}

          {/* WebP toggle — only shown when images are present */}
          {hasImages && (
            <div className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-700/30 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-slate-200">Convert images to WebP</p>
                <p className="text-xs text-slate-500">25–35% smaller than JPEG/PNG, full quality</p>
              </div>
              <button
                role="switch"
                aria-checked={convertToWebp}
                onClick={() => setConvertToWebp(v => !v)}
                disabled={loading}
                className={[
                  'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50',
                  convertToWebp ? 'bg-blue-500' : 'bg-slate-600',
                ].join(' ')}
              >
                <span
                  className={[
                    'inline-block h-4 w-4 translate-y-1 transform rounded-full bg-white shadow transition-transform duration-200',
                    convertToWebp ? 'translate-x-6' : 'translate-x-1',
                  ].join(' ')}
                />
              </button>
            </div>
          )}

          {/* Progress */}
          {loading && <ProgressBar />}

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">
              Done! Your compressed files are downloading as a ZIP.
            </div>
          )}

          {/* Reduce button */}
          <button
            onClick={handleReduce}
            disabled={files.length === 0 || loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 px-6 font-semibold text-white shadow-lg transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-400"
          >
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Processing…
              </>
            ) : (
              `Reduce ${files.length > 0 ? `${files.length} file${files.length !== 1 ? 's' : ''}` : 'Files'}`
            )}
          </button>

        </div>

        <p className="mt-6 text-center text-xs text-slate-600">
          Files are processed on the server and never stored permanently.
        </p>
      </div>
    </div>
  )
}
