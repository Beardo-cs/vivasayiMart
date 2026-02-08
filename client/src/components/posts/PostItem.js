// this file is to see the details with user name and post date all those things
import React, {Fragment} from 'react'
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import Moment from 'react-moment';
import { connect } from 'react-redux';
import { deletePost } from '../../actions/post';

const PostItem = ({
  deletePost,
  auth,
  post: {_id, text, name, avatar, user, comments, date, farmerName, productName, mobileNumber, productImage, weight, price, totalAmount, address},
  showActions
}) => (
<div className="post bg-white p-1 my-1">
  <div>
    <Link to={`/profile/${user}`}>
      <img
        className="round-img" src={avatar} alt=""
      />
      <h4> {name} </h4>
    </Link>
  </div>
  <div>
    <div className="product-details">
      <h3 className="text-primary">{productName}</h3>

      {productImage && (
        <img
          src={productImage}
          alt={productName}
          style={{maxWidth: '300px', marginBottom: '1rem', borderRadius: '5px'}}
        />
      )}

      <div className="product-info my-1">
        <p><strong>👤 Farmer:</strong> {farmerName}</p>
        <p><strong>📱 Contact:</strong> {mobileNumber}</p>
        <p><strong>⚖️ Weight:</strong> {weight} kg</p>
        <p><strong>💰 Price:</strong> ₹{price} per kg</p>
        <p className="lead"><strong>💵 Total Amount: ₹{totalAmount.toFixed(2)}</strong></p>
        <p><strong>📍 Location:</strong> {address}</p>
      </div>

      <p className="my-1">
        <strong>Description:</strong> {text}
      </p>
    </div>

    <p className="post-date">
      Posted on{' '}
      <Moment format='DD/MM/YYYY'>{date}</Moment>
    </p>
    {showActions && <Fragment>
        <Link to={`/posts/${_id}`} class="btn btn-primary">
          Comments{' '}
          {comments.length > 0 && (
                <span class='comment-count'>{comments.length}</span>
              )}
        </Link>

        {!auth.loading && user === auth.user._id && (
            <button
              onClick ={e => deletePost(_id)}
              type="button"
              class="btn btn-danger">
          <i class="fas fa-times"/> Delete
      </button>
        )}
        </Fragment>
      }
  </div>
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