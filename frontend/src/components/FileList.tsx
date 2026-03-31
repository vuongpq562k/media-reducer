import { ImageIcon, VideoIcon, X } from 'lucide-react'

interface Props {
  files: File[]
  onRemove: (name: string) => void
  disabled: boolean
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function isVideo(file: File): boolean {
  return file.type.startsWith('video/')
}

export default function FileList({ files, onRemove, disabled }: Props) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        {files.length} file{files.length !== 1 ? 's' : ''} selected
      </p>
      <ul className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
        {files.map(file => (
          <li
            key={file.name}
            className="flex items-center gap-3 rounded-lg bg-slate-700/40 px-3 py-2"
          >
            <span className="shrink-0 text-slate-400">
              {isVideo(file)
                ? <VideoIcon size={16} />
                : <ImageIcon size={16} />}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm text-slate-200">
              {file.name}
            </span>
            <span className="shrink-0 text-xs text-slate-500">
              {formatBytes(file.size)}
            </span>
            <button
              onClick={() => !disabled && onRemove(file.name)}
              disabled={disabled}
              className="shrink-0 rounded p-0.5 text-slate-500 transition-colors hover:bg-slate-600 hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label={`Remove ${file.name}`}
            >
              <X size={14} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
