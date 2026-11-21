// The one page header used on every screen (except the home page hero), so titles look
// and behave the same everywhere: same banner, same type size, same short entrance.
import React from 'react';
import PropTypes from 'prop-types';

const PageHeader = ({ icon, title, subtitle }) => (
  <header className="page-header">
    <h1 className="page-title">
      {icon && <span className="page-icon" aria-hidden="true">{icon}</span>}
      <span>{title}</span>
    </h1>
    {subtitle && <p className="page-subtitle">{subtitle}</p>}
  </header>
);

PageHeader.propTypes = {
  icon: PropTypes.string,
  title: PropTypes.node.isRequired,
  subtitle: PropTypes.node
};

export default PageHeader;
