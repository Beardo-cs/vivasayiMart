import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageHeader from '../layout/PageHeader';
import DetailsStep from './DetailsStep';
import PhotoStep from './PhotoStep';
import ReviewStep from './ReviewStep';
import { newCheck, detailsComplete } from './crops';
import { sampleResult } from './sampleResult';
import { getCheck, getDraft, saveDraft, saveCheck, clearDraft } from '../../utils/cropStore';
import '../posts/Posts.css';
import './VivasayiAI.css';

const STEPS = ['details', 'photos', 'review', 'result'];
const PROCESSING_MS = 1200;
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

const NewCheck = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const user = useSelector(state => state.auth.user);
  const [check, setCheck] = useState(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const topRef = useRef(null);

  const recheckId = params.get('recheck');
  const addInfo = params.get('add') === '1';

  useEffect(() => {
    let live = true;
    (async () => {
      const parent = recheckId ? await getCheck(user._id, recheckId) : null;
      const draft = parent ? null : await getDraft(user._id);
      if (live) setCheck(parent ? newCheck(parent, { addInfo }) : draft || newCheck());
    })();
    return () => { live = false; };
  }, [user._id, recheckId, addInfo]);

  if (!check) return null;

  const update = changes => {
    setMessage('');
    setCheck(c => ({ ...c, ...changes }));
  };

  const store = next => saveDraft(user._id, next).then(() => true, () => {
    setMessage(t('cropHealth.saveFailed'));
    return false;
  });

  const go = step => {
    const next = { ...check, step };
    setCheck(next);
    setMessage('');
    store(next);
    if (topRef.current && topRef.current.scrollIntoView) topRef.current.scrollIntoView({ block: 'start' });
  };

  const onContinue = () => {
    if (check.step === 0 && !detailsComplete(check)) return setMessage(t('cropHealth.required'));
    if (check.step === 1 && !check.photos.length) return setMessage(t('cropHealth.photos.needOne'));
    go(check.step + 1);
  };

  const onBack = () => {
    if (check.step > 0) return go(check.step - 1);
    if (check.crop) store(check);
    navigate('/vivasayi-ai');
  };

  const onSaveDraft = async () => {
    if (await store(check)) setMessage(t('cropHealth.draftSaved'));
  };

  const submit = async () => {
    if (busy) return;
    setBusy(true);
    const { step, key, ...answers } = check;
    const record = { ...answers, createdAt: Date.now(), result: sampleResult(check) };
    try {
      await Promise.all([saveCheck(user._id, record), wait(PROCESSING_MS)]);
      await clearDraft(user._id);
      navigate(`/vivasayi-ai/assessments/${record.id}`, { replace: true });
    } catch (err) {
      setBusy(false);
      setMessage(t('cropHealth.saveFailed'));
    }
  };

  if (busy) {
    return (
      <div className="ai-page">
        <div className="ai-processing" role="status">
          <span className="ai-spinner" aria-hidden="true"></span>
          <p><strong>{t('cropHealth.processing')}</strong></p>
          <p className="ai-muted">{t('cropHealth.review.notice')}</p>
        </div>
      </div>
    );
  }

  const unsupported = check.crop === 'other';

  return (
    <div className="ai-page" ref={topRef}>
      <PageHeader icon="🌿" title={t('cropHealth.title')} subtitle={t('cropHealth.subtitle')} />
      <ol className="wizard-steps ai-steps" aria-label={t('cropHealth.steps.label')}>
        {STEPS.map((s, i) => (
          <li key={s} className={i === check.step ? 'active' : i < check.step ? 'done' : ''} aria-current={i === check.step ? 'step' : undefined}>
            <span>{i < check.step ? '✓' : i + 1}</span> {t(`cropHealth.steps.${s}`)}
          </li>
        ))}
      </ol>

      {check.step === 0 && <DetailsStep check={check} update={update} />}
      {check.step === 1 && <PhotoStep photos={check.photos} onChange={photos => update({ photos })} />}
      {check.step === 2 && <ReviewStep check={check} go={go} />}

      {message && <p className="ai-message" role="status">{message}</p>}
      <div className="wizard-actions ai-actions">
        <button type="button" className="btn btn-light" onClick={onBack}>{t('cropHealth.back')}</button>
        {!unsupported && (
          <>
            <button type="button" className="btn btn-light" onClick={onSaveDraft}>{t('cropHealth.saveDraft')}</button>
            {check.step < 2 ? (
              <button type="button" className="btn btn-primary" onClick={onContinue}>{t('cropHealth.continue')}</button>
            ) : (
              <button type="button" className="btn btn-primary" onClick={submit}>{t('cropHealth.submit')}</button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default NewCheck;
