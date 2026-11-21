// Privacy Policy and Terms of Use. Text lives in the language files (legal.privacy / legal.terms).
// NOTE: this is a plain-language template, not legal advice; have it reviewed before relying on it.
import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageHeader from '../layout/PageHeader';

const CONTACT = process.env.REACT_APP_CONTACT_EMAIL; // optional: shown at the bottom when set

const Legal = ({ type }) => {
  const { t } = useTranslation();
  const sections = t(`legal.${type}.sections`, { returnObjects: true });
  const other = type === 'privacy' ? 'terms' : 'privacy';

  return (
    <>
    <PageHeader icon={type === 'privacy' ? '🔒' : '📄'} title={t(`legal.${type}.title`)} subtitle={t('legal.updated', { date: t('legal.date') })} />
    <article className="legal">
      <p className="notice">{t('legal.summary.' + type)}</p>

      {Array.isArray(sections) && sections.map((s, i) => (
        <Fragment key={i}>
          <h2>{i + 1}. {s.h}</h2>
          {(s.p || []).map((line, j) => <p key={j}>{line}</p>)}
          {s.list && <ul>{s.list.map((item, j) => <li key={j}>{item}</li>)}</ul>}
        </Fragment>
      ))}

      {CONTACT && (
        <Fragment>
          <h2>{t('legal.contactTitle')}</h2>
          <p><a href={`mailto:${CONTACT}`}>{CONTACT}</a></p>
        </Fragment>
      )}

      <p className="my-2">
        <Link to={`/${other}`}>{t(`legal.${other}.title`)} →</Link>
      </p>
    </article>
    </>
  );
};

Legal.propTypes = { type: PropTypes.oneOf(['privacy', 'terms']).isRequired };
export default Legal;
