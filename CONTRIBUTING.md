# Contributing to Media Stream Converter

Thank you for your interest in contributing! This document outlines our development practices and contribution guidelines.

## Project Philosophy

**Media Stream Converter** is an engineering tool designed to automate media stream extraction and conversion for professional content creation workflows. It is **not** a consumer media download tool.

### What We Build
✅ Robust media processing pipelines
✅ Efficient resource management
✅ Extensible architecture
✅ Production-quality error handling
✅ Well-documented code

### What We Don't Do
❌ Platform-specific integrations (YouTube, Spotify, etc.)
❌ Consumer-facing download utilities
❌ DRM circumvention
❌ Terms-of-Service violations

## Design Principles

### 1. Pluggable Architecture
- Stream extraction is a **configurable command** in `.env`
- Users integrate their own extraction tools
- No hardcoded platform dependencies

### 2. Professional Use Case
- Designed for video studios, content creators, developers
- For building **custom workflows**, not replacing official applications
- Focus on automation and efficiency in production pipelines

### 3. Legal Defensibility
- Use generic terminology ("stream extraction" not "download")
- Document the professional/automation use case
- Avoid branded assets or platform-specific code
- Maintain clear separation from ToS violations

## Development Workflow

### 1. Fork and Branch
```bash
git checkout -b feature/your-feature-name
git checkout -b fix/issue-description
```

### 2. Code Standards
- Use meaningful variable names
- Add comments for complex logic
- Follow Node.js naming conventions
- Keep functions under 30 lines
- Separate concerns into services

### 3. Commit Messages
```bash
git commit -m "Type: Brief description

- Detailed explanation if needed
- Reference issue numbers: #123
- Explain WHY, not just WHAT"
```

**Types:**
- `feat:` New feature
- `fix:` Bug fix
- `refactor:` Code reorganization
- `docs:` Documentation updates
- `test:` Test additions/updates
- `perf:` Performance improvements

### 4. Testing
```bash
npm test                    # Unit tests
npm run test:integration    # Integration tests
npm run test:coverage       # Coverage report
```

All new features require:
- Unit tests (mocked dependencies)
- Integration tests (real file I/O)
- Error case testing
- Memory/performance profiling

### 5. Pull Request Process
1. Ensure all tests pass
2. Update README if adding features
3. Update `.env.example` for new config options
4. Write descriptive PR title and description
5. Link related issues
6. Request review from maintainers

## Code Review Checklist

When submitting code, ensure:

- [ ] No hardcoded platform dependencies
- [ ] Uses generic "stream" terminology
- [ ] Input validation present
- [ ] Error messages are helpful
- [ ] Logging is appropriate
- [ ] Memory management is sound
- [ ] Tests cover happy and error paths
- [ ] Comments explain "why" not "what"
- [ ] README/docs updated if needed

## Architecture Guidelines

### Service Layer Pattern
Each concern should be isolated:

```javascript
// ❌ Don't do this
function handleRequest(req) {
  const stream = extractYouTube(req.url);      // Platform specific
  const converted = convertWithFFmpeg(stream); // Mixed concerns
  fs.writeFileSync(file, converted);           // Blocking I/O
}

// ✅ Do this
async function handleRequest(req) {
  const stream = extractionService.extract(req.streamUrl);
  const converted = await conversionService.convert(stream);
  await fileService.saveStream(converted, outputPath);
}
```

### Memory Management
- Use streaming for files > 10MB
- Implement backpressure handling
- Clean up temp files on error
- Profile before claiming performance

### Error Handling
- Catch errors at appropriate levels
- Log with context (path, jobId, etc)
- Return structured error responses
- Don't expose sensitive paths in errors

## Documentation Standards

### Code Comments
```javascript
// ❌ Obvious comments
const foo = bar + 1; // Add one to bar

// ✅ Explain the "why"
// We add 1 because buffer size must be power of 2, and 2^17 is our target
const buf = baseSize + 1;
```

### Commit Descriptions
Explain:
- What problem does this solve?
- Why this approach?
- Any design decisions?
- Known limitations?

### README Updates
- Explain features in architectural terms
- Include before/after diagrams for architecture changes
- Update API docs for new endpoints
- Note performance implications

## Reporting Issues

Use GitHub Issues to report:
- Bugs with reproduction steps
- Performance problems with benchmarks
- Architecture questions/discussions
- Enhancement requests with use cases

**DO NOT report:**
- Platform-specific integration requests
- Consumer download feature requests
- DRM/ToS circumvention features

## Legal Considerations

### Pull Request Guidelines
Do NOT include:
- YouTube logo or branding
- Any platform's logo or branding
- Code referencing specific services by name in core logic
- Comments encouraging ToS violations

DO include:
- Generic terminology ("stream", "media", "source")
- Professional use case framing
- Clear documentation of extensibility
- Notes about self-hosted extraction tools

### Example PR Description
```
Fix: Improve streaming backpressure handling

**Problem**: Large media files were buffering excessively

**Solution**: Implement proper backpressure with pause/resume

**Impact**: Reduced memory usage by 40% for 1GB+ files

**Testing**: Added integration test with 500MB test file
```

## Community Standards

### Be Respectful
- All contributors are volunteers
- Assume good intent
- Provide constructive feedback
- Celebrate contributions

### Keep It Professional
- Focus on the engineering
- Discuss architecture decisions objectively
- Support evidence with benchmarks/data

### No Platform-Specific Debates
This project is intentionally platform-agnostic. Discussions about specific services belong elsewhere.

## Questions?

- 📖 Check [PROJECT_PLAN.md](PROJECT_PLAN.md) for architecture details
- 🏗️ Review existing code in `src/services/`
- 💬 Open a discussion issue
- 📧 Contact maintainers

---

**Thank you for contributing responsibly!** 🎉
