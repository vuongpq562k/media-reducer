use std::sync::Mutex;
use tauri::{Manager, RunEvent};
use tauri_plugin_shell::{process::CommandChild, ShellExt};

struct BackendProcess(Mutex<Option<CommandChild>>);

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            // Spawn the FastAPI backend sidecar
            let sidecar = app.shell().sidecar("backend").expect("backend sidecar not found");
            let (_rx, child) = sidecar.spawn().expect("Failed to spawn backend sidecar");
            app.manage(BackendProcess(Mutex::new(Some(child))));

            // Show the window once the backend is ready (port 8000 is accepting connections)
            let handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                wait_for_backend().await;
                if let Some(window) = handle.get_webview_window("main") {
                    let _ = window.show();
                }
            });

            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app, event| {
            // Kill the backend sidecar when the app exits
            if let RunEvent::Exit = event {
                if let Some(state) = app.try_state::<BackendProcess>() {
                    if let Ok(mut guard) = state.0.lock() {
                        if let Some(child) = guard.take() {
                            let _ = child.kill();
                        }
                    }
                }
            }
        });
}

/// Poll localhost:8000 until the backend is accepting connections (max 30s).
async fn wait_for_backend() {
    for _ in 0..60 {
        if tokio::net::TcpStream::connect("127.0.0.1:8000").await.is_ok() {
            // Give uvicorn a moment to finish initialising its routes
            tokio::time::sleep(std::time::Duration::from_millis(300)).await;
            return;
        }
        tokio::time::sleep(std::time::Duration::from_millis(500)).await;
    }
}
