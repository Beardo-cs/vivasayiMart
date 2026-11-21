import React, {Fragment} from 'react';
import { useTranslation } from 'react-i18next';

const NotFound = () => {
    const { t } = useTranslation();
    return (
        <Fragment>
        <h3 className='large text-primary'>
        <i className='fas fa-exclamation-triangle'/> {t('notFound.title')}
        </h3>
        <p className='large'> {t('notFound.text')}</p>
        </Fragment>
    )
}

export default NotFound