import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';
import PageHeader from '../layout/PageHeader';
import ListenControls from './ListenControls';
import { assessmentLines, outcomeNote, pick, needsSprayNote, sourcesOf, NEXT_CHECKS } from './assessment';
import { shortDate } from './dates';
import { getCheck, deleteCheck } from '../../utils/cropStore';
import { shareLink } from '../../utils/native';
import './VivasayiAI.css';

const HELPLINE = '18001801551';

const Section = ({ title, className = '', children }) => (
  <section className={`ai-section ${className}`}>
    <h2>{title}</h2>
    {children}
  </section>
);

const Cause = ({ cause, lang, t }) => (
  <article className="ai-cause">
    <h3>
      {pick(cause.name, lang)}{' '}
      <em className={`ai-tag ${cause.likelihood}`}>{t(`cropHealth.result.${cause.likelihood}`)}</em>
    </h3>
    <dl>
      {cause.fits && (
        <>
          <dt>{t('cropHealth.result.fits')}</dt>
          <dd>{pick(cause.fits, lang)}</dd>
        </>
      )}
      {cause.against && (
        <>
          <dt>{t('cropHealth.result.against')}</dt>
          <dd>{pick(cause.against, lang)}</dd>
        </>
      )}
      <dt>{t('cropHealth.result.nextCheck')}</dt>
      <dd>{pick(cause.check, lang)}</dd>
    </dl>
    <h4>{t('cropHealth.result.whatToDo')}</h4>
    <ul>{pick(cause.steps, lang).map(step => <li key={step}>{step}</li>)}</ul>
    <div className="ai-fertilizer">
      <h4>{t('cropHealth.result.fertilizer')}</h4>
      <p>{pick(cause.fertilizer, lang)}</p>
    </div>
    {needsSprayNote(cause) && <p className="ai-warn">{t('cropHealth.result.sprayNote')}</p>}
  </article>
);

const CheckResult = () => {
  const { t, i18n: { language } } = useTranslation();
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

  const lang = language === 'ta' ? 'ta' : 'en';
  const { result } = check;
  const real = result.version === 1;
  const crop = t(`cropHealth.crops.${check.crop}`);
  const sources = real ? sourcesOf(result) : [];
  const said = real && outcomeNote(result, t, lang, crop);

  const share = async () => {
    const header = `${t('cropHealth.share.title')}: ${crop}, ${check.locality}, ${shortDate(check.createdAt)}`;
    const outcome = await shareLink({ title: t('cropHealth.share.title'), text: [header, ...assessmentLines(check, t, lang)].join('\n') });
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
      {!real && <p className="ai-sample" role="note">{t('cropHealth.result.legacy')}</p>}
      {real && (
        <>
          <p className="ai-note" role="note">{t('cropHealth.result.aiNote')}</p>
          {check.parentId && (
            <p className="ai-muted">
              {check.parentCreatedAt ? t('cropHealth.result.followUpTo', { date: shortDate(check.parentCreatedAt) }) : t('cropHealth.followUp')}
            </p>
          )}

          <section className={`ai-outcome ${result.outcome}`}>
            <small>{t('cropHealth.result.outcomeLabel')}</small>
            <h2>{t(`cropHealth.outcome.${result.outcome}`)}</h2>
            {said && <p>{said}</p>}
          </section>

          <ListenControls linesFor={l => assessmentLines(check, i18n.getFixedT(l), l)} />

          {result.outcome === 'insufficient' && (
            <Section title={t('cropHealth.result.addPhotosTitle')}>
              <p>{t('cropHealth.result.addPhotos')}</p>
              <ul>{result.missingPhotos.map(s => <li key={s}>{t(`cropHealth.slots.${s}.title`)}</li>)}</ul>
            </Section>
          )}

          {result.observations.length > 0 && (
            <Section title={t('cropHealth.result.seen')}>
              <ul>{result.observations.map(o => <li key={o.en}>{pick(o, lang)}</li>)}</ul>
            </Section>
          )}

          {result.outcome === 'needsCheck' && (
            <>
              <Section title={t('cropHealth.result.causes')}>
                {result.causes.length > 0 ? (
                  <>
                    <p className="ai-muted">{t('cropHealth.result.causesNote')}</p>
                    {result.causes.map(c => <Cause key={c.id} cause={c} lang={lang} t={t} />)}
                  </>
                ) : (
                  <p>{t('cropHealth.result.noMatch', { crop })}</p>
                )}
              </Section>
              <Section title={t('cropHealth.result.cannotConfirm')}>
                <ul>{['exact', 'soil', 'field'].map(k => <li key={k}>{t(`cropHealth.cannot.${k}`)}</li>)}</ul>
              </Section>
            </>
          )}

          {NEXT_CHECKS[result.outcome] && (
            <Section title={t('cropHealth.result.nextChecks')}>
              <ul>{NEXT_CHECKS[result.outcome].map(k => <li key={k}>{t(`cropHealth.next.${k}`)}</li>)}</ul>
            </Section>
          )}

          <Section title={t('cropHealth.result.expert')} className={result.urgent ? 'ai-expert urgent' : 'ai-expert'}>
            <p>{t(`cropHealth.expert.${result.urgent ? 'urgent' : 'normal'}`)}</p>
            <p>
              <a href={`tel:${HELPLINE}`} className="btn btn-light">
                <i className="fas fa-phone" aria-hidden="true"></i> {t('cropHealth.result.helpline')}
              </a>
            </p>
          </Section>
        </>
      )}

      <Section title={t('cropHealth.result.photosTitle')}>
        <div className="ai-thumbs">
          {check.photos.map(p => <img key={p.slot} src={p.src} alt={t(`cropHealth.slots.${p.slot}.title`)} />)}
        </div>
      </Section>

      {sources.length > 0 && (
        <Section title={t('cropHealth.result.sources')}>
          <ul>
            {sources.map(s => (
              <li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.title}</a></li>
            ))}
          </ul>
          <p className="ai-muted">{t('cropHealth.result.reviewNote', { version: result.guidanceVersion })}</p>
        </Section>
      )}

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
