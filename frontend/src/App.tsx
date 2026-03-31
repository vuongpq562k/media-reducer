import { useState, useEffect } from 'react'
import {
  Minimize2, Sun, Moon, Monitor,
  ImageIcon, VideoIcon, Film, Camera, Play, Music,
  Headphones, Radio, Tv, Aperture, Clapperboard, type LucideIcon,
} from 'lucide-react'
import DropZone from './components/DropZone'
import FileList from './components/FileList'
import ProgressBar from './components/ProgressBar'
import ResultsPanel from './components/ResultsPanel'
import { reduceFilesInBatches } from './api'
import type { VideoSize, ReducedResult, BatchProgress } from './api'
 
type Theme = 'light' | 'dark' | 'system'
 
function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    return (localStorage.getItem('theme') as Theme) ?? 'system'
  })
 
  useEffect(() => {
    const applyDark = (dark: boolean) => {
      document.documentElement.classList.toggle('dark', dark)
    }
 
    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      applyDark(mq.matches)
      const handler = (e: MediaQueryListEvent) => applyDark(e.matches)
      mq.addEventListener('change', handler)
      return () => mq.removeEventListener('change', handler)
    } else {
      applyDark(theme === 'dark')
    }
  }, [theme])
 
  const setTheme = (t: Theme) => {
    localStorage.setItem('theme', t)
    setThemeState(t)
  }
 
  return { theme, setTheme }
}
 
const themeOrder: Theme[] = ['system', 'light', 'dark']
 
interface BgIcon {
  Icon: LucideIcon
  x: number
  y: number
  size: number
  opacity: number
  duration: number
  delay: number
  animation: 'float-icon' | 'float-icon-rev' | 'sway'
  color: string
}
 
const BG_ICONS: BgIcon[] = [
  { Icon: ImageIcon,    x:  3,  y: 10, size: 56, opacity: 0.28, duration: 16, delay: 0,   animation: 'float-icon',     color: '#3b82f6' },
  { Icon: VideoIcon,    x: 88,  y:  7, size: 52, opacity: 0.25, duration: 20, delay: 3,   animation: 'float-icon-rev', color: '#8b5cf6' },
  { Icon: Film,         x: 12,  y: 70, size: 60, opacity: 0.26, duration: 14, delay: 1,   animation: 'float-icon',     color: '#ec4899' },
  { Icon: Camera,       x: 83,  y: 66, size: 64, opacity: 0.24, duration: 18, delay: 5,   animation: 'sway',           color: '#f97316' },
  { Icon: Play,         x: 49,  y:  2, size: 48, opacity: 0.22, duration: 22, delay: 2,   animation: 'float-icon-rev', color: '#10b981' },
  { Icon: Music,        x:  1,  y: 43, size: 44, opacity: 0.27, duration: 15, delay: 4,   animation: 'sway',           color: '#6366f1' },
  { Icon: Headphones,   x: 92,  y: 37, size: 54, opacity: 0.24, duration: 19, delay: 1,   animation: 'float-icon',     color: '#3b82f6' },
  { Icon: Radio,        x: 25,  y: 85, size: 46, opacity: 0.26, duration: 17, delay: 6,   animation: 'float-icon-rev', color: '#a855f7' },
  { Icon: Tv,           x: 73,  y: 81, size: 58, opacity: 0.24, duration: 13, delay: 3,   animation: 'float-icon',     color: '#14b8a6' },
  { Icon: Aperture,     x: 59,  y: 88, size: 66, opacity: 0.22, duration: 24, delay: 2,   animation: 'sway',           color: '#f59e0b' },
  { Icon: Clapperboard, x: 63,  y: 11, size: 50, opacity: 0.25, duration: 12, delay: 7,   animation: 'float-icon-rev', color: '#ef4444' },
  { Icon: ImageIcon,    x: 30,  y: 17, size: 36, opacity: 0.22, duration: 26, delay: 4,   animation: 'float-icon',     color: '#8b5cf6' },
  { Icon: Film,         x: 41,  y: 57, size: 40, opacity: 0.20, duration: 21, delay: 9,   animation: 'sway',           color: '#3b82f6' },
  { Icon: VideoIcon,    x: 77,  y: 27, size: 34, opacity: 0.23, duration: 17, delay: 8,   animation: 'float-icon',     color: '#10b981' },
  { Icon: Camera,       x: 19,  y: 34, size: 32, opacity: 0.21, duration: 23, delay: 5,   animation: 'float-icon-rev', color: '#f97316' },
  { Icon: Play,         x:  7,  y: 88, size: 38, opacity: 0.25, duration: 19, delay: 3,   animation: 'float-icon',     color: '#ec4899' },
  { Icon: Music,        x: 54,  y: 74, size: 42, opacity: 0.21, duration: 16, delay: 10,  animation: 'float-icon-rev', color: '#6366f1' },
  { Icon: Clapperboard, x: 37,  y: 93, size: 52, opacity: 0.23, duration: 20, delay: 1,   animation: 'sway',           color: '#f59e0b' },
]
 
