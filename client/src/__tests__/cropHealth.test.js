import React from 'react';
import { render, screen, fireEvent, waitFor, within, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware } from 'redux';
import { thunk } from 'redux-thunk';
import rootReducer from '../reducers';
import i18n, { setLanguage } from '../i18n';
import { canUseCropHealth } from '../components/vivasayi-ai/access';
import { newCheck } from '../components/vivasayi-ai/crops';
import { sampleResult, summaryLines } from '../components/vivasayi-ai/sampleResult';
import { brightness, sharpness, averageHash, photoWarnings } from '../components/vivasayi-ai/photoChecks';
import * as cropStore from '../utils/cropStore';

jest.mock('uuid', () => ({ v4: () => 'test-id' })); // uuid ships ESM only, which this Jest cannot load

jest.mock('../utils/api', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn(), defaults: { headers: { common: {} } } }
}));

// jsdom can't decode images, so a picked photo comes back already measured
jest.mock('../components/vivasayi-ai/photos', () => ({ readPhoto: jest.fn() }));
const { readPhoto } = require('../components/vivasayi-ai/photos');

const FARMER = { _id: 'f1', name: 'Farmer Fay', userType: 'farmer', emailVerified: true };
const TESTER = { ...FARMER, isTest: true };

const renderAt = (ui, { user = TESTER, path = '/' } = {}) =>
  render(
    <Provider store={createStore(rootReducer, { auth: { token: 't', isAuthenticated: true, loading: false, user } }, applyMiddleware(thunk))}>
      <MemoryRouter initialEntries={[path]}>{ui}</MemoryRouter>
    </Provider>
  );

const Where = () => <div data-testid="where">{useLocation().pathname}</div>;

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

