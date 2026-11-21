import React, { Fragment, useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { setLanguage } from '../../i18n';
import api from '../../utils/api';
import HeroScene from './HeroScene';

const CATEGORY_ICONS = { Vegetables: '🥬', Fruits: '🍎', Grains: '🌾', Dairy: '🥛', Poultry: '🐔', Other: '🌱' };

// A recognisable picture for common produce; anything else falls back to its category icon
const PRODUCE_ICONS = [
  ['tomato', '🍅'], ['mango', '🥭'], ['banana', '🍌'], ['rice', '🌾'], ['paddy', '🌾'], ['wheat', '🌾'], ['milk', '🥛'],
  ['onion', '🧅'], ['potato', '🥔'], ['carrot', '🥕'], ['brinjal', '🍆'], ['eggplant', '🍆'], ['chilli', '🌶️'], ['chili', '🌶️'],
  ['coconut', '🥥'], ['egg', '🥚'], ['apple', '🍎'], ['grape', '🍇'], ['orange', '🍊'], ['lemon', '🍋'], ['corn', '🌽'],
  ['garlic', '🧄'], ['cabbage', '🥬'], ['spinach', '🥬'], ['cucumber', '🥒'], ['pumpkin', '🎃'], ['groundnut', '🥜'],
  ['peanut', '🥜'], ['honey', '🍯'], ['chicken', '🍗'], ['watermelon', '🍉'], ['papaya', '🥭'], ['pineapple', '🍍'], ['guava', '🍐']
];
const iconFor = p => {
  const name = String(p.productName || '').toLowerCase();
  const hit = PRODUCE_ICONS.find(([word]) => name.includes(word));
  return hit ? hit[1] : (CATEGORY_ICONS[p.category] || '🌱');
};

const Landing = ({isAuthenticated}) => {
  const { t, i18n } = useTranslation();
  const [featured, setFeatured] = useState([]);

  // a few real, in-stock products so new visitors see the marketplace is alive (public, no login)
  useEffect(() => {
    if (isAuthenticated) return undefined;
    let cancelled = false;
    api.get('/api/posts/featured')
      .then(res => { if (!cancelled) setFeatured(res.data); })
      .catch(() => { /* section simply stays hidden */ });
    return () => { cancelled = true; };
  }, [isAuthenticated]);

  if (isAuthenticated) {
    return <Navigate to='/dashboard' replace />;
  }

  return (
    <Fragment>
      <section className="landing">
        <div className="landing-art">
          <HeroScene />
        </div>
        <div className="landing-panel">
          <h1 className="x-large">{t('landing.title')}</h1>
          {i18n.language !== 'ta' && <p className="landing-ta" lang="ta">விவசாயி மார்ட்</p>}
          <p className="lead">{t('landing.tagline')}</p>
          <div className="buttons landing-roles">
            <Link to="/register?role=farmer" className="btn btn-hero">🌾 {t('landing.imFarmer')}</Link>
            <Link to="/register?role=consumer" className="btn btn-hero alt">🛒 {t('landing.imBuyer')}</Link>
          </div>
          <p className="landing-login">
            {t('landing.haveAccount')} <Link to="/login">{t('nav.login')}</Link>
          </p>
          <div className="landing-lang" role="group" aria-label={t('landing.chooseLanguage')}>
            <button type="button" className={i18n.language === 'ta' ? 'active' : ''} onClick={() => setLanguage('ta')}>தமிழ்</button>
            <button type="button" className={i18n.language === 'en' ? 'active' : ''} onClick={() => setLanguage('en')}>English</button>
          </div>
        </div>
      </section>

      <section className="landing-more">
        <h2 className="text-primary">{t('landing.howTitle')}</h2>
        <div className="landing-steps">
          {[1, 2, 3].map(n => (
            <div className="landing-step" key={n}>
              <div className="num">{n}</div>
              <h3>{t(`landing.step${n}Title`)}</h3>
              <p>{t(`landing.step${n}Text`)}</p>
            </div>
          ))}
        </div>

        {featured.length > 0 && (
          <Fragment>
            <h2 className="text-primary">{t('landing.featuredTitle')}</h2>
            <div className="landing-featured">
              {featured.map(p => (
                <Link to="/register?role=consumer" className="landing-product" key={p._id}>
                  <div className="icon">{iconFor(p)}</div>
                  <strong>{p.productName}</strong>
                  <span>₹{p.price}/{t(`units.${p.unit || 'kg'}`)}</span>
                  <small>{p.farmerName}</small>
                </Link>
              ))}
            </div>
            <p style={{ textAlign: 'center' }}>
              <Link to="/register?role=consumer" className="btn btn-primary">{t('landing.seeAll')}</Link>
            </p>
          </Fragment>
        )}
      </section>
    </Fragment>
  );
};
Landing.propTypes  ={
  isAuthenticated: PropTypes.bool
}

const mapStateToProps = state => ({
  isAuthenticated : state.auth.isAuthenticated
});
export default connect(mapStateToProps) (Landing);
