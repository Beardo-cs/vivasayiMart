import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  CROPS, STAGES, PARTS, ONSET, EXTENT, SPREADING, WEATHER, TREATMENT, TREATMENT_WHEN, hasSymptoms, treated
} from './crops';

const Required = () => <span className="ai-required" aria-hidden="true"> *</span>;

const Choice = ({ name, label, options, labels, value, onChange, required }) => {
  const { t } = useTranslation();
  return (
    <fieldset className="ai-question">
      <legend>{label}{required && <Required />}</legend>
      <div className="ai-pills">
        {options.map(o => (
          <label key={o} className={`ai-pill${value === o ? ' on' : ''}`}>
            <input type="radio" name={name} value={o} checked={value === o} onChange={() => onChange(o)} />
            {t(`${labels}.${o}`)}
          </label>
        ))}
      </div>
    </fieldset>
  );
};

const Several = ({ label, options, labels, values, onChange }) => {
  const { t } = useTranslation();
  const toggle = o => onChange(values.includes(o) ? values.filter(v => v !== o) : [...values, o]);
  return (
    <fieldset className="ai-question">
      <legend>{label}</legend>
      <div className="ai-pills">
        {options.map(o => (
          <label key={o} className={`ai-pill${values.includes(o) ? ' on' : ''}`}>
            <input type="checkbox" checked={values.includes(o)} onChange={() => toggle(o)} />
            {t(`${labels}.${o}`)}
          </label>
        ))}
      </div>
    </fieldset>
  );
};

const DetailsStep = ({ check, update }) => {
  const { t } = useTranslation();
  const q = key => t(`cropHealth.q.${key}`);
  const supported = CROPS.includes(check.crop);

  return (
    <>
      <section className="ai-group">
        <h2>{q('yourCrop')}</h2>
        <Choice
          name="crop" label={q('crop')} required options={[...CROPS, 'other']} labels="cropHealth.crops"
          value={check.crop} onChange={crop => update({ crop, stage: '', parts: [] })}
        />
        {check.crop === 'other' && <p className="ai-note" role="status">{t('cropHealth.otherCrop')}</p>}
        {supported && (
          <>
            <Choice
              name="stage" label={q('stage')} required options={STAGES[check.crop]} labels="cropHealth.stages"
              value={check.stage} onChange={stage => update({ stage })}
            />
            <div className="ai-question">
              <label htmlFor="ai-locality">{q('locality')}<Required /></label>
              <input
                id="ai-locality" type="text" value={check.locality} maxLength={60} autoComplete="address-level2"
                aria-describedby="ai-locality-hint" onChange={e => update({ locality: e.target.value })}
              />
              <small id="ai-locality-hint" className="ai-muted">{q('localityHint')}</small>
            </div>
          </>
        )}
      </section>

      {supported && (
        <section className="ai-group">
          <h2>{q('whatYouSee')}</h2>
          <Choice
            name="onset" label={q('onset')} required options={ONSET} labels="cropHealth.onset" value={check.onset}
            onChange={onset => update(onset === 'none' ? { onset, extent: '', parts: [], spreading: '' } : { onset })}
          />
          {check.onset && hasSymptoms(check) && (
            <>
              <Choice
                name="extent" label={q('extent')} required options={EXTENT} labels="cropHealth.extent"
                value={check.extent} onChange={extent => update({ extent })}
              />
              <Several
                label={q('parts')} options={PARTS[check.crop]} labels="cropHealth.parts"
                values={check.parts} onChange={parts => update({ parts })}
              />
              <Choice
                name="spreading" label={q('spreading')} options={SPREADING} labels="cropHealth.yesNo"
                value={check.spreading} onChange={spreading => update({ spreading })}
              />
            </>
          )}
        </section>
      )}

      {supported && check.onset && (
        <section className="ai-group">
          <h2>{q('recent')}</h2>
          <Choice
            name="weather" label={q('weather')} options={WEATHER} labels="cropHealth.weather"
            value={check.weather} onChange={weather => update({ weather })}
          />
          <Choice
            name="treatment" label={q('treatment')} options={TREATMENT} labels="cropHealth.treatment" value={check.treatment}
            onChange={treatment => update(treated({ treatment }) ? { treatment } : { treatment, treatmentWhen: '' })}
          />
          {treated(check) && (
            <Choice
              name="treatmentWhen" label={q('treatmentWhen')} options={TREATMENT_WHEN} labels="cropHealth.treatmentWhen"
              value={check.treatmentWhen} onChange={treatmentWhen => update({ treatmentWhen })}
            />
          )}
        </section>
      )}
    </>
  );
};

export default DetailsStep;
