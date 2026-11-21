import React, {Fragment} from 'react';
import { useTranslation } from 'react-i18next';
import PageHeader from './PageHeader';

const NotFound = () => {
    const { t } = useTranslation();
    return (
        <Fragment>
        <PageHeader icon="🧭" title={t('notFound.title')} subtitle={t('notFound.text')} />
        </Fragment>
    )
}

export default NotFound