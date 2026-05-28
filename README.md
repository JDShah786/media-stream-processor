# YouTube to MP3 Converter

A desktop application built with Electron and Node.js that converts YouTube videos to MP3 files with zero cost using open-source tools.

## Features

- 🎵 Convert YouTube videos to MP3 audio files
- ⚡ Real-time conversion progress tracking
- 📁 Organize downloads in a dedicated folder
- 🔒 Validate and sanitize all inputs
- 📝 Comprehensive logging system
- 🖥️ Desktop application (Electron)

## Tech Stack

- **Runtime**: Node.js v24+
- **Framework**: Express.js
- **Video Download**: yt-dlp (Python)
- **Audio Conversion**: FFmpeg
- **Desktop**: Electron
- **Logging**: Winston
- **Version Control**: Git

## Prerequisites

Before you begin, ensure you have installed:

- **Node.js 18+**: https://nodejs.org/
- **Python 3.9+**: https://www.python.org/
  - Add to PATH during installation
- **FFmpeg**: https://ffmpeg.org/download.html
  - Extract and add to PATH
- **yt-dlp**: `pip install yt-dlp`
- **Git**: https://git-scm.com/

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/youtube-to-mp3-converter.git
   cd youtube-to-mp3-converter
   ```

2. **Install Node.js dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your paths (should already be configured on your system)

4. **Verify dependencies**
   ```bash
   node --version
   npm --version
   python --version
   ffmpeg -version
   yt-dlp --version
   ```

## Project Structure

```
youtube-to-mp3-converter/
├── src/
│   ├── services/          # Business logic (YouTube, FFmpeg, File operations)
│   ├── controllers/       # Request handlers
│   ├── routes/           # API endpoints
│   ├── middleware/       # Request processing (validation, errors, logging)
│   ├── config/           # Configuration files
│   ├── app.js            # Express app setup
│   └── server.js         # Server entry point
├── tests/                # Unit and integration tests
├── downloads/            # Downloaded files location
├── logs/                 # Application logs
├── .env                  # Environment variables (local)
├── .env.example          # Environment template
├── package.json          # Node dependencies
└── PROJECT_PLAN.md       # Full project documentation
```

## Development

### Start the backend server (Development)
```bash
node src/server.js
```

The server will run on `http://localhost:3000`

### API Endpoints

#### Convert a Video
```
POST /api/convert
Content-Type: application/json

{
  "url": "https://www.youtube.com/watch?v=...",
  "format": "mp3",
  "quality": "high"
}

Response:
{
  "jobId": "uuid-here",
  "status": "accepted",
  "message": "Conversion job queued successfully"
}
```

#### Check Job Status
```
GET /api/status/:jobId
```

#### List All Jobs
```
GET /api/jobs
```

#### Health Check
```
GET /health
```

## Development Phases

- **Phase 1**: ✅ Backend foundation (Express, routing, middleware, logging)
- **Phase 2**: Core services (YouTube download, FFmpeg conversion, file management)
- **Phase 3**: API refinement (error handling, validation, testing)
- **Phase 4**: Frontend (React/Electron UI)
- **Phase 5**: Testing & bug fixes
- **Phase 6**: Deployment & optimization

## Error Handling

The application includes comprehensive error handling:
- Input validation (YouTube URLs)
- Format validation (mp3, mp4)
- Quality validation (low, medium, high)
- Global error middleware with detailed logging
- Separate error logs for debugging

## Logging

Logs are stored in the `logs/` directory:
- `app.log` - All application events
- `error.log` - Only errors

Logs include:
- Timestamp
- Log level (info, warn, error, debug)
- Message
- Stack traces (in development)

## Contributing

1. Create a feature branch: `git checkout -b feature/feature-name`
2. Commit changes: `git commit -m "Add feature description"`
3. Push to branch: `git push origin feature/feature-name`
4. Open a Pull Request

## Troubleshooting

### Node.js not recognized
- Add `C:\Program Files\nodejs` to your system PATH
- Or use full path: `C:\Program Files\nodejs\node.exe`

### npm commands fail in PowerShell
- Use `npm.cmd` instead of `npm` in PowerShell
- Or use Command Prompt (cmd.exe)

### Python not found
- Ensure Python is installed: https://www.python.org/
- Add `C:\Python314` (or your version) to PATH
- Or use `py -m yt_dlp` instead of `yt-dlp`

### FFmpeg not found
- Install from: https://ffmpeg.org/download.html
- Add extraction folder's `bin` directory to PATH

## Cost

Completely free! 🎉
- Node.js: Open source
- Express.js: Open source
- Python: Open source
- FFmpeg: Open source
- yt-dlp: Open source
- Electron: Open source
- All development tools: Open source

## License

MIT License - feel free to use for personal or commercial projects

## Support

For issues and questions:
1. Check the [PROJECT_PLAN.md](PROJECT_PLAN.md) for detailed documentation
2. Review logs in `logs/` directory
3. Open an issue on GitHub

---

**Status**: 🚧 In Development (Phase 1 Complete)
