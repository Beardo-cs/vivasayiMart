import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';
import PageHeader from '../layout/PageHeader';
import ListenControls from './ListenControls';
import { summaryLines } from './sampleResult';
import { shortDate } from './dates';
import { getCheck, deleteCheck } from '../../utils/cropStore';
import { shareLink } from '../../utils/native';
import './VivasayiAI.css';

const Section = ({ title, className = '', children }) => (
  <section className={`ai-section ${className}`}>
    <h2>{title}</h2>
    {children}
  </section>
);

const CheckResult = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const user = useSelector(state => state.auth.user);
  const [check, setCheck] = useState(undefined);
  const [note, setNote] = useState('');

  useEffect(() => {
    let live = true;
    getCheck(user._id, id).then(found => { if (live) setCheck(found || null); });
    return () => { live = false; };
  }, [user._id, id]);

  if (check === undefined) return null;
  if (!check) {
    return (
      <div className="ai-page">
        <PageHeader icon="🌿" title={t('cropHealth.title')} />
        <p className="ai-muted">{t('cropHealth.result.notFound')}</p>
        <Link to="/vivasayi-ai" className="btn btn-light">{t('cropHealth.result.back')}</Link>
      </div>
    );
  }

  const { result } = check;
  const crop = t(`cropHealth.crops.${check.crop}`);

  const share = async () => {
    const header = `${t('cropHealth.share.title')}: ${crop}, ${check.locality}, ${shortDate(check.createdAt)}`;
    const outcome = await shareLink({ title: t('cropHealth.share.title'), text: [header, ...summaryLines(result, t)].join('\n') });
    setNote(outcome === 'copied' ? t('cropHealth.result.copied') : '');
  };

  const remove = async () => {
    if (!window.confirm(t('cropHealth.result.deleteConfirm'))) return;
    await deleteCheck(user._id, check.id);
    navigate('/vivasayi-ai', { replace: true });
  };

  return (
    <div className="ai-page ai-result">
      <PageHeader icon="🌿" title={crop} subtitle={`${check.locality} · ${shortDate(check.createdAt)}`} />
      <p className="ai-sample" role="note">
        <strong>{t('cropHealth.result.sample')}</strong> {t('cropHealth.result.sampleNote')}
      </p>
      {check.parentId && (
        <p className="ai-muted">
          {check.parentCreatedAt ? t('cropHealth.result.followUpTo', { date: shortDate(check.parentCreatedAt) }) : t('cropHealth.followUp')}
        </p>
      )}

      <section className={`ai-outcome ${result.outcome}`}>
        <small>{t('cropHealth.result.outcomeLabel')}</small>
        <h2>{t(`cropHealth.outcome.${result.outcome}`)}</h2>
        {result.outcome === 'noIssue' && <p>{t('cropHealth.result.noIssueNote')}</p>}
      </section>

      <ListenControls linesFor={lang => summaryLines(result, i18n.getFixedT(lang))} />

      {result.outcome === 'insufficient' && (
        <Section title={t('cropHealth.result.addPhotosTitle')}>
          <p>{t('cropHealth.result.addPhotos')}</p>
          <ul>{result.missing.map(s => <li key={s}>{t(`cropHealth.slots.${s}.title`)}</li>)}</ul>
        </Section>
      )}

      {result.outcome === 'needsCheck' && (
        <>
          <Section title={t('cropHealth.result.seen')}>
            <p className="ai-muted">{t('cropHealth.result.seenSample')}</p>
          </Section>
          <Section title={t('cropHealth.result.causes')}>
            <p className="ai-muted">{t('cropHealth.result.causesNote')}</p>
            {result.causes.map(c => (
              <article key={c} className="ai-cause">
                <h3>{t(`cropHealth.causes.${c}.title`)}</h3>
                <dl>
                  <dt>{t('cropHealth.result.fits')}</dt>
                  <dd>{t(`cropHealth.causes.${c}.fits`)}</dd>
                  <dt>{t('cropHealth.result.missing')}</dt>
                  <dd>{t(`cropHealth.causes.${c}.missing`)}</dd>
                  <dt>{t('cropHealth.result.nextCheck')}</dt>
                  <dd>{t(`cropHealth.causes.${c}.next`)}</dd>
                </dl>
              </article>
            ))}
          </Section>
          <Section title={t('cropHealth.result.cannotConfirm')}>
            <ul>{result.cannotConfirm.map(k => <li key={k}>{t(`cropHealth.cannot.${k}`)}</li>)}</ul>
          </Section>
        </>
      )}

      {result.nextChecks && (
        <Section title={t('cropHealth.result.nextChecks')}>
          <ul>{result.nextChecks.map(k => <li key={k}>{t(`cropHealth.next.${k}`)}</li>)}</ul>
        </Section>
      )}

      <Section title={t('cropHealth.result.guidance')} className="ai-guidance">
        <p>{t('cropHealth.result.guidanceNone')}</p>
      </Section>
      <Section title={t('cropHealth.result.expert')} className={result.urgent ? 'ai-expert urgent' : 'ai-expert'}>
        <p>{t(`cropHealth.expert.${result.urgent ? 'urgent' : 'normal'}`)}</p>
      </Section>
      <Section title={t('cropHealth.result.photosTitle')}>
        <div className="ai-thumbs">
          {check.photos.map(p => <img key={p.slot} src={p.src} alt={t(`cropHealth.slots.${p.slot}.title`)} />)}
        </div>
      </Section>
      <Section title={t('cropHealth.result.sources')}>
        <p className="ai-muted">{t('cropHealth.result.sourcesNone')}</p>
      </Section>

      {note && <p className="ai-message" role="status">{note}</p>}
      <div className="ai-result-actions">
        {result.outcome === 'insufficient' ? (
          <Link to={`/vivasayi-ai/new?recheck=${check.id}&add=1`} className="btn btn-primary">{t('cropHealth.result.addInfo')}</Link>
        ) : (
          <Link to={`/vivasayi-ai/new?recheck=${check.id}`} className="btn btn-primary">{t('cropHealth.result.checkAgain')}</Link>
        )}
        <button type="button" className="btn btn-light" onClick={share}>
          <i className="fas fa-share-alt" aria-hidden="true"></i> {t('cropHealth.result.share')}
        </button>
        <button type="button" className="btn btn-danger" onClick={remove}>{t('cropHealth.result.delete')}</button>
      </div>
      <Link to="/vivasayi-ai" className="ai-back">{t('cropHealth.result.back')}</Link>
    </div>
  );
};

export default CheckResult;
