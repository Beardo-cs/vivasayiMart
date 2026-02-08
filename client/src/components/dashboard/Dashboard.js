// Dashboard component to display agricultural products
import React, { Fragment, useEffect } from 'react';
import {Link} from 'react-router-dom';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
// Adding the spinner to the dashboard
import Spinner from '../layout/Spinner';
import PostItem from '../posts/PostItem';
import { getPosts } from '../../actions/post';

const Dashboard = ({
    getPosts,
    auth: { user },
    post: { posts, loading: postsLoading }
}) => {
    useEffect (() => {
        getPosts();
    }, [getPosts]);

    // Display agricultural products on dashboard
    return (<Fragment>
        <h1 className ="large text-primary">Dashboard</h1>
        <p className ="lead">
            <i className ="fas fa-user"></i> Welcome {user && user.name}
        </p>
        {/* Agricultural Products Section */}
        <div className="my-3">
            <h2 className="text-primary">Agricultural Products</h2>
            <p className="lead">
                <i className="fas fa-seedling"></i> Browse available agricultural products
            </p>
            {postsLoading ? (
                <Spinner />
            ) : (
                <div className="posts">
                    {posts && posts.length > 0 ? (
                        posts.map(post => (
                            <PostItem key={post._id} post={post} />
                        ))
                    ) : (
                        <Fragment>
                            <p>No products available yet...</p>
                            <Link to ='/posts' className="btn btn-primary my-1"> Add Product </Link>
                        </Fragment>
                    )}
                </div>

            ) }
        </div>
        </Fragment>
        );
};

Dashboard.propTypes = {
    getPosts: PropTypes.func.isRequired,
    auth: PropTypes.object.isRequired,
    post: PropTypes.object.isRequired
};

const mapStateToProps = state => ({
    auth: state.auth,
    post: state.post
});

export default connect (
    mapStateToProps,
    { getPosts }
    ) (Dashboard);