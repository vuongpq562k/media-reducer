interface ProgressBarProps {
  label?: string
}
 
export default function ProgressBar({ label }: ProgressBarProps) {
  return (
    <div className="flex flex-col items-center gap-3 py-2">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
        <div className="h-full animate-[progress_1.5s_ease-in-out_infinite] rounded-full bg-blue-500" />
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        {label ?? 'Compressing files, please wait…'}
      </p>
    </div>
  )
}
 