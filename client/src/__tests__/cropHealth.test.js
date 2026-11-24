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
import { requestCheck, failureReason, assessmentLines } from '../components/vivasayi-ai/assessment';
import { brightness, sharpness, averageHash, photoWarnings } from '../components/vivasayi-ai/photoChecks';
import * as cropStore from '../utils/cropStore';

jest.mock('uuid', () => ({ v4: () => 'test-id' })); // uuid ships ESM only, which this Jest cannot load

jest.mock('../utils/api', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn(), defaults: { headers: { common: {} } } }
}));
const api = require('../utils/api').default;

// jsdom can't decode images, so a picked photo comes back already measured
jest.mock('../components/vivasayi-ai/photos', () => ({ readPhoto: jest.fn(), shrinkPhoto: jest.fn() }));
const { readPhoto, shrinkPhoto } = require('../components/vivasayi-ai/photos');

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
  photos: ['field', 'wholePlant', 'closeUp'].map(slot => ({ slot, src: `data:image/jpeg;base64,${slot}` })),
  ...over
});

// What the server sends back: problems from its reviewed list, with their advice in both languages.
const text = (en, ta) => ({ en, ta });
const BLIGHT = {
  id: 'earlyBlight', kind: 'disease', urgent: false, likelihood: 'likely',
  name: text('Early blight (spots with rings)', 'முன் கருகல் நோய் (வளையப் புள்ளிகள்)'),
  fits: text('Ring-shaped spots on the lower leaves.', 'கீழ் இலைகளில் வளையப் புள்ளிகள்.'),
  against: null,
  check: text('Look for brown spots with rings on older leaves.', 'பழைய இலைகளில் வளையங்களுடன் பழுப்புப் புள்ளிகள் உள்ளதா என்று பாருங்கள்.'),
  steps: { en: ['Remove badly affected lower leaves.'], ta: ['மோசமாகப் பாதிக்கப்பட்ட கீழ் இலைகளை அகற்றுங்கள்.'] },
  fertilizer: text("Fertilizer won't cure this. Keep to your usual fertilizer schedule.", 'உரம் இதைக் குணப்படுத்தாது. வழக்கமான உர அட்டவணையையே பின்பற்றுங்கள்.'),
  sources: [{ title: 'TNAU Agritech: tomato diseases', url: 'https://agritech.tnau.ac.in/tomato-diseases' }]
};
const NITROGEN = {
  id: 'nitrogenShortage', kind: 'nutrient', urgent: false, likelihood: 'possible',
  name: text('Nitrogen shortage', 'தழைச்சத்துக் குறைபாடு'),
  fits: text('Older leaves are pale.', 'பழைய இலைகள் வெளிறியுள்ளன.'),
  against: text('Young leaves are pale too.', 'இளம் இலைகளும் வெளிறியுள்ளன.'),
  check: text('Pale yellow starts on the oldest leaves.', 'வெளிர் மஞ்சள் பழைய இலைகளில் தொடங்கும்.'),
  steps: { en: ['Check that the field drains well.'], ta: ['வயலில் நீர் வடிகிறதா என்று பாருங்கள்.'] },
  fertilizer: text('Spray urea at 1% (10 g in 1 litre of water), twice, a week apart (TNAU).', 'யூரியா 1% (1 லிட்டர் நீரில் 10 கிராம்), ஒரு வார இடைவெளியில் இரண்டு முறை தெளிக்கவும் (TNAU).'),
  sources: [{ title: 'TNAU Agritech: tomato nutrition', url: 'https://agritech.tnau.ac.in/tomato-nutrition' }]
};
const RESULT = {
  version: 1, outcome: 'needsCheck', cropSeen: 'tomato', otherCrop: null,
  observations: [text('Brown spots on the lower leaves.', 'கீழ் இலைகளில் பழுப்புப் புள்ளிகள்.')],
  causes: [BLIGHT, NITROGEN], missingPhotos: [], urgent: false,
  model: 'gemini-test', promptVersion: 'crop-check-1', guidanceVersion: '2026-11-23-draft'
};
const result = (over = {}) => ({ ...RESULT, ...over });
const httpError = (status, data = {}) => Object.assign(new Error(`HTTP ${status}`), { response: { status, data, headers: {} } });

