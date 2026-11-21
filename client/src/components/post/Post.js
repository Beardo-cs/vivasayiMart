import React , {Fragment, useEffect} from 'react'
import PropTypes from 'prop-types';
import { Link, useParams } from 'react-router-dom';
import { connect } from 'react-redux';
import Moment from 'react-moment';
import Spinner from '../layout/Spinner';
import CommentForm from '../post/CommentForm';
import CommentItem from '../post/CommentItem';
import {getPost} from '../../actions/post';
import { useTranslation } from 'react-i18next';

const Post = ({getPost, post: {post, loading} }) => {
  const { t } = useTranslation();
  const { id } = useParams();

  useEffect (() => {
    getPost(id);
  }, [getPost, id]);

  return  loading  || post === null ? (
    <Spinner />
  ): (
    <Fragment>
    <Link to ='/posts' className='btn'>
      {t('post.back')}
    </Link>

    {/* Product Details Section */}
    <div className="post bg-white p-1 my-1">
      <div>
        <Link to={`/farmer/${post.user}`}>
          <img className="round-img" src={post.avatar} alt="" />
          <h4>{post.name}</h4>
        </Link>
      </div>

      <div>
        {/* Product Name as Main Heading */}
        <div className="product-details">
          <h2 className="text-primary my-1">{post.productName}</h2>

          {post.productImage && (
            <img
              src={post.productImage}
              alt={post.productName}
              style={{maxWidth: '400px', marginBottom: '1rem', borderRadius: '5px'}}
            />
          )}

          <div className="product-info my-1">
            <p><strong>👤 {t('orders.farmer')}:</strong> {post.farmerName}</p>
            {post.mobileNumber ? <p><strong>📱 {t('product.contact')}:</strong> {post.mobileNumber}</p> : <p className="order-meta">🔒 {t('product.contactLater')}</p>}
            <p><strong>⚖️ {t('product.inStock')}:</strong> {post.quantityAvailable ?? post.weight} {t(`units.${post.unit || 'kg'}`)}</p>
            <p><strong>💰 {t('post.price')}:</strong> ₹{post.price} / {t(`units.${post.unit || 'kg'}`)}</p>
            <p className="lead"><strong>💵 {t('product.stockValue')}: ₹{((post.quantityAvailable ?? post.weight) * post.price).toFixed(2)}</strong></p>
            <p><strong>📍 {t('post.location')}:</strong> {post.address}</p>
          </div>

          <p className="my-1">
            <strong>{t('post.description')}:</strong> {post.text}
          </p>
        </div>

        <p className="post-date">
          {t('comments.postedOn')} <Moment format='DD/MM/YYYY'>{post.date}</Moment>
        </p>
      </div>
    </div>

    <CommentForm postId={post._id} />
    <div className='comments'>
      {post.comments.map(comment => (
        <CommentItem key={comment._id} comment = {comment} postId ={post._id} />
      ))}
    </div>
    </Fragment>
  );
};

Post.propTypes = {
  getPost : PropTypes.func.isRequired,
  post: PropTypes.object.isRequired
};

const mapStateToProps = state => ({
  post: state.post
});

export default connect(mapStateToProps, {getPost} )(Post);