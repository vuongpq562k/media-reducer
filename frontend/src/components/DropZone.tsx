import { useRef, useState } from 'react'
import { UploadCloud } from 'lucide-react'

const ACCEPTED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/quicktime',
  'video/x-msvideo',
  'video/x-matroska',
]

interface Props {
  onFilesAdded: (files: File[]) => void
  disabled: boolean
}

export default function DropZone({ onFilesAdded, disabled }: Props) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const accept = (fileList: FileList | null) => {
    if (!fileList) return
    const valid = Array.from(fileList).filter(f => ACCEPTED_TYPES.includes(f.type))
    if (valid.length) onFilesAdded(valid)
  }

  return (
    <div
      onClick={() => !disabled && inputRef.current?.click()}
      onDragOver={e => { e.preventDefault(); if (!disabled) setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => {
        e.preventDefault()
        setDragging(false)
        if (!disabled) accept(e.dataTransfer.files)
      }}
      className={[
        'relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors',
        disabled
          ? 'cursor-not-allowed border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/30'
          : dragging
          ? 'cursor-copy border-blue-400 bg-blue-50 dark:bg-blue-500/10'
          : 'cursor-pointer border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800/30 dark:hover:border-slate-400 dark:hover:bg-slate-700/30',
      ].join(' ')}
    >
      <UploadCloud
        size={40}
        className={dragging ? 'text-blue-500 dark:text-blue-400' : 'text-slate-400'}
      />
      <div>
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
          Drop files here or <span className="text-blue-500 dark:text-blue-400">browse</span>
        </p>
        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
          Images: JPG · PNG · WebP · GIF &nbsp;|&nbsp; Videos: MP4 · MOV · AVI · MKV
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPTED_TYPES.join(',')}
        className="hidden"
        onChange={e => accept(e.target.files)}
        disabled={disabled}
      />
    </div>
  )
}
