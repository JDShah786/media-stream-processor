jest.mock('../../src/services/loggerService');

const os = require('os');
const fs = require('fs');
const path = require('path');
const fileService = require('../../src/services/fileService');

let dir;
beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'converto-fs-'));
});
afterEach(() => {
  fs.rmSync(dir, { recursive: true, force: true });
});

const touch = (name, content = 'x') => {
  const p = path.join(dir, name);
  fs.writeFileSync(p, content);
  return p;
};

describe('listDownloads', () => {
  test('returns [] for a non-existent directory', () => {
    expect(fileService.listDownloads(path.join(dir, 'nope'))).toEqual([]);
  });

  test('returns [] for an empty directory', () => {
    expect(fileService.listDownloads(dir)).toEqual([]);
  });

  test('lists only media files and ignores others', () => {
    touch('song.mp3');
    touch('video.mp4');
    touch('audio.m4a');
    touch('notes.txt');
    touch('cover.jpg');

    const names = fileService.listDownloads(dir).map((f) => f.name).sort();
    expect(names).toEqual(['audio.m4a', 'song.mp3', 'video.mp4']);
  });

  test('includes size and path metadata', () => {
    touch('song.mp3', 'abcde');
    const [file] = fileService.listDownloads(dir);
    expect(file.size).toBe(5);
    expect(file.path).toBe(path.join(dir, 'song.mp3'));
    expect(Number.isNaN(new Date(file.createdAt).getTime())).toBe(false);
  });
});

describe('getFileSize', () => {
  test('returns the byte size of an existing file', () => {
    const p = touch('a.mp3', 'hello');
    expect(fileService.getFileSize(p)).toBe(5);
  });

  test('returns 0 for a missing file', () => {
    expect(fileService.getFileSize(path.join(dir, 'ghost.mp3'))).toBe(0);
  });
});

describe('deleteFile', () => {
  test('deletes an existing file and returns true', () => {
    const p = touch('gone.mp3');
    expect(fileService.deleteFile(p)).toBe(true);
    expect(fs.existsSync(p)).toBe(false);
  });

  test('returns a falsy value for a missing file', () => {
    expect(fileService.deleteFile(path.join(dir, 'ghost.mp3'))).toBeFalsy();
  });
});

describe('directory getters', () => {
  test('expose downloads and temp directories', () => {
    expect(fileService.getDownloadsDirectory()).toContain('downloads');
    expect(fileService.getTempDirectory()).toContain('.temp');
  });
});
