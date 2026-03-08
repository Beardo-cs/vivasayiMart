// used to dispaly all the post done by the users using map array method.
import React, {Fragment, useEffect} from 'react'
import PropTypes from 'prop-types';
import {connect } from 'react-redux';
import Loader from '../layout/Loader';
import { getPosts } from '../../actions/post';
import PostItem from './PostItem';
import PostForm from './PostForm';
import './Posts.css';

const Posts = ({ getPosts, post: {posts, loading }}) => {
  useEffect (() => {
      getPosts();
  }, [getPosts]);

  return loading ? (
    <Loader message="Loading products..." fullPage={false} />
  ) : (
    <Fragment>
      <div className="posts-header">
        <h1 className="posts-title">🌾 Agricultural Products</h1>
        <p className="posts-subtitle">
          Browse fresh products directly from farmers
        </p>
      </div>

      <PostForm />

      <div className='posts-grid'>
        {posts.length > 0 ? (
          posts.map(post => (
            <PostItem key={post._id} post={post} />
          ))
        ) : (
          <div className="no-posts">
            <div className="no-posts-icon">📦</div>
            <h3>No Products Yet</h3>
            <p>Be the first to list a product!</p>
          </div>
        )}
      </div>
    </Fragment>
  );
};

Posts.propTypes = {
    getPosts: PropTypes.func.isRequired,
    post:PropTypes.object.isRequired
}

const mapStateToProps = state => ({
    post:state.post
});

export default connect (mapStateToProps, {getPosts})(Posts);