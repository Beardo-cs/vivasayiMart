import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

const ICONS = { phone: '📞', visit: '🏡' };

// Checks our team actually did. compact: small icons next to a name (cards, directory);
// otherwise each badge with one line of explanation (farmer page).
const Badges = ({ badges, compact }) => {
  const { t, i18n } = useTranslation();
  const shown = (badges || []).filter(b => ICONS[b.type]);
  if (shown.length === 0) return null;

  if (compact) {
    return (
      <span className='badge-chips'>
        {shown.map(b => (
          <span key={b.type} className='badge-chip' role='img' aria-label={t(`badges.${b.type}`)} title={t(`badges.${b.type}`)}>
            {ICONS[b.type]}
          </span>
        ))}
      </span>
    );
  }

  const day = d => (d
    ? new Date(d).toLocaleDateString(i18n.language === 'ta' ? 'ta-IN' : 'en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '');
  return (
    <ul className='badge-list'>
      {shown.map(b => (
        <li key={b.type}>
          <strong>{ICONS[b.type]} {t(`badges.${b.type}`)}</strong>
          <span>{t(`badges.${b.type}Help`, { date: day(b.type === 'visit' ? b.visitedOn : b.at) })}</span>
        </li>
      ))}
    </ul>
  );
};

Badges.propTypes = { badges: PropTypes.array, compact: PropTypes.bool };

export default Badges;
