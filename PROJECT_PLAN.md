# YouTube to MP3/MP4 Converter - Project Plan

## 🚀 Current Project Status (May 29, 2026)

**Completion:** Phases 1-4 Complete (Backend + Electron Frontend Working)
**Current Phase:** Phase 5 - Testing & Bug Fixes (In Progress)
**Timeline:** ~70% complete (end-to-end app functional; automated tests & packaging pending)

**What Works Now:**
- ✅ Real YouTube URL conversion to MP3/MP4
- ✅ yt-dlp stream extraction (2 seconds)
- ✅ Quality presets; MP4 prefers AAC audio for universal playback
- ✅ Full API endpoints with job tracking
- ✅ Real-time progress updates
- ✅ Automatic cleanup and error recovery
- ✅ Electron desktop UI (frameless window, URL input, format/quality, progress, history)
- ✅ Output-folder selection (defaults to D:\) with persisted user choice
- ✅ Custom output file naming with sanitization & collision handling

**Test Results:** Successfully converted 2x Rick Astley "Never Gonna Give You Up" to MP3 (6.4 MB each, ~4 seconds total)

---

## Project Overview

A desktop/web application that converts YouTube links into MP3 (audio) and MP4 (video) files with a focus on reliability, zero cost, and proper implementation practices.

**Project Type:** Desktop Application (Electron) or Web Application (Node.js backend + React frontend)
**Estimated Completion Time:** 2-3 weeks (implementation + testing)
**Cost:** $0 (entirely open-source tools)

---

## Core Requirements

### Functional Requirements
- Accept YouTube URLs (single links and playlist support)
- Extract audio and convert to MP3 format
- Extract video and convert to MP4 format
- Display conversion progress in real-time
- Download and save files to user's chosen directory
- Error handling for invalid URLs, connection issues, and codec failures
- Support for different quality options (video: 720p/1080p, audio: 128kbps/320kbps)

### Non-Functional Requirements
- No crashes or data loss during conversion
- Comprehensive logging for debugging
- Graceful error messages for users
- Support for converting 30-60 minute videos without freezing
- Efficient memory usage

---

## Technology Stack (100% Free)

### Backend
- **Node.js** (free, open-source runtime)
- **yt-dlp** (free, actively maintained YouTube downloader, Python-based)
  - Alternative: `youtube-dl` (older, still functional)
- **FFmpeg** (free, industry-standard media converter)

### Frontend Options

#### Option A: Desktop (Recommended for beginners)
- **Electron** (free framework for desktop apps)
- **React** or **vanilla JavaScript** (UI framework)
- **Webpack/Vite** (bundler)

#### Option B: Web-based
- **Express.js** (Node.js web framework)
- **React** or **Vue.js** (frontend)
- Deploy to **Railway.app**, **Render.com**, or **Replit** (free tier)

### Supporting Tools
- **winston** or **pino** (logging)
- **dotenv** (environment configuration)
- **jest** (unit testing, free)
- **Git/GitHub** (version control)

---

## System Requirements for You

### Software to Install
1. **Node.js** (v18+) - https://nodejs.org/
2. **Python 3.9+** - https://www.python.org/ (required for yt-dlp)
3. **FFmpeg** - https://ffmpeg.org/download.html
4. **Git** - https://git-scm.com/
5. **VS Code** - https://code.visualstudio.com/ (recommended IDE)

### Hardware Requirements
- Windows/Mac/Linux machine
- Minimum 4GB RAM
- ~2GB free disk space for node_modules and dependencies
- Internet connection (for downloading videos)

---

## Architecture Design

