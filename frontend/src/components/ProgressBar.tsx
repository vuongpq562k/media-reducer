export default function ProgressBar() {
  return (
    <div className="flex flex-col items-center gap-3 py-2">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-700">
        <div className="h-full animate-[progress_1.5s_ease-in-out_infinite] rounded-full bg-blue-500" />
      </div>
      <p className="text-xs text-slate-400">Compressing files, please wait…</p>
    </div>
  )
}