beforeEach(() => {
  setLanguage('en');
  api.post.mockReset();
  shrinkPhoto.mockReset();
});
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

describe('Sending a check', () => {
  test('sends the answers the farmer reviewed and the photos; the same check keeps the same id', async () => {
    api.post.mockResolvedValue({ data: RESULT });
    const check = answered({ onset: 'none', extent: 'scattered', parts: ['leaves'], spreading: 'yes', treatment: 'none', treatmentWhen: 'week' });
    expect(await requestCheck(check)).toEqual(RESULT);

    const [url, body, options] = api.post.mock.calls[0];
    expect(url).toBe('/api/ai/crop-check');
    expect(body).toMatchObject({ crop: 'tomato', onset: 'none', extent: '', parts: [], spreading: '', treatmentWhen: '', locality: 'Salem' });
    expect(body.photos).toEqual([
      { slot: 'field', mimeType: 'image/jpeg', data: 'field' },
      { slot: 'wholePlant', mimeType: 'image/jpeg', data: 'wholePlant' },
      { slot: 'closeUp', mimeType: 'image/jpeg', data: 'closeUp' }
    ]);
    expect(options.timeout).toBeGreaterThan(60000);
    expect(shrinkPhoto).not.toHaveBeenCalled();

    await requestCheck(check);
    await requestCheck({ ...check, photos: [{ slot: 'field', src: 'data:image/jpeg;base64,other' }] });
    const ids = api.post.mock.calls.map(([, sent]) => sent.checkId);
    expect(ids[0]).toMatch(new RegExp(`^${check.id}-`));
    expect(ids[1]).toBe(ids[0]);
    expect(ids[2]).not.toBe(ids[0]);
  });

  test('photos too big to send together are sent as smaller copies', async () => {
    api.post.mockResolvedValue({ data: RESULT });
    shrinkPhoto.mockResolvedValue('data:image/jpeg;base64,small');
    const big = `data:image/jpeg;base64,${'A'.repeat(1100 * 1024)}`;
    await requestCheck(answered({ photos: [{ slot: 'closeUp', src: big }] }));
    expect(shrinkPhoto).toHaveBeenCalledWith(big, 1024, 0.8);
    expect(api.post.mock.calls[0][1].photos).toEqual([{ slot: 'closeUp', mimeType: 'image/jpeg', data: 'small' }]);
  });

  test('each failure gets its own message', () => {
    expect(failureReason(new Error('Network Error'))).toBe('offline');
    expect(failureReason(Object.assign(new Error('timeout of 90000ms exceeded'), { code: 'ECONNABORTED' }))).toBe('timeout');
    expect(failureReason(httpError(429, { msg: 'Too many crop checks' }))).toBe('limit');
    expect(failureReason(httpError(504, '<html>'))).toBe('timeout');
    expect(failureReason(httpError(504, { code: 'timeout' }))).toBe('timeout');
    expect(failureReason(httpError(403, { code: 'notAllowed' }))).toBe('notAllowed');
    expect(failureReason(httpError(400, { code: 'photos' }))).toBe('photos');
    expect(failureReason(httpError(413))).toBe('photos');
    expect(failureReason(httpError(503, { code: 'unavailable' }))).toBe('failed');
    expect(failureReason(httpError(503, { code: 'busy' }))).toBe('busy');
    expect(failureReason(Object.assign(new Error('x'), { reason: 'photos' }))).toBe('photos');
    for (const reason of ['offline', 'timeout', 'limit', 'busy', 'notAllowed', 'photos', 'failed']) {
      expect(i18n.getFixedT('ta')(`cropHealth.errors.${reason}`)).toMatch(/[\u0B80-\u0BFF]/);
    }
  });
});

