// this file is to see the details with user name and post date all those things
import React, { Fragment, useState } from 'react'
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import Moment from 'react-moment';
import { connect } from 'react-redux';
import { deletePost, updatePost } from '../../actions/post';
import EditPostPanel from './EditPostPanel';
import OrderPanel from './OrderPanel';
import ReportPanel from './ReportPanel';
import api from '../../utils/api';
import { useTranslation } from 'react-i18next';
import './PostItem.css';

const PostItem = ({
  deletePost,
  updatePost,
  auth,
  post,
  showActions
}) => {
  const {_id, text, name, avatar, user, comments, date, farmerName, productName, mobileNumber, productImage, weight, price, address, category, available} = post;
  const { t } = useTranslation();
  const unit = post.unit || 'kg';
  const unitLabel = t(`units.${unit}`);
  const stock = post.quantityAvailable ?? weight;
  const soldOut = !available || stock <= 0;
  const [panel, setPanel] = useState(null); // 'edit' | 'order' | 'report' | null
  const [favorite, setFavorite] = useState(!!post.isFavorite);
  const rating = post.farmerRating;

  const toggleFavorite = async () => {
    try {
      const res = await api.put(`/api/favorites/${_id}`);
      setFavorite(res.data.favorite);
    } catch (err) { /* ignore: heart simply doesn't change */ }
  };

  const isOwner = !auth.loading && auth.user && user === auth.user._id;
  const isConsumer = !auth.loading && auth.user && auth.user.userType === 'consumer';

  return (
<div className="product-card">
  <div className="product-card-header">
    <Link to={`/farmer/${user}`} className="farmer-info">
      <img className="farmer-avatar" src={avatar} alt={name} />
      <div className="farmer-details">
        <h4 className="farmer-name">
          {farmerName || name}
          {post.farmerVerified && <small title={t('product.verified')} style={{marginLeft: 6, color: '#1e88e5'}}>✔</small>}
          {rating && rating.count > 0 && (
            <small title={`${rating.count} review${rating.count === 1 ? '' : 's'}`} style={{marginLeft: 6, color: '#f9a825'}}>
              ★ {rating.average} ({rating.count})
            </small>
          )}
        </h4>
        <p className="post-date-small">
          <i className="far fa-calendar"></i> <Moment format='DD MMM YYYY'>{date}</Moment>
        </p>
      </div>
    </Link>
  </div>

  {post.hidden && (
    <div className="bg-light" style={{padding: '0.4rem 1rem', color: '#a12622'}}>{t('product.hiddenNotice')}</div>
  )}

  {productImage && (
    <div className="product-image-container">
      <img
        src={productImage}
        alt={productName}
        className="product-image"
      />
    </div>
  )}

  <div className="product-card-body">
    <h3 className="product-name">
      {productName}{' '}
      {category && <small className="category-badge">{t(`categories.${category}`, category)}</small>}{' '}
      {soldOut && <small className="sold-out-badge" style={{color: '#c62828', fontWeight: 700}}>{t('product.soldOutBadge')}</small>}
    </h3>

    {post.bulkPricing && post.bulkPricing.length > 0 && (
      <p className="order-meta" style={{color: '#2d5016', fontWeight: 600}}>
        🏷️ {post.bulkPricing.map(b => t('product.bulkOffer', { qty: b.minQuantity, unit: unitLabel, price: b.price })).join(' · ')}
      </p>
    )}

    <div className="product-info-grid">
      <div className="info-item">
        <span className="info-icon">📱</span>
        <div>
          <small>{t('product.contact')}</small>
          <p>{mobileNumber}</p>
        </div>
      </div>
      <div className="info-item">
        <span className="info-icon">⚖️</span>
        <div>
          <small>{t('product.inStock')}</small>
          <p>{soldOut ? t('product.soldOut') : `${stock} ${unitLabel}`}</p>
        </div>
      </div>
      <div className="info-item">
        <span className="info-icon">💰</span>
        <div>
          <small>{t('product.pricePer', { unit: unitLabel })}</small>
          <p>₹{price}</p>
        </div>
      </div>
      <div className="info-item highlight">
        <span className="info-icon">💵</span>
        <div>
          <small>{t('product.stockValue')}</small>
          <p className="total-amount">₹{Number(soldOut ? 0 : stock * price).toFixed(2)}</p>
        </div>
      </div>
    </div>

    <div className="product-location">
      <i className="fas fa-map-marker-alt"></i> {address}
    </div>

    {text && (
      <div className="product-description">
        <p>{text}</p>
      </div>
    )}
  </div>

  {showActions && (
    <div className="product-card-footer">
      <Link to={`/posts/${_id}`} className="btn-comment">
        <i className="far fa-comment"></i> {t('product.comments')}
        {comments.length > 0 && (
          <span className='comment-badge'>{comments.length}</span>
        )}
      </Link>

      {isOwner && (
        <Fragment>
          <button onClick={() => setPanel(panel === 'edit' ? null : 'edit')} type="button" className="btn-comment">
            <i className="fas fa-edit"></i> {t('product.edit')}
          </button>
          <button
            onClick={() => updatePost(_id, { available: soldOut })}
            type="button"
            className="btn-comment"
            disabled={soldOut && stock <= 0}
            title={soldOut && stock <= 0 ? 'Add stock via Edit to re-open' : ''}>
            {soldOut ? t('product.markAvailable') : t('product.markSoldOut')}
          </button>
          <button
            onClick={() => deletePost(_id)}
            type="button"
            className="btn-delete">
            <i className="fas fa-trash"></i> {t('product.delete')}
          </button>
        </Fragment>
      )}

      {isConsumer && !isOwner && (
        <button onClick={toggleFavorite} type="button" className="btn-comment" title={favorite ? 'Remove from saved' : 'Save for later'}>
          {favorite ? `❤️ ${t('product.saved')}` : `🤍 ${t('product.save')}`}
        </button>
      )}

      {!isOwner && !auth.loading && auth.user && (
        <button onClick={() => setPanel(panel === 'report' ? null : 'report')} type="button" className="btn-comment" title={t('product.report')}>
          <i className="fas fa-flag"></i>
        </button>
      )}

      {isConsumer && !isOwner && (
        <button
          onClick={() => setPanel(panel === 'order' ? null : 'order')}
          type="button"
          className="btn-comment"
          disabled={soldOut}>
          <i className="fas fa-shopping-basket"></i> {soldOut ? t('product.unavailable') : t('product.order')}
        </button>
      )}
    </div>
  )}

  {showActions && panel === 'edit' && <EditPostPanel post={post} onClose={() => setPanel(null)} />}
  {showActions && panel === 'report' && <ReportPanel post={post} onClose={() => setPanel(null)} />}
  {showActions && panel === 'order' && <OrderPanel post={post} stock={stock} onClose={() => setPanel(null)} />}
</div>
  );
};

PostItem.defaultProps ={
  showActions:true
};

PostItem.propTypes = {
    post: PropTypes.object.isRequired,
    auth: PropTypes.object.isRequired,
    deletePost: PropTypes.func.isRequired,
    updatePost: PropTypes.func.isRequired
};

const mapStateToProps= state => ({
    auth: state.auth
});

export default connect(
  mapStateToProps,
  { deletePost, updatePost }
  ) (PostItem);