```
youtube-converter/
├── backend/
│   ├── src/
│   │   ├── services/
│   │   │   ├── youtubeService.js      # Handle YouTube URL validation & yt-dlp calls
│   │   │   ├── ffmpegService.js       # Handle video/audio conversion
│   │   │   ├── fileService.js         # Handle file operations & cleanup
│   │   │   └── loggerService.js       # Centralized logging
│   │   ├── controllers/
│   │   │   └── conversionController.js # Handle conversion requests
│   │   ├── middleware/
│   │   │   ├── errorHandler.js        # Global error handling
│   │   │   └── validator.js           # Input validation
│   │   ├── routes/
│   │   │   └── conversion.js          # API endpoints
│   │   ├── config/
│   │   │   └── config.js              # Configuration management
│   │   └── app.js                     # Express app setup
│   ├── tests/
│   │   ├── services.test.js
│   │   ├── controllers.test.js
│   │   └── integration.test.js
│   ├── .env.example
│   ├── package.json
│   └── server.js                      # Entry point
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── URLInput.jsx
│   │   │   ├── QualitySelector.jsx
│   │   │   ├── ProgressBar.jsx
│   │   │   └── DownloadList.jsx
│   │   ├── pages/
│   │   │   └── Home.jsx
│   │   ├── App.jsx
│   │   ├── api.js                    # API client
│   │   └── index.css
│   ├── public/
│   └── package.json
├── .gitignore
├── README.md
└── PROJECT_PLAN.md
```

---

## Implementation Roadmap

### Phase 1: Foundation Setup (Days 1-2) ✅ COMPLETE
- [x] Initialize Node.js project structure
- [x] Set up Git repository
- [x] Install and verify yt-dlp & FFmpeg
- [x] Create basic Express server
- [x] Set up logging system
- [x] Write .env configuration

### Phase 2: Core Backend Services (Days 3-5) ✅ COMPLETE
- [x] Build ConversionService
  - URL validation (regex or library)
  - yt-dlp integration with error handling
  - Support for video metadata extraction
- [x] Build FFmpeg conversion
  - Audio extraction & MP3 conversion
  - Video conversion to MP4
  - Preset quality profiles
- [x] Build FileService
  - Temporary file management
  - Cleanup after conversion
  - File organization

### Phase 3: API Layer (Days 6-7) ✅ COMPLETE
- [x] Create `/api/convert` endpoint
  - Accept URL, format, quality, output path
  - Return conversion job ID
- [x] Create `/api/status/:jobId` endpoint
  - Return real-time progress
- [x] Implement request validation
- [x] Add comprehensive error handling

### Phase 4: Frontend Development (Days 8-10) ✅ COMPLETE
> Built with vanilla HTML/CSS/JS in an Electron renderer (not React) — simpler for the scope.
- [x] Build UI components
  - URL input with validation
  - Format & quality selector
  - Progress indicator
  - Download history/queue
  - Custom output file naming (added)
- [x] Connect to backend API
- [x] Add success/error notifications
- [x] Style with CSS (custom dark theme)

### Phase 5: Testing & Bug Fixes (Days 11-13) — IN PROGRESS
- [ ] Unit tests for services
- [ ] Integration tests for API
- [ ] Manual testing with various YouTube links
- [ ] Edge case testing (playlists, long videos, invalid URLs)
- [ ] Performance testing

### Phase 6: Deployment & Optimization (Days 14+)
- [ ] Choose deployment platform (Railway, Render, Heroku free tier)
- [ ] Set up CI/CD pipeline (GitHub Actions)
- [ ] Performance optimization
- [ ] Documentation & README

---

## 📋 Detailed Phase Breakdown & Remaining Work

### Phase 4: Frontend Development ✅ COMPLETE

> **Status:** Done. Implemented as a vanilla HTML/CSS/JS Electron renderer in
> `src/main.js`, `src/preload.js`, and `src/ui/` (not React; no `electron/` dir).
> Delivered: frameless window with custom controls, URL input + validation,
> format/quality selector, progress bar, output-folder picker (defaults to D:\),
> custom file naming, conversion history with "show in folder", and toast
> notifications. **Deferred to later:** cancel button, time-estimate, disk-space
> display, history delete/redownload, and a light-mode toggle.

**Electron Setup:**
- [ ] Install electron and electron-builder dependencies
- [ ] Create main process (`electron/main.js`)
  - [ ] Window management (create, minimize, maximize, close)
  - [ ] File dialogs for output directory selection
  - [ ] IPC bridge setup for secure main-renderer communication
- [ ] Create preload script (`electron/preload.js`)
  - [ ] Expose safe API methods to renderer
  - [ ] Handle conversion job management
  - [ ] Progress event listeners

**React UI Components:**
- [ ] **URLInput Component**
  - [ ] Text input field for YouTube URL
  - [ ] Real-time URL validation (regex check)
  - [ ] Error message display
  - [ ] Clear/Reset button
  