describe('Result text (what Listen reads and Share sends)', () => {
  const lines = (res, lang = 'en') => assessmentLines({ crop: 'tomato', result: res }, i18n.getFixedT(lang), lang);

  test('says it is AI, then what was seen, each cause with how to check, what to do and fertilizer', () => {
    const en = lines(result({ urgent: true }));
    expect(en[0]).toMatch(/^Checked by AI/);
    expect(en[1]).toBe('Result: Visible symptoms need more checks.');
    expect(en).toContain('Brown spots on the lower leaves.');
    expect(en).toContain('Early blight (spots with rings) (Likely).');
    expect(en).toContain('How to check: Look for brown spots with rings on older leaves.');
    expect(en).toContain('Remove badly affected lower leaves.');
    expect(en).toContain('Fertilizer: Spray urea at 1% (10 g in 1 litre of water), twice, a week apart (TNAU).');
    expect(en.filter(l => /Before you spray anything/.test(l))).toHaveLength(1); // the disease, not the nutrient shortage
    expect(en.join(' ')).toMatch(/Because it is spreading/);
    expect(en[en.length - 1]).toMatch(/1800-180-1551/);
  });

  test('is complete in Tamil', () => {
    const ta = lines(result(), 'ta').join(' ');
    expect(ta).toMatch(/AI சோதித்தது/);
    expect(ta).toMatch(/முன் கருகல் நோய்/);
    expect(ta).not.toMatch(/cropHealth\.|Early blight/);
  });

  test('other crops, too few photos, nothing on the list, and old preview checks', () => {
    expect(lines(result({ outcome: 'unsupported', causes: [], otherCrop: text('Brinjal', 'கத்தரி') })).join(' '))
      .toMatch(/The photos look like Brinjal, not Tomato/);
    expect(lines(result({ outcome: 'insufficient', causes: [], missingPhotos: ['field', 'closeUp'] })))
      .toContain('Add these photos so a check is possible: Field or patch, Close-up of the problem.');
    expect(lines(result({ causes: [] })).join(' ')).toMatch(/Nothing on Vivasayi AI's list of Tomato problems clearly matches/);
    expect(lines({ outcome: 'needsCheck', causes: ['leafSpot'] })).toEqual([expect.stringMatching(/made during the preview/)]);
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

  const saved = async (over = {}, res = RESULT) => {
    const check = { ...answered(over), id: 'k1', createdAt: new Date('2026-11-20T10:00:00').getTime() };
    await cropStore.saveCheck('f1', { ...check, result: res });
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
    expect(within(dialog).getByText(/sent to Google Gemini.*We don't keep your photos on our server/)).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(await screen.findByText(/No checks yet/)).toBeInTheDocument();
    unmount();

    renderAt(<App />, { path: '/vivasayi-ai' });
    expect(await screen.findByText(/No checks yet/)).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  test('a full check: questions, photos, review, then the AI result with what to do', async () => {
    let answer;
    api.post.mockImplementation(() => new Promise(resolve => { answer = () => resolve({ data: result({ urgent: true }) }); }));
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
    expect(screen.getByText(/sent to Google Gemini to be checked/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Get result' }));
    expect(await screen.findByText('Checking your photos…')).toBeInTheDocument();
    await waitFor(() => expect(api.post).toHaveBeenCalled());
    expect(api.post.mock.calls[0][1]).toMatchObject({ crop: 'tomato', stage: 'flowering', spreading: 'yes', parts: ['leaves'] });
    expect(api.post.mock.calls[0][1].photos.map(p => p.slot)).toEqual(['field', 'wholePlant', 'closeUp']);
    expect((await cropStore.getDraft('f1')).step).toBe(2); // kept while waiting
    act(() => answer());

    expect(await screen.findByRole('heading', { name: 'Visible symptoms need more checks' })).toBeInTheDocument();
    expect(screen.getByRole('note')).toHaveTextContent(/^Checked by AI from your photos and answers/);
    expect(section('What the photos show')).toHaveTextContent('Brown spots on the lower leaves.');
    const blight = screen.getByRole('heading', { name: 'Early blight (spots with rings) Likely' }).closest('article');
    expect(within(blight).getByText("Fertilizer won't cure this. Keep to your usual fertilizer schedule.")).toBeInTheDocument();
    expect(within(blight).getByText(/Before you spray anything, ask your agriculture office or KVK/)).toBeInTheDocument();
    const nitrogen = screen.getByRole('heading', { name: 'Nitrogen shortage Possible' }).closest('article');
    expect(within(nitrogen).getByText(/urea at 1% \(10 g in 1 litre of water\)/)).toBeInTheDocument();
    expect(within(nitrogen).getByText('Young leaves are pale too.')).toBeInTheDocument();
    expect(within(nitrogen).queryByText(/Before you spray/)).toBeNull();
    expect(section('When to get expert help')).toHaveTextContent(/Because it is spreading/);
    expect(screen.getByRole('link', { name: /Kisan Call Centre/ })).toHaveAttribute('href', 'tel:18001801551');
    expect(within(section('Sources')).getByRole('link', { name: 'TNAU Agritech: tomato nutrition' })).toHaveAttribute('href', 'https://agritech.tnau.ac.in/tomato-nutrition');
    expect(section('Sources')).toHaveTextContent(/hasn't reviewed it yet \(version 2026-11-23-draft\)/);
    expect(await cropStore.getDraft('f1')).toBeUndefined();

    fireEvent.click(screen.getByRole('link', { name: 'Back to Vivasayi AI' }));
    expect(await screen.findByRole('link', { name: /Tomato/ })).toBeInTheDocument();
  });

  test('when checking fails, the check stays as a draft and can be sent again', async () => {
    api.post.mockRejectedValueOnce(httpError(503, { code: 'unavailable' })).mockResolvedValueOnce({ data: RESULT });
    await cropStore.saveDraft('f1', { ...answered(), step: 2 });
    renderAt(<App />, { path: '/vivasayi-ai/new' });

    fireEvent.click(await screen.findByRole('button', { name: 'Get result' }));
    expect(await screen.findByText(/Couldn't check the photos right now. Your check is saved/)).toBeInTheDocument();
    expect((await cropStore.getDraft('f1')).photos).toHaveLength(3);
    expect(await cropStore.listChecks('f1')).toEqual([]);

    fireEvent.click(screen.getByRole('button', { name: 'Get result' }));
    expect(await screen.findByRole('heading', { name: 'Visible symptoms need more checks' })).toBeInTheDocument();
    expect(api.post.mock.calls[1][1].checkId).toBe(api.post.mock.calls[0][1].checkId); // nothing changed
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
    api.post.mockResolvedValue({ data: RESULT });
    await saved(
      { photos: [{ slot: 'closeUp', src: 'data:image/jpeg;base64,c', hash: '0'.repeat(64) }] },
      result({ outcome: 'insufficient', causes: [], observations: [], missingPhotos: ['field', 'wholePlant'] })
    );
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

    expect(await screen.findByRole('heading', { name: 'Visible symptoms need more checks' })).toBeInTheDocument();
    expect(api.post.mock.calls[0][1].photos.map(p => p.slot)).toEqual(['field', 'wholePlant', 'closeUp']);
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
    expect(writeText.mock.calls[0][0]).toMatch(/^Vivasayi AI crop check: Tomato, Salem/);
    expect(writeText.mock.calls[0][0]).toMatch(/Checked by AI/);
    expect(writeText.mock.calls[0][0]).toMatch(/Early blight \(spots with rings\) \(Likely\)/);

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
      expect(spoken[0].text).toMatch(/^Checked by AI/);
      expect(spoken[0].lang).toBe('en-IN');
      act(() => spoken[0].onend());
      expect(spoken[1].text).toBe('Result: Visible symptoms need more checks.');

      fireEvent.click(screen.getByRole('button', { name: 'Pause' }));
      act(() => spoken[1].onend()); // cancelling ends it; that must not move on
      expect(spoken).toHaveLength(2);
      fireEvent.click(screen.getByRole('button', { name: 'Resume' }));
      expect(spoken[2].text).toBe(spoken[1].text);

      fireEvent.click(screen.getByRole('button', { name: 'Show text' }));
      expect(document.querySelector('.ai-transcript')).toHaveTextContent(/Early blight \(spots with rings\)/);

      fireEvent.change(screen.getByLabelText('Language'), { target: { value: 'ta' } });
      fireEvent.click(screen.getByRole('button', { name: 'Listen to summary' }));
      expect(spoken[3].lang).toBe('ta-IN');
      expect(spoken[3].text).toMatch(/AI சோதித்தது/);
      expect(document.querySelector('.ai-transcript')).toHaveTextContent(/முன் கருகல் நோய்/); // the advice too, not only the app's own text
    });

    test('no Tamil voice on the phone: says so and shows the text instead', async () => {
      const spoken = speech([{ lang: 'en-US' }]);
      await saved();
      renderAt(<App />, { path: '/vivasayi-ai/assessments/k1' });

      fireEvent.change(await screen.findByLabelText('Language'), { target: { value: 'ta' } });
      fireEvent.click(screen.getByRole('button', { name: 'Listen to summary' }));
      expect(spoken).toHaveLength(0);
      expect(screen.getByText(/This phone has no Tamil voice/)).toBeInTheDocument();
      expect(document.querySelector('.ai-transcript')).toHaveTextContent(/AI சோதித்தது/);
    });

    test('where there is no speech at all, the text is shown from the start', async () => {
      await saved();
      renderAt(<App />, { path: '/vivasayi-ai/assessments/k1' });
      expect(await screen.findByText(/Audio isn't available here yet/)).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Listen to summary' })).toBeNull();
      expect(document.querySelector('.ai-transcript')).toHaveTextContent(/Checked by AI/);
    });
  });

  test('works in Tamil, advice included', async () => {
    setLanguage('ta');
    await saved();
    renderAt(<App />, { path: '/vivasayi-ai/assessments/k1' });
    expect(await screen.findByRole('heading', { name: 'தெரியும் அறிகுறிகளுக்கு மேலும் சரிபார்ப்பு தேவை' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'முன் கருகல் நோய் (வளையப் புள்ளிகள்) வாய்ப்பு அதிகம்' })).toBeInTheDocument();
    const nitrogen = screen.getByRole('heading', { name: 'தழைச்சத்துக் குறைபாடு இருக்கலாம்' }).closest('article');
    expect(within(nitrogen).getByText(/யூரியா 1%/)).toBeInTheDocument();
    expect(document.body).not.toHaveTextContent(/cropHealth\.|Early blight/);
  });

  test('photos of another crop say what they look like, with no causes', async () => {
    await saved({}, result({ outcome: 'unsupported', cropSeen: 'otherCrop', otherCrop: text('Brinjal', 'கத்தரி'), causes: [], observations: [] }));
    renderAt(<App />, { path: '/vivasayi-ai/assessments/k1' });
    const outcome = (await screen.findByRole('heading', { name: 'Not a crop Vivasayi AI can check' })).closest('section');
    expect(outcome).toHaveTextContent(/The photos look like Brinjal, not Tomato/);
    expect(screen.queryByRole('heading', { name: 'Possible causes' })).toBeNull();
    expect(screen.queryByRole('heading', { name: 'Sources' })).toBeNull();
  });

  test('a check from the preview says its result was a sample', async () => {
    await saved({}, { outcome: 'needsCheck', causes: ['leafSpot', 'water'], cannotConfirm: ['exact'], urgent: false });
    const { unmount } = renderAt(<App />, { path: '/vivasayi-ai/assessments/k1' });
    expect(await screen.findByText(/made during the preview, so its result was only a sample/)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Possible causes' })).toBeNull();
    expect(screen.getByRole('link', { name: 'Check again' })).toBeInTheDocument();
    unmount();

    renderAt(<App />, { path: '/vivasayi-ai' });
    expect(await screen.findByText('Preview sample')).toBeInTheDocument();
  });
});