function BackgroundIcons() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
      {BG_ICONS.map((item, i) => (
        <item.Icon
          key={i}
          size={item.size}
          strokeWidth={1.25}
          style={{
            position: 'absolute',
            left: `${item.x}%`,
            top: `${item.y}%`,
            opacity: item.opacity,
            color: item.color,
            animation: `${item.animation} ${item.duration}s ease-in-out ${item.delay}s infinite`,
          }}
        />
      ))}
    </div>
  )
}
 
function ThemeToggle({ theme, setTheme }: { theme: Theme; setTheme: (t: Theme) => void }) {
  const next = themeOrder[(themeOrder.indexOf(theme) + 1) % themeOrder.length]
  const labels: Record<Theme, string> = { system: 'System', light: 'Light', dark: 'Dark' }
 
  return (
    <button
      onClick={() => setTheme(next)}
      title={`Theme: ${labels[theme]} — click to switch`}
      className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
    >
      {theme === 'light' && <Sun size={14} />}
      {theme === 'dark' && <Moon size={14} />}
      {theme === 'system' && <Monitor size={14} />}
      {labels[theme]}
    </button>
  )
}
 
function Toggle({
  label,
  description,
  checked,
  onChange,
  disabled,
  accent = 'blue',
}: {
  label: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
  disabled: boolean
  accent?: 'blue' | 'orange'
}) {
  const activeColor = accent === 'orange' ? 'bg-orange-500' : 'bg-blue-500'
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-700/30">
      <div>
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</p>
        <p className="text-xs text-slate-400 dark:text-slate-500">{description}</p>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        disabled={disabled}
        className={[
          'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50',
          checked ? activeColor : 'bg-slate-300 dark:bg-slate-600',
        ].join(' ')}
      >
        <span
          className={[
            'inline-block h-4 w-4 translate-y-1 transform rounded-full bg-white shadow transition-transform duration-200',
            checked ? 'translate-x-6' : 'translate-x-1',
          ].join(' ')}
        />
      </button>
    </div>
  )
}
 