describe('Vivasayi AI screens', () => {
  const BottomNav = require('../components/layout/BottomNav').default;
  const CropHealthRoute = require('../components/vivasayi-ai/CropHealthRoute').default;
  const VivasayiHome = require('../components/vivasayi-ai/VivasayiHome').default;
  const NewCheck = require('../components/vivasayi-ai/NewCheck').default;
  const CheckResult = require('../components/vivasayi-ai/CheckResult').default;

  const App = () => (
    <Routes>
      <Route path="/vivasayi-ai" element={<VivasayiHome />} />
      <Route path="/vivasayi-ai/new" element={<NewCheck />} />
      <Route path="/vivasayi-ai/assessments/:id" element={<CheckResult />} />
    </Routes>
  );

  let photoNo = 0;
  const measured = (over = {}) => {
    photoNo += 1;
    const hash = Array.from({ length: 64 }, (_, i) => (Math.floor(i / 8) === photoNo % 8 ? '1' : '0')).join('');
    return { src: `data:image/jpeg;base64,${photoNo}`, light: 130, sharp: 400, hash, ...over };
  };
  const section = name => screen.getByRole('heading', { name }).closest('section');

  const addPhoto = async (slotTitle, how = 'Camera') => {
    fireEvent.click(screen.getByRole('button', { name: `${how}: ${slotTitle}` }));
    const input = screen.getByTestId(how === 'Camera' ? 'camera-input' : 'gallery-input');
    fireEvent.change(input, { target: { files: [new File(['x'], 'leaf.jpg', { type: 'image/jpeg' })] } });
    expect(await screen.findByRole('img', { name: slotTitle })).toBeInTheDocument();
  };

  const saved = async (over = {}) => {
    const check = { ...answered(over), id: 'k1', createdAt: new Date('2026-11-20T10:00:00').getTime() };
    await cropStore.saveCheck('f1', { ...check, result: sampleResult(check) });
    return check;
  };

  beforeEach(() => {
    localStorage.setItem('vivasayiAiIntro:f1', '1');
    readPhoto.mockImplementation(async () => measured());
  });
  afterEach(() => {
    cropStore.clearAllChecks();
    localStorage.clear();
    delete window.speechSynthesis;
    delete window.SpeechSynthesisUtterance;
    jest.restoreAllMocks();
  });

  test('testers get Vivasayi AI in place of Prices; other farmers keep Prices', () => {
    const { unmount } = renderAt(<BottomNav />, { user: TESTER });
    expect(screen.getByRole('link', { name: /Vivasayi AI/ })).toHaveAttribute('href', '/vivasayi-ai');
    expect(screen.queryByRole('link', { name: /Prices/ })).toBeNull();
    unmount();

    renderAt(<BottomNav />, { user: FARMER });
    expect(screen.getByRole('link', { name: /Prices/ })).toHaveAttribute('href', '/market-price');
    expect(screen.queryByRole('link', { name: /Vivasayi AI/ })).toBeNull();
  });

  test('anyone else opening the address is sent to their dashboard', () => {
    renderAt(
      <Routes>
        <Route path="/vivasayi-ai" element={<CropHealthRoute><div>crop check</div></CropHealthRoute>} />
        <Route path="/dashboard" element={<Where />} />
      </Routes>,
      { user: FARMER, path: '/vivasayi-ai' }
    );
    expect(screen.getByTestId('where')).toHaveTextContent('/dashboard');
    expect(screen.queryByText('crop check')).toBeNull();
  });

  test('the first visit explains what it is and is not; Escape closes it for good', async () => {
    localStorage.removeItem('vivasayiAiIntro:f1');
    const { unmount } = renderAt(<App />, { path: '/vivasayi-ai' });
    const dialog = screen.getByRole('dialog', { name: 'Vivasayi AI' });
    expect(within(dialog).getByText(/not a confirmed diagnosis/)).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Start crop check' })).toHaveFocus();

    fireEvent.click(within(dialog).getByRole('button', { name: 'How photos and data are used' }));
    expect(within(dialog).getByText(/Nothing is sent to us/)).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(await screen.findByText(/No checks yet/)).toBeInTheDocument();
    unmount();

    renderAt(<App />, { path: '/vivasayi-ai' });
    expect(await screen.findByText(/No checks yet/)).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  test('a full check: questions, photos, review, then a result clearly marked as a sample', async () => {
    renderAt(<App />, { path: '/vivasayi-ai/new' });

    fireEvent.click(await screen.findByRole('radio', { name: 'Tomato' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Flowering' }));
    fireEvent.change(screen.getByLabelText(/District or nearest town/), { target: { value: 'Salem' } });
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByText('Please answer the questions marked *.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('radio', { name: 'In the last few days' }));
    fireEvent.click(screen.getByRole('radio', { name: 'A few plants here and there' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Leaves' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Yes' })); // spreading
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByText('Add at least one photo to continue.')).toBeInTheDocument();
    await addPhoto('Field or patch');
    await addPhoto('Whole affected plant', 'Gallery');
    await addPhoto('Close-up of the problem');
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(screen.getByText('Salem')).toBeInTheDocument();
    expect(screen.getByText('Leaves')).toBeInTheDocument();
    expect(screen.getAllByRole('img')).toHaveLength(3);
    fireEvent.click(screen.getByRole('button', { name: 'Get result' }));
    expect(screen.getByText('Preparing a sample result…')).toBeInTheDocument();

    expect(await screen.findByRole('heading', { name: 'Visible symptoms need more checks' }, { timeout: 3000 })).toBeInTheDocument();
    expect(screen.getByRole('note')).toHaveTextContent(/^Sample result.*It is not based on your photos/);
    expect(screen.getByRole('heading', { name: 'A leaf spot disease (fungus or bacteria)' })).toBeInTheDocument();
    expect(section('Treatment advice')).toHaveTextContent(/Don't apply fertilizer or crop-protection chemicals based on this result/);
    expect(section('When to get expert help')).toHaveTextContent(/Because it is spreading/);
    expect(await cropStore.getDraft('f1')).toBeUndefined();

    fireEvent.click(screen.getByRole('link', { name: 'Back to Vivasayi AI' }));
    expect(await screen.findByRole('link', { name: /Tomato/ })).toBeInTheDocument();
  });

  test('photo hints: dark and repeated photos are pointed out, never refused', async () => {
    readPhoto
      .mockResolvedValueOnce(measured({ light: 12 }))
      .mockResolvedValueOnce(measured({ hash: '1'.repeat(64) }))
      .mockResolvedValueOnce(measured({ hash: '1'.repeat(64) }));
    await cropStore.saveDraft('f1', { ...answered({ photos: [] }), step: 1 });
    renderAt(<App />, { path: '/vivasayi-ai/new' });

    await screen.findByRole('button', { name: 'Camera: Field or patch' });
    await addPhoto('Field or patch');
    expect(screen.getByText('Looks dark. Try again in daylight.')).toBeInTheDocument();
    await addPhoto('Whole affected plant');
    await addPhoto('Close-up of the problem');
    expect(screen.getAllByText('Looks like another photo here. Try a different view.')).toHaveLength(2);

    fireEvent.click(screen.getByRole('button', { name: 'Remove: Close-up of the problem' }));
    expect(screen.queryByText(/Looks like another photo/)).toBeNull();
    expect(screen.getAllByRole('img')).toHaveLength(2);
  });

  test('a crop it cannot check yet says so and offers no way forward', async () => {
    renderAt(<App />, { path: '/vivasayi-ai/new' });
    fireEvent.click(await screen.findByRole('radio', { name: 'Other crop' }));
    expect(screen.getByText(/can only check tomato and paddy/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Continue' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument();
  });

  test('a saved draft is offered on the Vivasayi AI page', async () => {
    renderAt(<App />, { path: '/vivasayi-ai/new' });
    fireEvent.click(await screen.findByRole('radio', { name: 'Paddy' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save draft' }));
    expect(await screen.findByText('Draft saved on this phone.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    fireEvent.click(await screen.findByRole('link', { name: 'Continue your saved check' }));
    expect(await screen.findByRole('radio', { name: 'Paddy' })).toBeChecked();
  });

  test('not enough photos: Add information keeps the answers and makes a new, linked check', async () => {
    await saved({ photos: [{ slot: 'closeUp', src: 'data:image/jpeg;base64,c', hash: '0'.repeat(64) }] });
    renderAt(<App />, { path: '/vivasayi-ai/assessments/k1' });

    expect(await screen.findByRole('heading', { name: 'Not enough to go on' })).toBeInTheDocument();
    const needed = section('More photos needed');
    expect(within(needed).getByText('Field or patch')).toBeInTheDocument();
    expect(within(needed).getByText('Whole affected plant')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('link', { name: 'Add information' }));
    expect(await screen.findByRole('img', { name: 'Close-up of the problem' })).toBeInTheDocument(); // opens at the photos
    await addPhoto('Field or patch');
    await addPhoto('Whole affected plant');
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByText('Salem')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Get result' }));

    expect(await screen.findByRole('heading', { name: 'Visible symptoms need more checks' }, { timeout: 3000 })).toBeInTheDocument();
    expect(screen.getByText('Follow-up to your check on 20 Nov 2026')).toBeInTheDocument();
    const checks = await cropStore.listChecks('f1');
    expect(checks).toHaveLength(2);
    expect(checks[1].result.outcome).toBe('insufficient'); // the earlier check is unchanged
  });

  test('share sends the summary as text, and delete removes the check from the phone', async () => {
    await saved();
    const writeText = jest.fn().mockResolvedValue();
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    jest.spyOn(window, 'confirm').mockReturnValue(true);
    renderAt(<App />, { path: '/vivasayi-ai/assessments/k1' });

    fireEvent.click(await screen.findByRole('button', { name: 'Share' }));
    expect(await screen.findByText(/Copied/)).toBeInTheDocument();
    expect(writeText.mock.calls[0][0]).toMatch(/^Vivasayi AI crop check \(sample\): Tomato, Salem/);
    expect(writeText.mock.calls[0][0]).toMatch(/not based on your photos/);

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(await screen.findByText(/No checks yet/)).toBeInTheDocument();
    expect(await cropStore.listChecks('f1')).toEqual([]);
  });

  describe('Listen to summary', () => {
    const speech = voices => {
      const spoken = [];
      window.SpeechSynthesisUtterance = function Utterance(text) { this.text = text; };
      window.speechSynthesis = {
        speaking: false,
        pending: false,
        getVoices: () => voices,
        speak: jest.fn(u => spoken.push(u)),
        cancel: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      };
      return spoken;
    };

    test('reads the screen text sentence by sentence; pause and resume pick up where it was', async () => {
      const spoken = speech([{ lang: 'en-IN' }, { lang: 'ta-IN' }]);
      await saved();
      renderAt(<App />, { path: '/vivasayi-ai/assessments/k1' });

      fireEvent.click(await screen.findByRole('button', { name: 'Listen to summary' }));
      expect(spoken[0].text).toMatch(/not based on your photos/);
      expect(spoken[0].lang).toBe('en-IN');
      act(() => spoken[0].onend());
      expect(spoken[1].text).toBe('Result: Visible symptoms need more checks.');

      fireEvent.click(screen.getByRole('button', { name: 'Pause' }));
      act(() => spoken[1].onend()); // cancelling ends it; that must not move on
      expect(spoken).toHaveLength(2);
      fireEvent.click(screen.getByRole('button', { name: 'Resume' }));
      expect(spoken[2].text).toBe(spoken[1].text);

      fireEvent.click(screen.getByRole('button', { name: 'Show text' }));
      expect(document.querySelector('.ai-transcript')).toHaveTextContent(/not based on your photos/);

      fireEvent.change(screen.getByLabelText('Language'), { target: { value: 'ta' } });
      fireEvent.click(screen.getByRole('button', { name: 'Listen to summary' }));
      expect(spoken[3].lang).toBe('ta-IN');
      expect(spoken[3].text).toMatch(/எடுத்துக்காட்டு/);
    });

    test('no Tamil voice on the phone: says so and shows the text instead', async () => {
      const spoken = speech([{ lang: 'en-US' }]);
      await saved();
      renderAt(<App />, { path: '/vivasayi-ai/assessments/k1' });

      fireEvent.change(await screen.findByLabelText('Language'), { target: { value: 'ta' } });
      fireEvent.click(screen.getByRole('button', { name: 'Listen to summary' }));
      expect(spoken).toHaveLength(0);
      expect(screen.getByText(/This phone has no Tamil voice/)).toBeInTheDocument();
      expect(document.querySelector('.ai-transcript')).toHaveTextContent(/எடுத்துக்காட்டு/);
    });

    test('where there is no speech at all, the text is shown from the start', async () => {
      await saved();
      renderAt(<App />, { path: '/vivasayi-ai/assessments/k1' });
      expect(await screen.findByText(/Audio isn't available here yet/)).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Listen to summary' })).toBeNull();
      expect(document.querySelector('.ai-transcript')).toHaveTextContent(/not based on your photos/);
    });
  });

  test('works in Tamil', async () => {
    setLanguage('ta');
    await saved();
    renderAt(<App />, { path: '/vivasayi-ai/assessments/k1' });
    expect(await screen.findByRole('heading', { name: 'தெரியும் அறிகுறிகளுக்கு மேலும் சரிபார்ப்பு தேவை' })).toBeInTheDocument();
    expect(screen.getByText('மாதிரி முடிவு')).toBeInTheDocument();
    expect(document.body).not.toHaveTextContent(/cropHealth\./);
  });
});
