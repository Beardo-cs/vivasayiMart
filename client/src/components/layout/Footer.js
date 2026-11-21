import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Footer = () => {
  const { t } = useTranslation();
  return (
    <footer className="site-footer">
      <Link to="/privacy">{t('footer.privacy')}</Link>·<Link to="/terms">{t('footer.terms')}</Link>
      <div>© {new Date().getFullYear()} VivasayiMart</div>
    </footer>
  );
};

export default Footer;
