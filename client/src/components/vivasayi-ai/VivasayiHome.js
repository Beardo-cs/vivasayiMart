import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageHeader from '../layout/PageHeader';
import IntroDialog from './IntroDialog';
import { listChecks, getDraft, clearDraft } from '../../utils/cropStore';
import { shortDate } from './dates';
import './VivasayiAI.css';

const introKey = userId => `vivasayiAiIntro:${userId}`;

const VivasayiHome = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useSelector(state => state.auth.user);
  const [checks, setChecks] = useState(null);
  const [draft, setDraft] = useState(null);
  const [intro, setIntro] = useState(() => !localStorage.getItem(introKey(user._id)));

  useEffect(() => {
    let live = true;
    Promise.all([listChecks(user._id), getDraft(user._id)]).then(([list, saved]) => {
      if (!live) return;
      setChecks(list);
      setDraft(saved || null);
    });
    return () => { live = false; };
  }, [user._id]);

  const closeIntro = () => {
    localStorage.setItem(introKey(user._id), '1');
    setIntro(false);
  };
  const startFromIntro = () => {
    closeIntro();
    navigate('/vivasayi-ai/new');
  };
  const startOver = async () => {
    if (!window.confirm(t('cropHealth.discardDraft'))) return;
    await clearDraft(user._id);
    navigate('/vivasayi-ai/new');
  };

  return (
    <div className="ai-page">
      <PageHeader icon="🌿" title={t('cropHealth.title')} subtitle={t('cropHealth.subtitle')} />
      <p className="ai-preview" role="note">{t('cropHealth.preview')}</p>

      <div className="ai-start">
        {draft ? (
          <>
            <Link to="/vivasayi-ai/new" className="btn btn-primary">{t('cropHealth.continueDraft')}</Link>
            <button type="button" className="btn btn-light" onClick={startOver}>{t('cropHealth.startOver')}</button>
          </>
        ) : (
          <Link to="/vivasayi-ai/new" className="btn btn-primary">
            <i className="fas fa-seedling" aria-hidden="true"></i> {t('cropHealth.start')}
          </Link>
        )}
        <button type="button" className="ai-link" onClick={() => setIntro(true)}>{t('cropHealth.howItWorks')}</button>
      </div>

      <section className="ai-section">
        <h2>{t('cropHealth.history')}</h2>
        {checks && checks.length === 0 && <p className="ai-muted">{t('cropHealth.historyEmpty')}</p>}
        {checks && checks.length > 0 && (
          <ul className="ai-history">
            {checks.map(c => (
              <li key={c.id}>
                <Link to={`/vivasayi-ai/assessments/${c.id}`}>
                  {c.photos[0] ? <img src={c.photos[0].src} alt="" /> : <span className="ai-history-icon" aria-hidden="true">🌿</span>}
                  <span>
                    <strong>{t(`cropHealth.crops.${c.crop}`)}</strong> · {shortDate(c.createdAt)}
                    {c.parentId && <em className="ai-tag">{t('cropHealth.followUp')}</em>}
                    <small>{c.result.version ? t(`cropHealth.outcome.${c.result.outcome}`) : t('cropHealth.result.legacyShort')}</small>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {intro && <IntroDialog onStart={startFromIntro} onClose={closeIntro} />}
    </div>
  );
};

export default VivasayiHome;
