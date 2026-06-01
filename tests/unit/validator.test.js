const { validateConversionRequest, isPlaylistOnlyUrl } = require('../../src/middleware/validator');

// Build a fake Express req/res and a next() spy. next() is called with an
// error on rejection, or with no arguments on success.
function run(body) {
  const req = { body };
  const res = {};
  let error;
  let passed = false;
  const next = (err) => {
    if (err) error = err;
    else passed = true;
  };
  validateConversionRequest(req, res, next);
  return { error, passed };
}

const valid = { streamUrl: 'https://youtu.be/dQw4w9WgXcQ', format: 'mp3', quality: 'medium' };

describe('validateConversionRequest', () => {
  test('passes a fully valid request', () => {
    const { error, passed } = run(valid);
    expect(error).toBeUndefined();
    expect(passed).toBe(true);
  });

  describe('streamUrl', () => {
    test('rejects a missing url', () => {
      const { error } = run({ ...valid, streamUrl: undefined });
      expect(error.statusCode).toBe(400);
      expect(error.message).toMatch(/required/i);
    });

    test('rejects a blank/whitespace url', () => {
      const { error } = run({ ...valid, streamUrl: '   ' });
      expect(error.message).toMatch(/required/i);
    });

    test('rejects a non-string url', () => {
      const { error } = run({ ...valid, streamUrl: 12345 });
      expect(error.message).toMatch(/required/i);
    });

    test('rejects a malformed url', () => {
      const { error } = run({ ...valid, streamUrl: 'not a url' });
      expect(error.statusCode).toBe(400);
      expect(error.message).toMatch(/invalid stream url/i);
    });

    test('rejects a non-http(s) protocol', () => {
      const { error } = run({ ...valid, streamUrl: 'ftp://example.com/file' });
      expect(error.message).toMatch(/http/i);
    });

    test('rejects an absurdly long url', () => {
      const longUrl = 'https://youtu.be/' + 'a'.repeat(3000);
      const { error } = run({ ...valid, streamUrl: longUrl });
      expect(error.message).toMatch(/too long/i);
    });

    test('rejects a playlist-only url', () => {
      const { error } = run({ ...valid, streamUrl: 'https://www.youtube.com/playlist?list=PL123' });
      expect(error.statusCode).toBe(400);
      expect(error.message).toMatch(/playlist/i);
    });

    test('allows a watch url that also carries a list param', () => {
      const { passed } = run({ ...valid, streamUrl: 'https://www.youtube.com/watch?v=abc123&list=PL123' });
      expect(passed).toBe(true);
    });
  });

  describe('format', () => {
    test('rejects a missing format', () => {
      const { error } = run({ ...valid, format: undefined });
      expect(error.message).toMatch(/format/i);
    });

    test('rejects an unsupported format', () => {
      const { error } = run({ ...valid, format: 'avi' });
      expect(error.message).toMatch(/format/i);
    });

    test.each(['mp3', 'mp4'])('accepts %s', (format) => {
      const { passed } = run({ ...valid, format });
      expect(passed).toBe(true);
    });
  });

  describe('quality', () => {
    test('rejects a missing quality', () => {
      const { error } = run({ ...valid, quality: undefined });
      expect(error.message).toMatch(/quality/i);
    });

    test('rejects an unsupported quality', () => {
      const { error } = run({ ...valid, quality: 'ultra' });
      expect(error.message).toMatch(/quality/i);
    });

    test.each(['low', 'medium', 'high'])('accepts %s', (quality) => {
      const { passed } = run({ ...valid, quality });
      expect(passed).toBe(true);
    });
  });
});

describe('isPlaylistOnlyUrl', () => {
  const cases = [
    ['https://www.youtube.com/playlist?list=PL123', true],
    ['https://youtube.com/playlist?list=PL123', true],
    ['https://www.youtube.com/watch?v=abc&list=PL123', false],
    ['https://www.youtube.com/watch?v=abc', false],
    ['https://youtu.be/abc?list=PL123', false],
    ['https://www.youtube.com/shorts/abc?list=PL123', false],
    ['https://example.com/playlist?list=PL123', false], // non-YouTube: not our concern
  ];

  test.each(cases)('%s → %s', (url, expected) => {
    expect(isPlaylistOnlyUrl(new URL(url))).toBe(expected);
  });
});