- [ ] **FormatSelector Component**
  - [ ] Radio buttons or dropdown (MP3/MP4)
  - [ ] Quality selector (Low/Medium/High with bitrate info)
  - [ ] Format preview/info display
  
- [ ] **ProgressBar Component**
  - [ ] Real-time progress visualization (0-100%)
  - [ ] Status text (pending/processing/completed/failed)
  - [ ] Cancel button functionality
  - [ ] Time estimate display
  
- [ ] **OutputSelector Component**
  - [ ] Display current download location
  - [ ] Browse/Change folder button
  - [ ] Show available disk space
  
- [ ] **ConversionHistory Component**
  - [ ] List of recent conversions
  - [ ] File name, size, date created
  - [ ] Open file/folder buttons
  - [ ] Delete conversion button
  - [ ] Redownload button

**App Integration:**
- [ ] Main App layout (header, form, progress, history)
- [ ] API client module (`src/ui/api.js`)
  - [ ] POST /api/convert wrapper
  - [ ] GET /api/status/:jobId polling
  - [ ] GET /api/jobs for history
- [ ] State management (React hooks or Context API)
- [ ] Error handling and toast notifications
- [ ] Loading states and disabled button logic

**Styling:**
- [ ] Choose CSS framework (Bootstrap, Tailwind, or custom CSS)
- [ ] Responsive design for various window sizes
- [ ] Dark/Light mode toggle (optional)
- [ ] Accessibility compliance (ARIA labels, keyboard navigation)

---

### Phase 5: Testing & Bug Fixes (High Priority)

**Unit Tests (`tests/unit/`):**
- [ ] ConversionService tests
  - [ ] Test URL validation
  - [ ] Mock yt-dlp execution
  - [ ] Mock FFmpeg execution
  - [ ] Progress callback verification
  - [ ] Error handling scenarios
  
- [ ] FileService tests
  - [ ] Directory creation
  - [ ] File operations
  - [ ] Cleanup functions
  - [ ] Disk space checks
  
- [ ] Validator tests
  - [ ] Valid URL formats
  - [ ] Invalid URL rejection
  - [ ] Format validation
  - [ ] Quality validation

**Integration Tests (`tests/integration/`):**
- [ ] End-to-end conversion pipeline
  - [ ] Real YouTube URL → MP3 conversion
  - [ ] Real YouTube URL → MP4 conversion
  - [ ] Job creation → Status polling → Completion
  - [ ] Error scenarios (invalid URL, network failure)
  
- [ ] API endpoint tests
  - [ ] POST /api/convert response codes
  - [ ] GET /api/status/:jobId response data
  - [ ] GET /api/jobs list response
  - [ ] Validation error responses

**Manual Testing Checklist:**
- [ ] Test with 5+ different YouTube videos
  - [ ] Short videos (< 1 min)
  - [ ] Medium videos (5-15 min)
  - [ ] Long videos (30+ min)
  - [ ] Videos with special characters in title
  - [ ] Age-restricted videos
  
- [ ] Test error scenarios
  - [ ] Invalid URL (malformed)
  - [ ] Private/Deleted video URL
  - [ ] Non-existent video
  - [ ] Network interrupt during download
  - [ ] Insufficient disk space
  - [ ] Missing yt-dlp/FFmpeg
  
- [ ] Performance testing
  - [ ] Memory usage during conversions
  - [ ] Parallel conversion limits
  - [ ] Large video file handling (500MB+)
  - [ ] Temp file cleanup verification

---

### Phase 6: Deployment & Optimization (Medium Priority)

**Electron Build & Packaging:**
- [ ] Configure electron-builder (`electron-builder.json`)
  - [ ] Windows installer (.exe)
  - [ ] Mac app bundle (.dmg)
  - [ ] Linux AppImage
  
- [ ] Code signing (optional but recommended)
  - [ ] Windows certificate
  - [ ] Mac certificate
  
- [ ] Auto-update setup (electron-updater)
  - [ ] Version management
  - [ ] Release notes generation

**Performance Optimization:**
- [ ] Optimize yt-dlp command (faster formats)
- [ ] Optimize FFmpeg command (faster presets for quick conversions)
- [ ] Stream processing improvement
- [ ] Memory profiling and optimization
- [ ] Reduce Electron app bundle size

