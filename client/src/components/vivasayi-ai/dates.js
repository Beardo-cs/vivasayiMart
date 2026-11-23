import i18n from '../../i18n';

export const shortDate = ms =>
  new Date(ms).toLocaleDateString(i18n.language === 'ta' ? 'ta-IN' : 'en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
