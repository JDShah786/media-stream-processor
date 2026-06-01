# Changelog

All notable changes to **Converto** are documented here.
The format is loosely based on [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased] — Phase 6 (Packaging & Documentation)

### Added
- **Duration guard** — videos longer than `MAX_VIDEO_DURATION` (default 3600s)
  are rejected up front via a yt-dlp metadata probe, with a friendly message
  (e.g. *"Video is 1h 42m, which exceeds the 1h limit."*). Set the env to `0`
  to disable the check.
- **Pre-flight dependency check** — on launch the app probes for `yt-dlp` and
  `FFmpeg` and shows a non-blocking warning dialog with install guidance if
  either is missing, instead of failing silently mid-conversion.
- **electron-builder packaging** — NSIS installer config with assisted install
  (choose directory, desktop + Start Menu shortcuts).
- `CHANGELOG.md` and an expanded README (real project structure, prerequisites,
  packaging, and troubleshooting).

### Changed
- Default output directory is now portable: prefers `D:\` when present, else
  falls back to the OS Downloads folder (was a hardcoded `D:\`).
- Packaging excludes the raw "Tiny Swords (Free Pack)" art (~5.6 MB) — only the
  repacked flat sprites ship in the installer.

### Fixed
- Stricter URL validation: malformed URLs and non-http(s) protocols are rejected
  with clear messages, and playlist-only YouTube URLs are refused (single-video
  links carrying a `&list=` param are still accepted).

## [Phase 5] — Testing, Polish & Theming

### Added
- **Jest test suite** — 83 tests across unit (validator, conversion-service
  helpers & argument building, file-service) and integration (API endpoints via
  supertest, with the download step stubbed).
- Renderer now warns inline and disables Convert for playlist-only URLs.
- Light-fantasy "Converto" pixel theme: parchment panels, skinned buttons,
  wooden progress bar, bundled pixel fonts, custom cursors, a village diorama
  background, a custom app icon, and a "poof" effect on completion.

## [Phases 1–4] — Foundation through Frontend

### Added
- Express backend with `/api/convert`, `/api/status/:jobId`, `/api/jobs`,
  `/api/files`, and `/health`; in-memory job tracking with real-time progress.
- yt-dlp integration (MP3 VBR tiers; MP4 prefers AAC/m4a audio for universal
  playback) with collision-safe, sanitized custom output naming.
- Electron desktop UI: frameless window, URL input + validation, format/quality
  selectors, progress bar, output-folder picker, and conversion history.
