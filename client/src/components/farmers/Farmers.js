import React, { Fragment, useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Loader from '../layout/Loader';
import { getFarmers } from '../../actions/profile';
import '../posts/Posts.css';

export const Stars = ({ rating }) => {
  const { t } = useTranslation();
  return rating && rating.count > 0 ? (
    <span style={{ color: '#f9a825' }}>
      ★ {rating.average} <small>({t('farmerPage.reviews', { count: rating.count })})</small>
    </span>
  ) : (
    <small>{t('farmerPage.noRating')}</small>
  );
};

const Farmers = ({ getFarmers, profile: { profiles, loading } }) => {
  const { t } = useTranslation();
  useEffect(() => { getFarmers(); }, [getFarmers]);

  if (loading) return <Loader message={t('farmers.loading')} fullPage={false} />;

  return (
    <Fragment>
      <h1 className='large text-primary'>{t('farmers.title')}</h1>
      <p className='lead'><i className='fas fa-seedling'></i> {t('farmers.subtitle')}</p>

      {profiles.length === 0 && <p className='posts-count'>{t('farmers.none')}</p>}

      <div className='profiles'>
        {profiles.map(p => (
          <div className='profile bg-light' key={p._id}>
            <img src={p.user.avatar} alt='' className='round-img' />
            <div>
              <h4 className='text-primary'>
                {p.farmName}
                {p.user.farmerVerified && <small title={t('product.verified')} style={{ color: '#1e88e5' }}> ✔</small>}
              </h4>
              <p><strong>{p.user.name}</strong> · {p.location}</p>
              <p><Stars rating={p.rating} /></p>
              <Link to={`/farmer/${p.user._id}`} className='btn btn-primary'>{t('farmers.viewPage')}</Link>
            </div>
            <div>
              <h4 className='text-primary'>{t('farmers.farming')}</h4>
              <ul>
                {(p.farmingSpecializations || []).slice(0, 4).map((s, i) => <li key={i} className='text-primary'>{s}</li>)}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </Fragment>
  );
};

Farmers.propTypes = {
  getFarmers: PropTypes.func.isRequired,
  profile: PropTypes.object.isRequired
};

const mapStateToProps = state => ({ profile: state.profile });
export default connect(mapStateToProps, { getFarmers })(Farmers);
