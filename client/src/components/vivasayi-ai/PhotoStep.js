import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PHOTO_SLOTS } from './crops';
import { photoWarnings } from './photoChecks';
import { readPhoto } from './photos';

const inSlotOrder = photos => PHOTO_SLOTS.map(s => photos.find(p => p.slot === s)).filter(Boolean);

const PhotoStep = ({ photos, onChange }) => {
  const { t } = useTranslation();
  const cameraRef = useRef(null);
  const galleryRef = useRef(null);
  const slotRef = useRef(null);
  const [busySlot, setBusySlot] = useState(null);
  const [error, setError] = useState('');

  const title = slot => t(`cropHealth.slots.${slot}.title`);

  const pick = (slot, camera) => {
    slotRef.current = slot;
    (camera ? cameraRef : galleryRef).current.click();
  };

  const onFile = async e => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    const slot = slotRef.current;
    if (!file || !slot) return;
    setError('');
    setBusySlot(slot);
    try {
      const { src, light, sharp, hash } = await readPhoto(file);
      onChange(inSlotOrder([...photos.filter(p => p.slot !== slot), { slot, src, light, sharp, hash }]));
    } catch (err) {
      setError(t('cropHealth.photos.failed'));
    }
    setBusySlot(null);
  };

  const remove = slot => onChange(photos.filter(p => p.slot !== slot));
  const moveTo = (from, to) =>
    onChange(inSlotOrder(photos.map(p => (p.slot === from ? { ...p, slot: to } : p.slot === to ? { ...p, slot: from } : p))));

  return (
    <section className="ai-group">
      <h2>{t('cropHealth.steps.photos')}</h2>
      <p>{t('cropHealth.photos.intro')}</p>
      <p className="ai-note">{t('cropHealth.photos.safety')}</p>

      <input ref={cameraRef} className="ai-file" type="file" accept="image/*" capture="environment" tabIndex={-1} aria-hidden="true" data-testid="camera-input" onChange={onFile} />
      <input ref={galleryRef} className="ai-file" type="file" accept="image/*" tabIndex={-1} aria-hidden="true" data-testid="gallery-input" onChange={onFile} />

      {error && <p className="ai-warn" role="alert">{error}</p>}

      <ol className="ai-slots">
        {PHOTO_SLOTS.map((slot, i) => {
          const photo = photos.find(p => p.slot === slot);
          const warnings = photo ? photoWarnings(photo, photos.filter(p => p !== photo).map(p => p.hash)) : [];
          return (
            <li key={slot} className={`ai-slot${photo ? ' filled' : ''}`}>
              <h3>{i + 1}. {title(slot)}</h3>
              {photo ? (
                <>
                  <img src={photo.src} alt={title(slot)} />
                  {warnings.map(w => <p key={w} className="ai-warn">{t(`cropHealth.photos.warn.${w}`)}</p>)}
                  <div className="ai-slot-actions">
                    <button type="button" className="btn btn-light" aria-label={`${t('cropHealth.photos.retake')}: ${title(slot)}`} onClick={() => pick(slot, true)}>
                      {t('cropHealth.photos.retake')}
                    </button>
                    <button type="button" className="btn btn-light" aria-label={`${t('cropHealth.photos.remove')}: ${title(slot)}`} onClick={() => remove(slot)}>
                      {t('cropHealth.photos.remove')}
                    </button>
                  </div>
                  <label className="ai-shows">
                    {t('cropHealth.photos.shows')}
                    <select value={slot} onChange={e => moveTo(slot, e.target.value)}>
                      {PHOTO_SLOTS.map(s => <option key={s} value={s}>{title(s)}</option>)}
                    </select>
                  </label>
                </>
              ) : (
                <>
                  <p className="ai-muted">{t(`cropHealth.slots.${slot}.hint`)}</p>
                  {busySlot === slot ? (
                    <p role="status">{t('cropHealth.photos.reading')}</p>
                  ) : (
                    <div className="ai-slot-actions">
                      <button type="button" className="btn btn-light" aria-label={`${t('cropHealth.photos.camera')}: ${title(slot)}`} onClick={() => pick(slot, true)}>
                        <i className="fas fa-camera" aria-hidden="true"></i> {t('cropHealth.photos.camera')}
                      </button>
                      <button type="button" className="btn btn-light" aria-label={`${t('cropHealth.photos.gallery')}: ${title(slot)}`} onClick={() => pick(slot, false)}>
                        <i className="fas fa-image" aria-hidden="true"></i> {t('cropHealth.photos.gallery')}
                      </button>
                    </div>
                  )}
                </>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
};

export default PhotoStep;
