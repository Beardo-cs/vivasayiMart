import i18n, { setLanguage } from '../i18n';
import { canUseCropHealth } from '../components/vivasayi-ai/access';
import { newCheck } from '../components/vivasayi-ai/crops';
import { sampleResult, summaryLines } from '../components/vivasayi-ai/sampleResult';
import { brightness, sharpness, averageHash, photoWarnings } from '../components/vivasayi-ai/photoChecks';
import * as cropStore from '../utils/cropStore';

const gray = (width, height, valueAt) => {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      data[i] = data[i + 1] = data[i + 2] = valueAt(x, y);
      data[i + 3] = 255;
    }
  }
  return { data, width, height };
};

const answered = (over = {}) => ({
  ...newCheck(),
  crop: 'tomato', stage: 'flowering', onset: 'days', extent: 'scattered', locality: 'Salem',
  photos: ['field', 'wholePlant', 'closeUp'].map(slot => ({ slot, src: 'data:,' })),
  ...over
});

beforeEach(() => setLanguage('en'));
afterAll(() => i18n.changeLanguage('en'));

describe('Who sees Vivasayi AI', () => {
  test('farmers testing it, admins, and admins acting for a farmer; nobody else', () => {
    const farmer = { userType: 'farmer' };
    expect(canUseCropHealth({ ...farmer, isTest: true })).toBe(true);
    expect(canUseCropHealth({ ...farmer, isAdmin: true })).toBe(true);
    expect(canUseCropHealth({ ...farmer, acting: { by: 'Founder' } })).toBe(true);
    expect(canUseCropHealth(farmer)).toBe(false);
    expect(canUseCropHealth({ userType: 'consumer', isAdmin: true })).toBe(false);
    expect(canUseCropHealth(null)).toBe(false);
  });
});

describe('Sample results', () => {
  test('without the three key photos it asks for the missing ones', () => {
    const result = sampleResult(answered({ photos: [{ slot: 'closeUp' }, { slot: 'healthy' }] }));
    expect(result.outcome).toBe('insufficient');
    expect(result.missing).toEqual(['field', 'wholePlant']);
  });

  test('a routine check with no symptoms finds no clear issue', () => {
    expect(sampleResult(answered({ onset: 'none', extent: '' })).outcome).toBe('noIssue');
  });

  test('symptoms give possible causes and next checks; spreading makes expert help urgent', () => {
    const result = sampleResult(answered());
    expect(result.outcome).toBe('needsCheck');
    expect(result.causes.length).toBeGreaterThan(1);
    expect(result.urgent).toBe(false);
    expect(sampleResult(answered({ spreading: 'yes' })).urgent).toBe(true);
    expect(sampleResult(answered({ extent: 'largeArea' })).urgent).toBe(true);
  });

  test('the summary says it is a sample, warns against chemicals, and is complete in Tamil', () => {
    const result = sampleResult(answered({ spreading: 'yes' }));
    const en = summaryLines(result, i18n.getFixedT('en'));
    expect(en[0]).toMatch(/not based on your photos/);
    expect(en.join(' ')).toMatch(/Don't apply fertilizer or crop-protection chemicals/);
    expect(en.join(' ')).toMatch(/soon/);
    expect(en.join(' ')).not.toMatch(/%|\d+\s*(ml|g|kg)\b/); // no scores or doses

    const ta = summaryLines(result, i18n.getFixedT('ta')).join(' ');
    expect(ta).toMatch(/மாதிரி|எடுத்துக்காட்டு/);
    expect(ta).not.toMatch(/cropHealth\./); // every line has a Tamil text
  });
});

describe('Photo hints', () => {
  test('dark, blurry and repeated photos get a hint; clear different ones do not', () => {
    expect(brightness(gray(16, 16, () => 10))).toBeLessThan(45);
    expect(sharpness(gray(32, 32, () => 128))).toBe(0);
    expect(sharpness(gray(32, 32, (x, y) => ((x + y) % 2 ? 230 : 30)))).toBeGreaterThan(1000);

    const columns = averageHash(gray(8, 8, x => x * 30));
    const rows = averageHash(gray(8, 8, (x, y) => y * 30));
    expect(photoWarnings({ light: 10, sharp: 0, hash: columns })).toEqual(['dark']);
    expect(photoWarnings({ light: 128, sharp: 5, hash: columns })).toEqual(['blurry']);
    expect(photoWarnings({ light: 128, sharp: 900, hash: columns }, [columns])).toEqual(['duplicate']);
    expect(photoWarnings({ light: 128, sharp: 900, hash: columns }, [rows])).toEqual([]);
    expect(photoWarnings({ light: null, sharp: null, hash: null })).toEqual([]); // couldn't measure
  });
});

describe('Checks stay on this phone, per account', () => {
  afterEach(() => cropStore.clearAllChecks());

  test('listed newest first, only for their owner, and deletable', async () => {
    await cropStore.saveCheck('u1', { id: 'a', createdAt: 1 });
    await cropStore.saveCheck('u1', { id: 'b', createdAt: 2 });
    await cropStore.saveCheck('u2', { id: 'c', createdAt: 3 });
    expect((await cropStore.listChecks('u1')).map(c => c.id)).toEqual(['b', 'a']);
    expect(await cropStore.getCheck('u1', 'c')).toBeUndefined();

    await cropStore.deleteCheck('u1', 'b');
    expect((await cropStore.listChecks('u1')).map(c => c.id)).toEqual(['a']);
  });

  test('keeps the latest 20, and one draft per account', async () => {
    for (let i = 1; i <= 22; i++) await cropStore.saveCheck('u1', { id: `c${i}`, createdAt: i });
    const kept = await cropStore.listChecks('u1');
    expect(kept).toHaveLength(20);
    expect(kept[19].id).toBe('c3');

    await cropStore.saveDraft('u1', { id: 'd1', crop: 'paddy' });
    await cropStore.saveDraft('u1', { id: 'd2', crop: 'tomato' });
    expect((await cropStore.getDraft('u1')).id).toBe('d2');
    expect(await cropStore.getDraft('u2')).toBeUndefined();
  });

  test('logging out clears them all', async () => {
    await cropStore.saveCheck('u1', { id: 'a', createdAt: 1 });
    await cropStore.saveDraft('u1', { id: 'd' });
    cropStore.clearAllChecks();
    expect(await cropStore.listChecks('u1')).toEqual([]);
    expect(await cropStore.getDraft('u1')).toBeUndefined();
  });
});
