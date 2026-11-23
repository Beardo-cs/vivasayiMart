import React from 'react';
import { useTranslation } from 'react-i18next';
import { hasSymptoms, treated } from './crops';

const ReviewStep = ({ check, go }) => {
  const { t } = useTranslation();
  const none = t('cropHealth.review.notAnswered');
  const answer = (key, labels) => (check[key] ? t(`${labels}.${check[key]}`) : none);
  const rows = [
    ['crop', t(`cropHealth.crops.${check.crop}`)],
    ['stage', answer('stage', 'cropHealth.stages')],
    ['locality', check.locality],
    ['onset', answer('onset', 'cropHealth.onset')],
    ...(hasSymptoms(check) ? [
      ['extent', answer('extent', 'cropHealth.extent')],
      ['parts', check.parts.length ? check.parts.map(p => t(`cropHealth.parts.${p}`)).join(', ') : none],
      ['spreading', answer('spreading', 'cropHealth.yesNo')]
    ] : []),
    ['weather', answer('weather', 'cropHealth.weather')],
    ['treatment', answer('treatment', 'cropHealth.treatment')],
    ...(treated(check) ? [['treatmentWhen', answer('treatmentWhen', 'cropHealth.treatmentWhen')]] : [])
  ];

  return (
    <>
      <section className="ai-group">
        <h2>{t('cropHealth.steps.details')}</h2>
        <dl className="ai-answers">
          {rows.map(([key, value]) => (
            <div key={key}>
              <dt>{t(`cropHealth.q.${key}`)}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        <button type="button" className="ai-link" onClick={() => go(0)}>{t('cropHealth.review.edit')}</button>
      </section>
      <section className="ai-group">
        <h2>{t('cropHealth.steps.photos')}</h2>
        <div className="ai-thumbs">
          {check.photos.map(p => <img key={p.slot} src={p.src} alt={t(`cropHealth.slots.${p.slot}.title`)} />)}
        </div>
        <button type="button" className="ai-link" onClick={() => go(1)}>{t('cropHealth.review.editPhotos')}</button>
      </section>
      <p className="ai-preview" role="note">{t('cropHealth.review.notice')}</p>
    </>
  );
};

export default ReviewStep;
