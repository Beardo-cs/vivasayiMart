// used to dispaly all the post done by the users using map array method.
import React, {Fragment, useEffect, useState, useCallback} from 'react'
import PropTypes from 'prop-types';
import {connect } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Loader from '../layout/Loader';
import { getPosts } from '../../actions/post';
import PostItem from './PostItem';
import PostForm from './PostForm';
import PostFilters from './PostFilters';
import './Posts.css';

const Posts = ({ getPosts, auth, post: {posts, loading, pagination }}) => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    q: '',
    category: searchParams.get('category') || '',
    location: '',
    farmer: searchParams.get('mine') === '1' && auth.user ? auth.user._id : (searchParams.get('farmer') || ''),
    minPrice: '',
    maxPrice: '',
    inStock: false,
    saved: false,
    sort: 'newest'
  });
  const [page, setPage] = useState(1);

  // Switching between /posts and /posts?mine=1 re-uses this component, so sync the scope
  const mine = searchParams.get('mine') === '1';
  const myId = auth.user ? auth.user._id : '';
  const farmerParam = searchParams.get('farmer') || '';
  useEffect(() => {
    setFilters(prev => {
      const farmer = mine ? myId : farmerParam;
      return prev.farmer === farmer ? prev : { ...prev, farmer };
    });
    setPage(1);
  }, [mine, myId, farmerParam]);

  useEffect (() => {
      getPosts({ ...filters, page });
  }, [getPosts, filters, page]);

  const onFiltersChange = useCallback(next => {
    // keep the "my products" scope when other filters change
    setFilters(prev => ({ ...next, farmer: prev.farmer }));
    setPage(1);
  }, []);

  const isFarmer = auth.user && auth.user.userType === 'farmer';

  return loading ? (
    <Loader message="Loading products..." fullPage={false} />
  ) : (
    <Fragment>
      <div className="posts-header">
        <h1 className="posts-title">{mine ? t('posts.myTitle') : t('posts.title')}</h1>
        <p className="posts-subtitle">
          {mine ? t('posts.mySubtitle') : t('posts.subtitle')}
        </p>
      </div>

      {isFarmer && <PostForm />}

      <PostFilters filters={filters} onChange={onFiltersChange} />
      <p className="posts-count">{t('posts.found', { count: pagination.total })}</p>

      <div className='posts-grid'>
        {posts.length > 0 ? (
          posts.map(post => (
            <PostItem key={post._id} post={post} />
          ))
        ) : (
          <div className="no-posts">
            <div className="no-posts-icon">📦</div>
            <h3>{t('posts.noneTitle')}</h3>
            <p>{t('posts.noneHint')}</p>
          </div>
        )}
      </div>

      {pagination.pages > 1 && (
        <div className="posts-pagination">
          <button className="btn btn-light" disabled={page <= 1} onClick={() => setPage(page - 1)}>{t('posts.prev')}</button>
          <span>{t('posts.page', { page: pagination.page, pages: pagination.pages })}</span>
          <button className="btn btn-light" disabled={page >= pagination.pages} onClick={() => setPage(page + 1)}>{t('posts.next')}</button>
        </div>
      )}
    </Fragment>
  );
};

Posts.propTypes = {
    getPosts: PropTypes.func.isRequired,
    auth: PropTypes.object.isRequired,
    post:PropTypes.object.isRequired
}

const mapStateToProps = state => ({
    auth: state.auth,
    post:state.post
});

export default connect (mapStateToProps, {getPosts})(Posts);
