import { Download, FileImage, FileVideo, Archive, RotateCcw } from 'lucide-react'
import type { ReducedFile, ReducedResult } from '../api'
import { downloadBlob } from '../api'

interface Props {
  result: ReducedResult
  onReset: () => void
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function FileIcon({ name }: { name: string }) {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  const isVideo = ['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)
  return isVideo
    ? <FileVideo size={16} className="shrink-0 text-purple-500 dark:text-purple-400" />
    : <FileImage size={16} className="shrink-0 text-blue-500 dark:text-blue-400" />
}

function FileRow({ file }: { file: ReducedFile }) {
  return (
    <li className="flex items-center gap-3 rounded-lg bg-slate-100 px-3 py-2 dark:bg-slate-700/40">
      <FileIcon name={file.name} />
      <span className="min-w-0 flex-1 truncate text-sm text-slate-700 dark:text-slate-200">{file.name}</span>
      <span className="shrink-0 text-xs text-slate-400 dark:text-slate-500">{formatBytes(file.size)}</span>
      <button
        onClick={() => downloadBlob(file.blob, file.name)}
        className="shrink-0 flex items-center gap-1 rounded-md bg-slate-200 px-2 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-300 dark:bg-slate-600 dark:text-slate-200 dark:hover:bg-slate-500"
        title={`Download ${file.name}`}
      >
        <Download size={12} />
        Download
      </button>
    </li>
  )
}

export default function ResultsPanel({ result, onReset }: Props) {
  const totalSize = result.files.reduce((sum, f) => sum + f.size, 0)

  return (
    <div className="space-y-4 rounded-xl border border-green-500/30 bg-green-500/5 p-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-green-600 dark:text-green-400">
            {result.files.length} file{result.files.length !== 1 ? 's' : ''} compressed
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500">Total size: {formatBytes(totalSize)}</p>
        </div>
      </div>

      {/* Individual file list */}
      <ul className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
        {result.files.map(file => (
          <FileRow key={file.name} file={file} />
        ))}
      </ul>

      {/* Download all as ZIP */}
      <button
        onClick={() => downloadBlob(result.zipBlob, result.zipFilename)}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-700/50 dark:text-slate-200 dark:hover:bg-slate-600"
      >
        <Archive size={16} />
        Download all as ZIP
        <span className="ml-1 text-xs font-normal text-slate-400 dark:text-slate-500">({result.zipFilename})</span>
      </button>

      {/* Reload / back to upload */}
      <button
        onClick={onReset}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 px-4 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800/40 dark:text-slate-300 dark:hover:bg-slate-700/50"
      >
        <RotateCcw size={15} />
        Compress more files
      </button>

    </div>
  )
}