export default function App() {
  const { theme, setTheme } = useTheme()
  const [files, setFiles] = useState<File[]>([])
  const [convertToWebp, setConvertToWebp] = useState(true)
  const [aggressive, setAggressive] = useState(true)
  const [videoSize, setVideoSize] = useState<VideoSize>('1280')
  const [loading, setLoading] = useState(false)
  const [batchProgress, setBatchProgress] = useState<BatchProgress | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ReducedResult | null>(null)
 
  useEffect(() => {
    return () => {
      result?.files.forEach(f => URL.revokeObjectURL(f.url))
    }
  }, [result])
 
  const handleAddFiles = (incoming: File[]) => {
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
    setBatchProgress(null)
    setError(null)
    setResult(null)
    try {
      const r = await reduceFilesInBatches(
        files,
        convertToWebp,
        aggressive,
        videoSize,
        (progress) => setBatchProgress(progress),
      )
      setResult(r)
      setFiles([])
    } catch {
      setError('Something went wrong. Make sure the backend is running and try again.')
    } finally {
      setLoading(false)
      setBatchProgress(null)
    }
  }
 
  const handleReset = () => {
    setResult(null)
    setError(null)
    setFiles([])
  }
 
  const hasImages = files.some(f => f.type.startsWith('image/'))
  const hasVideos = files.some(f => f.type.startsWith('video/'))
 
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-100 flex items-center justify-center p-4 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <BackgroundIcons />
      <div className="relative z-10 w-full max-w-2xl">
 
        {/* Header */}
        <div className="mb-8 text-center relative">
          <div className="absolute right-0 top-0">
            <ThemeToggle theme={theme} setTheme={setTheme} />
          </div>
          <div className="mb-3 inline-flex items-center justify-center rounded-2xl bg-blue-600/20 p-3 ring-1 ring-blue-500/30">
            <Minimize2 size={28} className="text-blue-500 dark:text-blue-400" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">Media Reducer</h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400">Compress images & videos — keep quality, lose the weight.</p>
        </div>
 
        {/* Card */}
        <div className="space-y-5 rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-2xl backdrop-blur dark:border-slate-700 dark:bg-slate-800/50">
 
          {result ? (
            <ResultsPanel result={result} onReset={handleReset} />
          ) : (
            <>
              <DropZone onFilesAdded={handleAddFiles} disabled={loading} />
 
              {files.length > 0 && (
                <FileList files={files} onRemove={handleRemove} disabled={loading} />
              )}
 
              {/* Image options */}
              {hasImages && (
                <div className="space-y-2">
                  <Toggle
                    label="Convert images to WebP"
                    description="25–35% smaller than JPEG/PNG, full quality"
                    checked={convertToWebp}
                    onChange={setConvertToWebp}
                    disabled={loading}
                  />
                  <Toggle
                    label="Aggressive compression"
                    description="Resize to 2000px · lower quality — maximum image size reduction"
                    checked={aggressive}
                    onChange={setAggressive}
                    disabled={loading}
                    accent="orange"
                  />
                </div>
              )}
 
              {/* Video size options */}
              {hasVideos && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-700/30">
                  <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-200">Video resolution</p>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        { value: 'original', label: 'Original', desc: 'CRF 20 · no resize' },
                        { value: '1280',     label: '720p',     desc: 'CRF 23 · 1280px' },
                        { value: '480',      label: '480p',     desc: 'CRF 28 · 854px · max' },
                      ] as { value: VideoSize; label: string; desc: string }[]
                    ).map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setVideoSize(opt.value)}
                        disabled={loading}
                        className={[
                          'flex flex-col items-center rounded-lg border px-3 py-2 text-center transition-colors disabled:cursor-not-allowed disabled:opacity-50',
                          videoSize === opt.value
                            ? 'border-blue-500 bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300'
                            : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:border-slate-600 dark:bg-slate-800/40 dark:text-slate-400 dark:hover:border-slate-500 dark:hover:text-slate-300',
                        ].join(' ')}
                      >
                        <span className="text-sm font-semibold">{opt.label}</span>
                        <span className="mt-0.5 text-xs opacity-70">{opt.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
 
              {/* Progress */}
              {loading && (
                <ProgressBar
                  label={
                    batchProgress && batchProgress.total > 1
                      ? `Processing batch ${batchProgress.done} of ${batchProgress.total}…`
                      : undefined
                  }
                />
              )}
 
              {/* Error */}
              {error && (
                <div className="rounded-lg border border-red-400/50 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
                  {error}
                </div>
              )}
 
              {/* Reduce button */}
              <button
                onClick={handleReduce}
                disabled={files.length === 0 || loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 px-6 font-semibold text-white shadow-lg transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 dark:disabled:bg-slate-600 dark:disabled:text-slate-400"
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
            </>
          )}
 
        </div>
 
        <p className="mt-6 text-center text-xs text-slate-400 dark:text-slate-600">
          Files are processed on the server and never stored permanently.
        </p>
      </div>
    </div>
  )
}