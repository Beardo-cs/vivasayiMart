import React, {Fragment} from 'react';

const NotFound = () => {
    return (
        <Fragment>
        <h3 className='large text-primary'>
        <i className='fas fa-exclamation-triangle'/> Page Not Found
        </h3>
        <p className='large'> Sorry, this page does not exist. </p>
        </Fragment>
    )
}

export default NotFound