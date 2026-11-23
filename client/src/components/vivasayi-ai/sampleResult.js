import { KEY_SLOTS, hasSymptoms } from './crops';

// Preview only: the result depends on the answers and on which photo slots were filled,
// never on what the photos show.
export const sampleResult = check => {
  const urgent = hasSymptoms(check) && (check.spreading === 'yes' || check.extent === 'largeArea');
  const filled = check.photos.map(p => p.slot);
  const missing = KEY_SLOTS.filter(slot => !filled.includes(slot));
  if (missing.length) return { outcome: 'insufficient', missing, urgent };
  if (!hasSymptoms(check)) return { outcome: 'noIssue', nextChecks: ['week', 'underside'], urgent };
  return {
    outcome: 'needsCheck',
    causes: ['leafSpot', 'water', 'nutrient'],
    cannotConfirm: ['exact', 'soil', 'field'],
    nextChecks: ['count', 'compare', 'photosAgain'],
    urgent
  };
};

// What Listen reads, Show text displays and Share sends: the same sentences as the result screen.
export const summaryLines = (result, t) => {
  const lines = [
    t('cropHealth.result.sampleNote'),
    `${t('cropHealth.result.outcomeLabel')}: ${t(`cropHealth.outcome.${result.outcome}`)}.`
  ];
  if (result.outcome === 'insufficient') {
    lines.push(`${t('cropHealth.result.addPhotos')} ${result.missing.map(s => t(`cropHealth.slots.${s}.title`)).join(', ')}.`);
  }
  if (result.outcome === 'noIssue') lines.push(t('cropHealth.result.noIssueNote'));
  (result.causes || []).forEach(c =>
    lines.push(`${t(`cropHealth.causes.${c}.title`)}. ${t('cropHealth.result.nextCheck')}: ${t(`cropHealth.causes.${c}.next`)}`)
  );
  (result.nextChecks || []).forEach(k => lines.push(t(`cropHealth.next.${k}`)));
  lines.push(t(`cropHealth.expert.${result.urgent ? 'urgent' : 'normal'}`));
  lines.push(`${t('cropHealth.result.guidance')}: ${t('cropHealth.result.guidanceNone')}`);
  return lines;
};
