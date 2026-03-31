!macro NSIS_HOOK_PREINSTALL
  nsExec::ExecToLog 'taskkill /F /IM "media-reducer.exe"'
  nsExec::ExecToLog 'taskkill /F /IM "backend.exe"'
  ; Brief pause to let OS release file handles
  Sleep 1000
!macroend
