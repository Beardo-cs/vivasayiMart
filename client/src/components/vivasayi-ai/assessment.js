import api from '../../utils/api';
import { isOfflineError } from '../../utils/offline';
import { hasSymptoms, treated } from './crops';
import { shrinkPhoto } from './photos';

// Base64 characters. The server takes at most 1200 KB a photo and 4 MB in all.
const PHOTO_BUDGET = 1000 * 1024;
const TOTAL_BUDGET = 3 * 1024 * 1024;
const SMALLER = [[1024, 0.8], [800, 0.7]];
const WAIT_MS = 90 * 1000;

const upload = (slot, src) => {
  const match = /^data:(image\/(?:jpeg|png|webp));base64,(.*)$/.exec(src || '');
  return { slot, mimeType: match ? match[1] : '', data: match ? match[2] : '' };
};

const fitsBudget = list =>
  list.every(p => p.data.length <= PHOTO_BUDGET) && list.reduce((n, p) => n + p.data.length, 0) <= TOTAL_BUDGET;

const photosToSend = async photos => {
  let list = photos.map(p => upload(p.slot, p.src));
  for (const [side, quality] of SMALLER) {
    if (fitsBudget(list)) break;
    list = await Promise.all(photos.map(async p => upload(p.slot, await shrinkPhoto(p.src, side, quality))));
  }
  return list;
};

// Changes whenever an answer or photo changes: the server reuses an answer only for the same check.
const fingerprint = text => {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h * 33) ^ text.charCodeAt(i)) >>> 0;
  return h.toString(36);
};

// Sends what the farmer saw on the review step: hidden answers are left out.
export const requestCheck = async check => {
  const symptoms = hasSymptoms(check);
  let photos;
  try {
    photos = await photosToSend(check.photos);
  } catch (err) {
    throw Object.assign(new Error('A photo could not be prepared'), { reason: 'photos' });
  }
  const payload = {
    crop: check.crop,
    stage: check.stage,
    locality: check.locality,
    onset: check.onset,
    extent: symptoms ? check.extent : '',
    parts: symptoms ? check.parts : [],
    spreading: symptoms ? check.spreading : '',
    weather: check.weather,
    treatment: check.treatment,
    treatmentWhen: treated(check) ? check.treatmentWhen : '',
    photos
  };
  const checkId = `${check.id}-${fingerprint(JSON.stringify(payload))}`;
  const { data } = await api.post('/api/ai/crop-check', { checkId, ...payload }, { timeout: WAIT_MS });
  return data;
};

// Which cropHealth.errors message fits a failed request.
export const failureReason = err => {
  if (err.reason) return err.reason;
  if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') return 'timeout';
  if (isOfflineError(err)) return 'offline';
  const { status, data } = err.response;
  if (status === 429) return 'limit';
  if (status === 504) return 'timeout';
  if (status === 413) return 'photos';
  const code = data && data.code;
  return ['notAllowed', 'photos', 'timeout', 'busy'].includes(code) ? code : 'failed';
};

export const pick = (text, lang) => (text ? text[lang] || text.en : '');

export const NEXT_CHECKS = { noIssue: ['week', 'underside'], needsCheck: ['count', 'photosAgain'] };
export const needsSprayNote = cause => cause.kind === 'disease' || cause.kind === 'pest';

export const sourcesOf = result => {
  const seen = new Map();
  result.causes.forEach(c => c.sources.forEach(s => seen.set(s.url, s)));
  return [...seen.values()];
};

export const outcomeNote = (result, t, lang, crop) => {
  if (result.outcome === 'noIssue') return t('cropHealth.result.noIssueNote');
  if (result.outcome !== 'unsupported') return '';
  return result.otherCrop
    ? t('cropHealth.result.unsupportedOther', { other: pick(result.otherCrop, lang), crop })
    : t('cropHealth.result.unsupportedNone', { crop });
};

// What Listen reads, Show text displays and Share sends: the same text as the result screen.
export const assessmentLines = (check, t, lang) => {
  const { result } = check;
  if (!result.version) return [t('cropHealth.result.legacy')];
  const crop = t(`cropHealth.crops.${check.crop}`);
  const lines = [
    t('cropHealth.result.aiNote'),
    `${t('cropHealth.result.outcomeLabel')}: ${t(`cropHealth.outcome.${result.outcome}`)}.`
  ];
  const note = outcomeNote(result, t, lang, crop);
  if (note) lines.push(note);
  if (result.outcome === 'insufficient') {
    lines.push(`${t('cropHealth.result.addPhotos')} ${result.missingPhotos.map(s => t(`cropHealth.slots.${s}.title`)).join(', ')}.`);
  }
  if (result.observations.length) lines.push(`${t('cropHealth.result.seen')}:`, ...result.observations.map(o => pick(o, lang)));
  result.causes.forEach(c => {
    lines.push(`${pick(c.name, lang)} (${t(`cropHealth.result.${c.likelihood}`)}).`);
    if (c.fits) lines.push(`${t('cropHealth.result.fits')}: ${pick(c.fits, lang)}`);
    if (c.against) lines.push(`${t('cropHealth.result.against')}: ${pick(c.against, lang)}`);
    lines.push(`${t('cropHealth.result.nextCheck')}: ${pick(c.check, lang)}`);
    lines.push(`${t('cropHealth.result.whatToDo')}:`, ...pick(c.steps, lang));
    lines.push(`${t('cropHealth.result.fertilizer')}: ${pick(c.fertilizer, lang)}`);
    if (needsSprayNote(c)) lines.push(t('cropHealth.result.sprayNote'));
  });
  if (result.outcome === 'needsCheck' && !result.causes.length) lines.push(t('cropHealth.result.noMatch', { crop }));
  (NEXT_CHECKS[result.outcome] || []).forEach(k => lines.push(t(`cropHealth.next.${k}`)));
  lines.push(t(`cropHealth.expert.${result.urgent ? 'urgent' : 'normal'}`), t('cropHealth.result.helpline'));
  return lines;
};
