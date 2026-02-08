import React , {Fragment, useEffect} from 'react'
import PropTypes from 'prop-types';
import { Link, useParams } from 'react-router-dom';
import { connect } from 'react-redux';
import Moment from 'react-moment';
import Spinner from '../layout/Spinner';
import CommentForm from '../post/CommentForm';
import CommentItem from '../post/CommentItem';
import {getPost} from '../../actions/post';

const Post = ({getPost, post: {post, loading} }) => {
  const { id } = useParams();

  useEffect (() => {
    getPost(id);
  }, [getPost, id]);

  return  loading  || post === null ? (
    <Spinner />
  ): (
    <Fragment>
    <Link to ='/posts' className='btn'>
      Back to  Posts
    </Link>

    {/* Product Details Section */}
    <div className="post bg-white p-1 my-1">
      <div>
        <Link to={`/profile/${post.user}`}>
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
            <p><strong>👤 Farmer:</strong> {post.farmerName}</p>
            <p><strong>📱 Contact:</strong> {post.mobileNumber}</p>
            <p><strong>⚖️ Weight:</strong> {post.weight} kg</p>
            <p><strong>💰 Price:</strong> ₹{post.price} per kg</p>
            <p className="lead"><strong>💵 Total Amount: ₹{post.totalAmount.toFixed(2)}</strong></p>
            <p><strong>📍 Location:</strong> {post.address}</p>
          </div>

          <p className="my-1">
            <strong>Description:</strong> {post.text}
          </p>
        </div>

        <p className="post-date">
          Posted on <Moment format='DD/MM/YYYY'>{post.date}</Moment>
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