**CI/CD Pipeline (GitHub Actions):**
- [ ] `.github/workflows/test.yml`
  - [ ] Run all unit & integration tests on PR
  - [ ] Code coverage reporting
  - [ ] Linting (ESLint)
  
- [ ] `.github/workflows/build.yml`
  - [ ] Build Windows, Mac, Linux on release tag
  - [ ] Upload artifacts to GitHub Releases
  
- [ ] `.github/workflows/release.yml`
  - [ ] Auto-create GitHub release
  - [ ] Publish to release channels

**Documentation Updates:**
- [ ] README.md
  - [ ] Installation instructions
  - [ ] User guide with screenshots
  - [ ] Keyboard shortcuts
  - [ ] Troubleshooting section
  
- [ ] CHANGELOG.md
  - [ ] Version history
  - [ ] Features/fixes per release
  
- [ ] Developer guide (`docs/DEVELOPMENT.md`)
  - [ ] Architecture overview
  - [ ] Setup for contributors
  - [ ] Code conventions

---

### Beyond Phase 6: Future Enhancements (Low Priority)

**Advanced Features:**
- [ ] Playlist support
  - [ ] URL parsing for playlists
  - [ ] Batch conversion queue
  - [ ] Progress tracking per video
  
- [ ] Video metadata extraction
  - [ ] Title, duration, thumbnail preview
  - [ ] Subtitle download (optional)
  
- [ ] Advanced quality options
  - [ ] Custom bitrate selection
  - [ ] Audio-only vs video+audio
  - [ ] Format-specific settings
  
- [ ] User preferences
  - [ ] Remember last output directory
  - [ ] Default quality preference
  - [ ] Theme preference
  - [ ] Language selection

**Infrastructure:**
- [ ] Database support (SQLite for local storage)
  - [ ] Job history persistence
  - [ ] User settings storage
  
- [ ] Analytics (optional)
  - [ ] Track conversion success/failure rates
  - [ ] Popular video durations/formats
  
- [ ] Cloud sync (optional)
  - [ ] Upload to Google Drive/Dropbox
  - [ ] Direct file sharing

---

## Critical Implementation Details

### YouTube Download Strategy
```javascript
// Example workflow using yt-dlp
1. Validate URL format (basic regex check)
2. Query yt-dlp for video metadata
3. Check video duration (warn if >2 hours)
4. Download with specified format
5. Pass to FFmpeg
```

### FFmpeg Conversion Commands
```bash
# Audio extraction (MP3)
ffmpeg -i input.mp4 -q:a 0 -map a output.mp3

# Video conversion (MP4)
ffmpeg -i input.mkv -c:v libx264 -preset slow -crf 22 -c:a aac output.mp4
```

### Error Handling Checklist
- [ ] Invalid YouTube URLs
- [ ] Video unavailable/private/deleted
- [ ] Network timeouts
- [ ] Insufficient disk space
- [ ] FFmpeg not installed
- [ ] Concurrent conversion limits
- [ ] File write permissions

### Progress Tracking
- Use progress bars from FFmpeg output parsing
- Emit WebSocket events (optional: for real-time updates)
- Store job status in memory or database (SQLite for free option)

---

## Quality Assurance Checklist

### Functional Testing
- [ ] Convert public videos successfully
- [ ] Handle private/unavailable videos gracefully
- [ ] Support multiple formats and qualities
- [ ] Verify output file integrity
- [ ] Test with various video lengths (short, medium, long)

### Performance Testing
- [ ] Measure memory usage during conversion
- [ ] Test with parallel conversions
- [ ] Verify cleanup of temporary files
- [ ] Check disk space warnings

### Security Testing
- [ ] Validate all user inputs
- [ ] Prevent path traversal attacks (output directory)
- [ ] Sanitize file names
- [ ] Rate limit API endpoints

### Edge Cases
- [ ] Videos with special characters in titles
- [ ] Very long video titles
- [ ] Playlist handling (if supported)
- [ ] Resume interrupted downloads
- [ ] Handle network interruptions

---

## Free Deployment Options

### Option 1: Local/Desktop Application
- Package with Electron
- No hosting cost
- User runs on their machine

### Option 2: Free Web Hosting
- **Railway.app** - Free tier ($5 credits/month, usually covers small apps)
- **Render.com** - Free tier with limitations
- **Replit** - Free tier for hosting
- **Heroku** (free tier discontinued, not recommended)

