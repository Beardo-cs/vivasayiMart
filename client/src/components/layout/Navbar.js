import React, { Fragment} from 'react';
// instead of using a tag for linking file, importing link from react-router-dom
import { Link} from 'react-router-dom';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { logout } from '../../actions/auth';

const Navbar = ({  auth: { isAuthenticated, loading, user }, logout }) => {
  // Farmer Links
  const farmerLinks = (
    <ul>
          <li>
            <Link to="/farmer-dashboard">
            <i className="fas fa-tachometer-alt"></i>{' '}
            <span className="hide-sm">Dashboard</span>
            </Link>
          </li>
          <li>
            <Link to="/posts">
            <i className="fas fa-box"></i>{' '}
            <span className="hide-sm">My Products</span>
            </Link>
          </li>
          <li>
            <Link to="/market-price">
            <i className="fas fa-chart-line"></i>{' '}
            <span className="hide-sm">Market Price</span>
            </Link>
          </li>
          <li>
          <a onClick={logout} href='#!'>
          <i className="fas fa-sign-out-alt"></i>{' '}
          <span className="hide-sm">Logout</span>
          </a>
          </li>
        </ul>
  );

  // Consumer Links
  const consumerLinks = (
    <ul>
          <li>
            <Link to="/consumer-dashboard">
            <i className="fas fa-tachometer-alt"></i>{' '}
            <span className="hide-sm">Dashboard</span>
            </Link>
          </li>
          <li>
            <Link to="/posts">
            <i className="fas fa-shopping-basket"></i>{' '}
            <span className="hide-sm">Browse Products</span>
            </Link>
          </li>
          <li>
            <Link to="/profiles">
            <i className="fas fa-users"></i>{' '}
            <span className="hide-sm">Farmers</span>
            </Link>
          </li>
          <li>
            <Link to="/market-price">
            <i className="fas fa-chart-line"></i>{' '}
            <span className="hide-sm">Market Price</span>
            </Link>
          </li>
          <li>
          <a onClick={logout} href='#!'>
          <i className="fas fa-sign-out-alt"></i>{' '}
          <span className="hide-sm">Logout</span>
          </a>
          </li>
        </ul>
  );

  // Determine which auth links to show
  const authLinks = user && user.userType === 'farmer' ? farmerLinks :
                    user && user.userType === 'consumer' ? consumerLinks :
                    farmerLinks; // Default to farmer links

  const guestLinks = (
    <ul>
          <li><Link to="/profiles">
            <i className="fas fa-users"></i>{' '}
            <span className="hide-sm">Farmers</span>
          </Link></li>
          <li><Link to="/market-price">
            <i className="fas fa-chart-line"></i>{' '}
            <span className="hide-sm">Market Price</span>
          </Link></li>
          <li><Link to="/register">
            <i className="fas fa-user-plus"></i>{' '}
            <span className="hide-sm">Register</span>
          </Link></li>
          <li><Link to="/login">
            <i className="fas fa-sign-in-alt"></i>{' '}
            <span className="hide-sm">Login</span>
          </Link></li>
        </ul>
  );

    return (
        <nav className="navbar bg-dark">
        <h1>
          <Link to ='/'>
            <i className="fas fa-seedling"></i> VivasayiMart
          </Link>
        </h1>
        {!loading && (<Fragment> { isAuthenticated ? authLinks : guestLinks }</Fragment>)}
      </nav>
    )
}

Navbar.propTypes = {
  logout: PropTypes.func.isRequired,
  auth: PropTypes.object.isRequired
};

const mapStateToProps =  state => ({
  auth: state.auth
});

export default connect(
  mapStateToProps, 
  { logout }
  ) (Navbar);