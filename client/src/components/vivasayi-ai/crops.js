// Crops and questions for a crop check. Labels live under `cropHealth` in the language files.
export const CROPS = ['tomato', 'paddy'];

export const STAGES = {
  tomato: ['seedling', 'vegetative', 'flowering', 'fruiting', 'notSure'],
  paddy: ['nursery', 'tillering', 'flowering', 'grainFilling', 'notSure']
};

export const PARTS = {
  tomato: ['leaves', 'stem', 'flowers', 'fruit', 'roots'],
  paddy: ['leaves', 'stem', 'panicle', 'roots']
};

export const ONSET = ['days', 'weeks', 'longer', 'none', 'notSure'];
export const EXTENT = ['onePlant', 'scattered', 'largeArea', 'notSure'];
export const SPREADING = ['yes', 'no', 'notSure'];
export const WEATHER = ['heavyRain', 'dry', 'normal', 'notSure'];
export const TREATMENT = ['none', 'fertilizer', 'pesticide', 'both', 'notSure'];
export const TREATMENT_WHEN = ['week', 'month', 'notSure'];

export const PHOTO_SLOTS = ['field', 'wholePlant', 'closeUp', 'underside', 'healthy', 'extra'];
export const KEY_SLOTS = ['field', 'wholePlant', 'closeUp'];

export const hasSymptoms = check => check.onset !== 'none';
export const treated = check => ['fertilizer', 'pesticide', 'both'].includes(check.treatment);

export const detailsComplete = check =>
  CROPS.includes(check.crop) && !!check.stage && !!check.onset && !!check.locality.trim() &&
  (!hasSymptoms(check) || !!check.extent);

export const newCheck = (from = null) => ({
  id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
  parentId: from ? from.id : null,
  step: 0,
  crop: from ? from.crop : '',
  stage: from ? from.stage : '',
  onset: '',
  extent: '',
  locality: from ? from.locality : '',
  parts: [],
  spreading: '',
  weather: '',
  treatment: '',
  treatmentWhen: '',
  photos: []
});
