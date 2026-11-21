import React, {useState} from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux';
import {addComment } from '../../actions/post';
import { useTranslation } from 'react-i18next';

const CommentForm = ({ postId, addComment}) => {
    const { t } = useTranslation();
    const [text, setText]= useState('');
  return (
    <div className='post-form'>
    <div className='bg-primary p'>
    <h3>{t('comments.leave')}</h3>
    </div>
    <form className='form my-1'
        onSubmit={e => {
        e.preventDefault();
        addComment(postId, { text });
        setText('');
        }}
    >
    <textarea
        name='text'
        cols='30'
        rows='5'
        placeholder={t('comments.placeholder')}
        value={text}
        onChange={e => setText(e.target.value)}
        required
    />
    <input type='submit' className='btn btn-dark my-1' value={t('postForm.submit')} />
</form>
</div>
  )
};

CommentForm.propTypes = {
    addComment: PropTypes.func.isRequired
};

export default connect(
    null,
    { addComment }
  )(CommentForm);