### Option 3: Self-hosted
- Raspberry Pi
- Old laptop as server
- Local network access only

---

## Cost Breakdown

| Item | Cost | Notes |
|------|------|-------|
| Node.js | $0 | Open-source |
| yt-dlp | $0 | Open-source |
| FFmpeg | $0 | Open-source |
| Git/GitHub | $0 | Free tier sufficient |
| VS Code | $0 | Open-source |
| Database | $0 | SQLite (file-based) |
| Hosting | $0-5/mo | Optional; local deployment is free |
| **TOTAL** | **$0** | ✅ Completely free |

---

## Success Criteria

Your project is complete when:
- ✅ App converts valid YouTube links to MP3/MP4 without crashes
- ✅ No error messages are unclear to end users
- ✅ File output is playable and correct format
- ✅ All functionality is documented
- ✅ Code has no critical bugs (tested thoroughly)
- ✅ Handles edge cases gracefully
- ✅ README explains installation and usage clearly

---

## Next Steps

1. **Fork or create a new GitHub repository**
2. **Install all system dependencies** (Node.js, Python, FFmpeg)
3. **Create initial project structure** with package.json
4. **Verify yt-dlp and FFmpeg work** from command line
5. **Begin Phase 1 implementation**
6. **Commit frequently to Git**

---

## Resources & Documentation

### **yt-dlp**: https://github.com/yt-dlp/yt-dlp
yt-dlp is a command-line program that downloads videos from YouTube and other video platforms, actively maintained as a successor to youtube-dl. It's the core tool you'll use to extract video/audio streams from YouTube URLs with support for various quality options and metadata extraction. The GitHub repository includes comprehensive documentation on installation, usage, and how to integrate it with Python or Node.js via child processes.

### **FFmpeg**: https://ffmpeg.org/documentation.html
FFmpeg is an industry-standard multimedia framework that handles audio and video conversion, encoding, and processing. It will be used in your app to convert downloaded video files to MP3 format with specified bitrate and quality settings. The documentation provides detailed command-line syntax, codec options, and examples for various conversion scenarios.

### **Node.js**: https://nodejs.org/docs/
Node.js is a JavaScript runtime environment that lets you run server-side code and build desktop applications with Electron. It provides the foundation for your app's backend logic, including spawning yt-dlp and FFmpeg processes, managing file operations, and handling errors. The official documentation includes guides on modules, async operations, and integrating with native system processes.

### **Express.js**: https://expressjs.com/
Express.js is a minimal web framework for Node.js that simplifies building APIs and handling HTTP requests. In your Electron desktop app, Express can run a local background server to manage conversion jobs and communicate between the UI and backend services. The documentation covers routing, middleware, error handling, and best practices for building robust APIs.

### **Electron**: https://www.electronjs.org/docs
Electron is a framework for building cross-platform desktop applications using web technologies (HTML, CSS, JavaScript). It packages your application as a standalone executable that runs on Windows, Mac, and Linux without requiring users to install Node.js separately. The documentation covers app lifecycle, inter-process communication, file dialogs, and packaging your app for distribution.

---

## Project Specification - Questions Answered

Based on your requirements, here's the refined scope:

1. **Desktop app (Electron) or web app (browser-based)?** → **Desktop (Electron)**
   - Building a standalone desktop application for Windows
   - No need for web hosting or browser dependencies
   - Easier distribution to end users

2. **Single URL or batch processing support?** → **Single URL at a time**
   - Simplified UI and backend logic
   - Users convert one video per request
   - Easier to implement and test initially

3. **Playlist support needed?** → **Not yet**
   - Focus on single video conversion first
   - Can add playlist support in future phases

4. **Priority: MP3 or MP4 or both equally?** → **MP3 (Primary focus)**
   - Audio extraction is simpler and faster than video conversion
   - MP4 support can be added later
   - Lower resource requirements

5. **Max video duration to support?** → **1 hour**
   - Reasonable limit for typical conversions
   - Prevents system resource exhaustion
   - Clear user expectation setting

6. **Output directory preferences?** → **"Yt Converter" project folder**
   - All converted files save to a dedicated output directory
   - Default location: `d:\Coding Projects\Yt Converter\downloads\`
   - User can override in settings
