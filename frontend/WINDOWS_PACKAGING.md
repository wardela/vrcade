# Windows Packaging

This Electron app is configured to package the already-built frontend `dist` output.

## What is included

- Electron main process files from `frontend/electron`
- Built frontend files from `frontend/dist`
- Required runtime dependencies
- App icon from `frontend/assets/fawtartak.ico`

The packaged app excludes source-only files such as `src`, Vite config, logs, and other development files.

## Commands

Run these from `frontend/`.

### 1. Build the frontend dist

```bash
npm run build:frontend
```

### 2. Package the desktop app using the existing dist

```bash
npm run package:desktop
```

This creates a packaged app for the current platform in `frontend/out/`.

### 3. Generate a Windows portable artifact from macOS

```bash
npm run make:win
```

This creates:

```text
frontend/out/make/zip/win32/x64/fawtartak-win32-x64-1.0.0.zip
```

### 4. Generate a Windows installer

```bash
npm run make:win:installer
```

On Windows this should produce the Squirrel installer artifacts in `frontend/out/make/squirrel.windows/x64/`.

On macOS or Linux, Squirrel requires `Mono` and `Wine`. Without them, the command fails with:

```text
You must install both Mono and Wine on non-Windows
```

## Flash drive workflow

### Portable ZIP made on macOS

1. Copy `frontend/out/make/zip/win32/x64/fawtartak-win32-x64-1.0.0.zip` to the flash drive.
2. On the Windows machine, copy that ZIP to a normal local folder such as `Desktop` or `Downloads`.
3. Extract the ZIP.
4. Open the extracted folder.
5. Run `fawtartak.exe`.

### Installer made on Windows

1. Copy the generated installer files from `frontend/out/make/squirrel.windows/x64/` to the flash drive.
2. On the Windows machine, run `FawtartakPOSSetup.exe`.
3. Complete the installer steps.
4. Launch the app from the desktop shortcut or Start menu entry created by Squirrel.

## Notes

- Packaging commands check that `frontend/dist/index.html` already exists before packaging.
- The frontend uses relative asset paths and `HashRouter`, which is suitable for packaged file-based Electron loading.
- If you only need a practical Windows test build from this Mac, use `npm run make:win`.
