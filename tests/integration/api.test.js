jest.mock('../../src/services/loggerService');
// Stub the actual conversion so POST /api/convert never spawns yt-dlp.
jest.mock('../../src/services/conversionService', () => ({
  convert: jest.fn().mockResolvedValue({
    outputFile: '/out/test.mp3',
    filename: 'test.mp3',
    success: true,
  }),
}));

const request = require('supertest');
const app = require('../../src/app');

const validBody = {
  streamUrl: 'https://youtu.be/dQw4w9WgXcQ',
  format: 'mp3',
  quality: 'medium',
};

describe('GET /health', () => {
  test('returns 200 OK', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('OK');
  });
});

describe('POST /api/convert', () => {
  test('accepts a valid request with 202 and a jobId', async () => {
    const res = await request(app).post('/api/convert').send(validBody);
    expect(res.status).toBe(202);
    expect(res.body.jobId).toEqual(expect.any(String));
    expect(res.body.status).toBe('accepted');
  });

  test('rejects a missing url with 400', async () => {
    const res = await request(app).post('/api/convert').send({ ...validBody, streamUrl: undefined });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/required/i);
  });

  test('rejects a malformed url with 400', async () => {
    const res = await request(app).post('/api/convert').send({ ...validBody, streamUrl: 'not-a-url' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid stream url/i);
  });

  test('rejects a playlist-only url with 400', async () => {
    const res = await request(app)
      .post('/api/convert')
      .send({ ...validBody, streamUrl: 'https://www.youtube.com/playlist?list=PL123' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/playlist/i);
  });

  test('rejects a bad format with 400', async () => {
    const res = await request(app).post('/api/convert').send({ ...validBody, format: 'avi' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/format/i);
  });

  test('rejects a bad quality with 400', async () => {
    const res = await request(app).post('/api/convert').send({ ...validBody, quality: 'ultra' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/quality/i);
  });
});

describe('GET /api/status/:jobId', () => {
  test('returns 404 for an unknown job', async () => {
    const res = await request(app).get('/api/status/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/not found/i);
  });

  test('returns the job for a known id', async () => {
    const created = await request(app).post('/api/convert').send(validBody);
    const { jobId } = created.body;

    const res = await request(app).get(`/api/status/${jobId}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(jobId);
    expect(res.body).toHaveProperty('status');
    expect(res.body).toHaveProperty('progress');
  });
});

describe('GET /api/jobs', () => {
  test('returns a job list with a total', async () => {
    await request(app).post('/api/convert').send(validBody);
    const res = await request(app).get('/api/jobs');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('total');
    expect(Array.isArray(res.body.jobs)).toBe(true);
    expect(res.body.total).toBeGreaterThan(0);
  });
});

describe('GET /api/files', () => {
  test('returns a file list with a total', async () => {
    const res = await request(app).get('/api/files');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('total');
    expect(Array.isArray(res.body.files)).toBe(true);
  });
});

describe('unknown routes', () => {
  test('return 404 with a Route not found message', async () => {
    const res = await request(app).get('/api/nope');
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/route not found/i);
  });
});
