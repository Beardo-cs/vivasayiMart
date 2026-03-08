// this file is to see the details with user name and post date all those things
import React from 'react'
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import Moment from 'react-moment';
import { connect } from 'react-redux';
import { deletePost } from '../../actions/post';
import './PostItem.css';

const PostItem = ({
  deletePost,
  auth,
  post: {_id, text, name, avatar, user, comments, date, farmerName, productName, mobileNumber, productImage, weight, price, totalAmount, address},
  showActions
}) => (
<div className="product-card">
  <div className="product-card-header">
    <Link to={`/profile/${user}`} className="farmer-info">
      <img className="farmer-avatar" src={avatar} alt={name} />
      <div className="farmer-details">
        <h4 className="farmer-name">{farmerName || name}</h4>
        <p className="post-date-small">
          <i className="far fa-calendar"></i> <Moment format='DD MMM YYYY'>{date}</Moment>
        </p>
      </div>
    </Link>
  </div>

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
    <h3 className="product-name">{productName}</h3>

    <div className="product-info-grid">
      <div className="info-item">
        <span className="info-icon">📱</span>
        <div>
          <small>Contact</small>
          <p>{mobileNumber}</p>
        </div>
      </div>
      <div className="info-item">
        <span className="info-icon">⚖️</span>
        <div>
          <small>Weight</small>
          <p>{weight} kg</p>
        </div>
      </div>
      <div className="info-item">
        <span className="info-icon">💰</span>
        <div>
          <small>Price/kg</small>
          <p>₹{price}</p>
        </div>
      </div>
      <div className="info-item highlight">
        <span className="info-icon">💵</span>
        <div>
          <small>Total</small>
          <p className="total-amount">₹{totalAmount.toFixed(2)}</p>
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
        <i className="far fa-comment"></i> Comments
        {comments.length > 0 && (
          <span className='comment-badge'>{comments.length}</span>
        )}
      </Link>

      {!auth.loading && user === auth.user._id && (
        <button
          onClick={() => deletePost(_id)}
          type="button"
          className="btn-delete">
          <i className="fas fa-trash"></i> Delete
        </button>
      )}
    </div>
  )}
</div>
);

PostItem.defaultProps ={
  showActions:true
};

PostItem.propTypes = {
    post: PropTypes.object.isRequired,
    auth: PropTypes.object.isRequired,
    deletePost: PropTypes.func.isRequired
};

const mapStateToProps= state => ({
    auth: state.auth
});

export default connect(
  mapStateToProps,
  { deletePost }
  ) (PostItem);