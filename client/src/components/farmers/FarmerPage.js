// Public, shareable farmer page: /farmer/:id (works without logging in)
import React, { Fragment, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Moment from 'react-moment';
import { useTranslation } from 'react-i18next';
import api from '../../utils/api';
import Loader from '../layout/Loader';
import { Stars } from './Farmers';
import Badges from './Badges';
import PageHeader from '../layout/PageHeader';
import { setAlert } from '../../actions/alert';
import { PUBLIC_SITE, isNative, shareLink } from '../../utils/native';
import '../posts/Posts.css';

const FarmerPage = ({ isAuthenticated, setAlert }) => {
  const { t } = useTranslation();
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [state, setState] = useState('loading'); // loading | ok | notfound

  useEffect(() => {
    let cancelled = false;
    setState('loading');
    Promise.all([
      api.get(`/api/farmer-profile/${id}/public`),
      api.get(`/api/reviews/farmer/${id}`).catch(() => ({ data: { reviews: [] } }))
    ]).then(([farmer, rev]) => {
      if (cancelled) return;
      setData(farmer.data);
      setReviews(rev.data.reviews || []);
      setState('ok');
    }).catch(() => { if (!cancelled) setState('notfound'); });
    return () => { cancelled = true; };
  }, [id]);

  if (state === 'loading') return <Loader message={t('farmers.loading')} fullPage={false} />;
  if (state === 'notfound') {
    return (
      <Fragment>
        <PageHeader icon="🧭" title={t('farmerPage.notFound')} />
        <Link to='/farmers' className='btn btn-light'>{t('farmerPage.back')}</Link>
      </Fragment>
    );
  }

  const { farmer, profile, products, rating } = data;
  const url = `${PUBLIC_SITE}/farmer/${farmer._id}`;
  const shareText = t('farmerPage.shareText', { name: (profile && profile.farmName) || farmer.name });
  const whatsappShare = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${url}`)}`;

  const shareIt = () => shareLink({ title: (profile && profile.farmName) || farmer.name, text: shareText, url });

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setAlert(t('farmerPage.linkCopied'), 'success');
    } catch (e) {
      window.prompt(t('farmerPage.copyLink'), url);
    }
  };

  return (
    <Fragment>
      <Link to='/farmers' className='btn btn-light'>{t('farmerPage.back')}</Link>

      <PageHeader
        icon="🌾"
        title={(profile && profile.farmName) || farmer.name}
        subtitle={`${farmer.name}${profile && profile.location ? ` · ${profile.location}` : ''}`}
      />

      <div className='profile bg-light my-1'>
        <img src={farmer.avatar} alt='' className='round-img' />
        <div>
          <p><Stars rating={rating} /></p>
          <Badges badges={farmer.badges} />
          <div className='order-actions'>
            <a className='btn btn-primary' href={whatsappShare} target='_blank' rel='noopener noreferrer'>
              <i className='fab fa-whatsapp'></i> {t('farmerPage.share')}
            </a>
            {isNative()
              ? <button type='button' className='btn btn-light' onClick={shareIt}>{t('farmerPage.shareLink')}</button>
              : <button type='button' className='btn btn-light' onClick={copyLink}>{t('farmerPage.copyLink')}</button>}
          </div>
        </div>
        {profile && (
          <div>
            {profile.yearsOfExperience > 0 && <p>🧑‍🌾 {t('farmerPage.experience', { years: profile.yearsOfExperience })}</p>}
            {profile.farmSize && <p>🌾 {t('farmerPage.farmSize', { size: profile.farmSize })}</p>}
            {profile.certifications && <p>🏅 {profile.certifications}</p>}
            {(profile.farmingSpecializations || []).length > 0 && (
              <p>{profile.farmingSpecializations.join(', ')}</p>
            )}
          </div>
        )}
      </div>

      {profile && profile.bio && (
        <Fragment>
          <h2 className='text-primary'>{t('farmerPage.about')}</h2>
          <p>{profile.bio}</p>
        </Fragment>
      )}

      <h2 className='text-primary my-1'>{t('farmerPage.currentProducts')}</h2>
      {products.length === 0 && <p className='posts-count'>{t('farmerPage.noProducts')}</p>}
      <div className='posts-grid'>
        {products.map(p => (
          <div className='product-card' key={p._id}>
            {p.productImage && <div className='product-image-container'><img src={p.productImage} alt={p.productName} className='product-image' /></div>}
            <div className='product-card-body'>
              <h3 className='product-name'>{p.productName} <small className='category-badge'>{t(`categories.${p.category}`, p.category)}</small></h3>
              <p>₹{p.price}/{t(`units.${p.unit || 'kg'}`)} · {t('farmerPage.inStock', { qty: p.quantityAvailable ?? p.weight, unit: t(`units.${p.unit || 'kg'}`) })}</p>
              <p className='order-meta'>{p.address}</p>
            </div>
            <div className='product-card-footer'>
              <Link to={isAuthenticated ? `/posts?farmer=${farmer._id}` : '/login'} className='btn-comment'>
                {isAuthenticated ? t('product.order') : t('farmerPage.loginToOrder')}
              </Link>
            </div>
          </div>
        ))}
      </div>

      {reviews.length > 0 && (
        <Fragment>
          <h2 className='text-primary my-1'>{t('farmerPage.recentReviews')}</h2>
          {reviews.map(r => (
            <div className='order-card' key={r._id}>
              <p><span style={{ color: '#f9a825' }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span> · {r.buyerName} · <Moment format='DD MMM YYYY'>{r.date}</Moment></p>
              {r.productName && <p className='order-meta'>{r.productName}</p>}
              {r.comment && <p>{r.comment}</p>}
            </div>
          ))}
        </Fragment>
      )}
    </Fragment>
  );
};

FarmerPage.propTypes = {
  isAuthenticated: PropTypes.bool,
  setAlert: PropTypes.func.isRequired
};

const mapStateToProps = state => ({ isAuthenticated: !!state.auth.isAuthenticated });
export default connect(mapStateToProps, { setAlert })(FarmerPage);
