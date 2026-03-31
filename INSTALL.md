# Installation Guide

## Install Media Reducer

### Step 1 — Download the installer

Go to the [Releases](../../releases) page and download the latest installer:

| File | Use this if… |
|------|-------------|
| `Media.Reducer_x.x.x_x64-setup.exe` | You just want to install the app (recommended) |
| `Media.Reducer_x.x.x_x64_en-US.msi` | Your company requires MSI packages |

### Step 2 — Run the installer

1. Double-click the downloaded `.exe` file.
2. If a **Windows SmartScreen** popup appears, click **More info** → **Run anyway**.
   *(This appears because the app is not yet signed with a paid certificate — it is safe.)*
3. Click **Next** → **Install** → **Finish**.

### Step 3 — Open the app

Open **Start**, search for **Media Reducer**, and click to launch.

> The app takes a few seconds to open on first launch — this is normal.

---

That's it. No extra software to install. Everything is included.

---

## Uninstall

1. Open **Start** → **Settings** → **Apps**
2. Search for **Media Reducer**
3. Click **Uninstall**

---

## Troubleshooting

### The app window never appears

Something else is using port **8000** on your computer. Open Task Manager, find any process using that port, and close it. Then relaunch Media Reducer.

To check which process is using port 8000, open **Command Prompt** and run:
```
netstat -ano | findstr :8000
```

### Video compression fails

This should not happen since FFmpeg is included in the installer. If you see an error, please [open an issue](../../issues) with the error message.

### Windows SmartScreen keeps blocking the installer

Right-click the installer file → **Properties** → check **Unblock** at the bottom → **OK**. Then run it again.
