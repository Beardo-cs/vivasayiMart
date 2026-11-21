// this file is to create the post box for agricultural products
import React, {useEffect, useState} from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import {connect } from 'react-redux';
import {addPost} from '../../actions/post';
import api from '../../utils/api';
import { useTranslation } from 'react-i18next';
import PageHeader from '../layout/PageHeader';

const CATEGORIES = ['Vegetables', 'Fruits', 'Grains', 'Dairy', 'Poultry', 'Other'];
const UNITS = ['kg', 'litre', 'dozen', 'piece'];

// AI may say "Vegetable" or "Fruits"; map loosely onto our fixed list
const matchCategory = value => {
    const v = String(value || '').toLowerCase().replace(/s$/, '');
    return CATEGORIES.find(c => c !== 'Other' && c.toLowerCase().replace(/s$/, '') === v);
};

const PostFrom =({ addPost, auth }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1 photo & product, 2 price & stock, 3 details
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        text: '',
        farmerName: '',
        productName: '',
        mobileNumber: '',
        productImage: '',
        weight: '',
        price: '',
        address: '',
        category: 'Other',
        unit: 'kg',
        bulkMin: '',
        bulkPrice: ''
    });

    const [analyzing, setAnalyzing] = useState(false);
    const [aiSuggestion, setAiSuggestion] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    // Pre-fill seller details from the farmer's profile so they type them only once
    useEffect(() => {
        let cancelled = false;
        api.get('/api/farmer-profile/me').then(res => {
            if (cancelled) return;
            const p = res.data;
            setFormData(prev => ({
                ...prev,
                farmerName: prev.farmerName || (auth.user && auth.user.name) || '',
                mobileNumber: prev.mobileNumber || p.mobileNumber || '',
                address: prev.address || p.location || ''
            }));
        }).catch(() => {
            if (!cancelled && auth.user) setFormData(prev => ({ ...prev, farmerName: prev.farmerName || auth.user.name }));
        });
        return () => { cancelled = true; };
    }, [auth.user]);

    const { text, farmerName, productName, mobileNumber, productImage, weight, price, address, category, unit, bulkMin, bulkPrice } = formData;

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    // Handle image file upload
    const onImageChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert(t('postForm.notImage'));
            return;
        }

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result);
        };
        reader.readAsDataURL(file);

        // Analyze image with Gemini AI
        setAnalyzing(true);
        try {
            // Convert to base64
            let base64;
            try {
                base64 = await compressImage(file);
            } catch (e) {
                base64 = await fileToBase64(file); // fall back to the original file
            }
            // keep the photo on the listing even if the AI can't name the product
            setFormData(prev => ({ ...prev, productImage: base64 }));
            const base64Data = base64.split(',')[1]; // Remove data:image/jpeg;base64, prefix

            // Call AI analysis API
            const res = await api.post('/api/ai/analyze-product', {
                imageBase64: base64Data,
                mimeType: base64.startsWith('data:image/jpeg') ? 'image/jpeg' : file.type
            });

            setAiSuggestion(res.data);

            // Auto-fill product name if detected
            if (res.data.productName && res.data.productName !== 'Unknown') {
                setFormData(prev => ({
                    ...prev,
                    productName: res.data.productName,
                    category: matchCategory(res.data.category) || prev.category,
                    productImage: base64 // Store base64 image
                }));

                // Get price suggestion if address is available
                if (address) {
                    getPriceSuggestion(res.data.productName, address);
                }
            }

        } catch (err) {
            console.error('AI Analysis Error:', err);
            alert(t('postForm.analyzeFailed'));
        } finally {
            setAnalyzing(false);
        }
    };

    // Downsize large photos (max 1024px, JPEG) so uploads stay small and fast
    const compressImage = (file, maxSize = 1024, quality = 0.8) => new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
            const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
            const canvas = document.createElement('canvas');
            canvas.width = Math.round(img.width * scale);
            canvas.height = Math.round(img.height * scale);
            canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
            URL.revokeObjectURL(url);
            resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read image')); };
        img.src = url;
    });

    // Convert file to base64
    const fileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    };

    // Get price suggestion from AI (price per ONE selected unit)
    const getPriceSuggestion = async (product, location, forUnit = unit) => {
        try {
            const res = await api.post('/api/ai/suggest-price', {
                productName: product,
                location: location,
                unit: forUnit
            });

            const suggested = res.data.suggestedPrice ?? res.data.suggestedPricePerKg;
            if (suggested) {
                setFormData(prev => ({
                    ...prev,
                    price: suggested.toString()
                }));
                setAiSuggestion(prev => ({
                    ...prev,
                    priceInfo: { ...res.data, suggestedPrice: suggested, unit: forUnit }
                }));
            }
        } catch (err) {
            console.error('Price Suggestion Error:', err);
            alert(t('postForm.priceFailed'));
        }
    };

    const onSubmit = async e => {
        e.preventDefault();

        // steps 1 and 2: the browser has already checked this step's required fields
        if (step < 3) {
            setStep(step + 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        setSubmitting(true);
        const ok = await addPost({
            text,
            farmerName,
            productName,
            mobileNumber,
            productImage,
            weight: parseFloat(weight),
            price: parseFloat(price),
            address,
            category,
            unit,
            bulkPricing: bulkMin && bulkPrice ? [{ minQuantity: parseFloat(bulkMin), price: parseFloat(bulkPrice) }] : []
        });
        setSubmitting(false);
        if (ok) navigate('/posts?mine=1');
    };

    const stepLabels = [t('postForm.step1'), t('postForm.step2'), t('postForm.step3')];

    return (
        <>
        <PageHeader icon="📸" title={t('postForm.title')} />
        <div className='post-form'>

            <ol className='wizard-steps' aria-label={t('postForm.stepsLabel')}>
                {stepLabels.map((label, i) => (
                    <li key={label} className={i + 1 === step ? 'active' : i + 1 < step ? 'done' : ''} aria-current={i + 1 === step ? 'step' : undefined}>
                        <span>{i + 1 < step ? '✓' : i + 1}</span> {label}
                    </li>
                ))}
            </ol>

            <form className='form my-1' onSubmit={onSubmit}>
                {step === 1 && (
                    <div className='form-section'>
                        <div className='form-group'>
                            <label htmlFor='imageUpload' className='btn btn-primary' style={{cursor: 'pointer'}}>
                                📸 {t('postForm.upload')}
                            </label>
                            <input id='imageUpload' type='file' accept='image/*' capture='environment' onChange={onImageChange} style={{display: 'none'}} />
                            <small className='form-text'>{t('postForm.uploadHint')}</small>
                        </div>

                        {imagePreview && (
                            <div className='form-group'>
                                <img src={imagePreview} alt={t('postForm.preview')} style={{maxWidth: '100%', maxHeight: '260px', borderRadius: '5px'}} />
                            </div>
                        )}

                        {analyzing && <div className='form-group'><p className='text-primary'>🤖 {t('postForm.analyzing')}</p></div>}

                        {aiSuggestion && aiSuggestion.productName && (
                            <div className='form-group' style={{backgroundColor: '#f4f4f4', padding: '1rem', borderRadius: '5px'}}>
                                <h5 className='text-primary'>🤖 {t('postForm.aiResults')}</h5>
                                <p><strong>{t('postForm.productLabel')}:</strong> {aiSuggestion.productName}</p>
                                <p><strong>{t('postForm.categoryLabel')}:</strong> {aiSuggestion.category}</p>
                                <p><strong>{t('postForm.quality')}:</strong> {aiSuggestion.quality}</p>
                                <p><strong>{t('postForm.confidence')}:</strong> {aiSuggestion.confidence}%</p>
                            </div>
                        )}

                        <div className='form-group'>
                            <input type='text' placeholder={t('postForm.productName')} name='productName' value={productName} onChange={onChange} required />
                            {aiSuggestion && aiSuggestion.productName && <small className='form-text text-success'>✓ {t('postForm.autoFilled')}</small>}
                        </div>

                        <div className='form-group'>
                            <select name='category' value={category} onChange={onChange}>
                                {CATEGORIES.map(c => <option key={c} value={c}>{t(`categories.${c}`)}</option>)}
                            </select>
                            <small className='form-text'>{t('postForm.categoryHint')} {aiSuggestion && t('postForm.aiCategory')}</small>
                        </div>

                        <div className='form-group'>
                            <input type='text' placeholder={t('postForm.imageUrl')} name='productImage' value={productImage.startsWith('data:') ? '' : productImage} onChange={onChange} />
                            <small className='form-text'>{t('postForm.imageUrlHint')}</small>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className='form-section'>
                        <div className='form-group'>
                            <select name='unit' value={unit} onChange={onChange}>
                                {UNITS.map(u => <option key={u} value={u}>{t(`units.${u}`)}</option>)}
                            </select>
                            <small className='form-text'>{t('postForm.unitHint')}</small>
                        </div>

                        <div className='form-group'>
                            <input type='number' min='0' step='any' placeholder={t('postForm.quantity', { unit: t(`units.${unit}`) })} name='weight' value={weight} onChange={onChange} required />
                        </div>

                        <div className='form-group'>
                            <input type='number' min='0' step='any' placeholder={t('postForm.price', { unit: t(`units.${unit}`) })} name='price' value={price} onChange={onChange} required />
                        </div>

                        <div className='form-group'>
                            <button type='button' className='btn btn-light' disabled={!productName || !address}
                                onClick={() => getPriceSuggestion(productName, address, unit)}>
                                🤖 {t('postForm.suggestPrice')}
                            </button>
                            {!address && <small className='form-text'>{t('postForm.suggestNeeds')}</small>}
                        </div>

                        {aiSuggestion && aiSuggestion.priceInfo && (
                            <div className='form-group' style={{backgroundColor: '#f4f4f4', padding: '1rem', borderRadius: '5px'}}>
                                <p><strong>{t('postForm.suggestedPrice')}:</strong> ₹{aiSuggestion.priceInfo.suggestedPrice}/{t(`units.${aiSuggestion.priceInfo.unit || 'kg'}`)}</p>
                                <p><strong>{t('postForm.priceRange')}:</strong> ₹{aiSuggestion.priceInfo.priceRange.min} - ₹{aiSuggestion.priceInfo.priceRange.max}/{t(`units.${aiSuggestion.priceInfo.unit || 'kg'}`)}</p>
                                <small>{aiSuggestion.priceInfo.reasoning}</small>
                            </div>
                        )}

                        <div className='form-group'>
                            <small className='form-text'>{t('postForm.bulkTitle')}</small>
                            <div style={{display: 'flex', gap: '0.5rem'}}>
                                <input type='number' min='0' step='any' name='bulkMin' value={bulkMin} onChange={onChange} placeholder={t('postForm.bulkMin', { unit: t(`units.${unit}`) })} />
                                <input type='number' min='0' step='any' name='bulkPrice' value={bulkPrice} onChange={onChange} placeholder={t('postForm.bulkPrice')} />
                            </div>
                            <small className='form-text'>{t('postForm.bulkHint')}</small>
                        </div>

                        {weight && price && (
                            <div className='form-group'>
                                <p className='lead'><strong>{t('postForm.totalAmount')}: ₹{(parseFloat(weight) * parseFloat(price)).toFixed(2)}</strong></p>
                            </div>
                        )}
                    </div>
                )}

                {step === 3 && (
                    <div className='form-section'>
                        <div className='form-group'>
                            <textarea name='text' cols='30' rows='4' placeholder={t('postForm.description')} value={text} onChange={onChange} required />
                        </div>

                        <h4 className='text-primary'>{t('postForm.seller')}</h4>
                        <div className='form-group'>
                            <input type='text' placeholder={t('postForm.farmerName')} name='farmerName' value={farmerName} onChange={onChange} required />
                        </div>
                        <div className='form-group'>
                            <input type='tel' placeholder={t('postForm.mobile')} name='mobileNumber' value={mobileNumber} onChange={onChange} required />
                            <small className='form-text'>{t('postForm.mobileHint')}</small>
                        </div>
                        <div className='form-group'>
                            <textarea name='address' cols='30' rows='3' placeholder={t('postForm.address')} value={address} onChange={onChange} required />
                        </div>
                    </div>
                )}

                <div className='wizard-actions'>
                    {step > 1 && (
                        <button type='button' className='btn btn-light' onClick={() => setStep(step - 1)}>← {t('postForm.back')}</button>
                    )}
                    <button type='submit' className='btn btn-primary' disabled={submitting || analyzing}>
                        {step < 3 ? `${t('postForm.next')} →` : (submitting ? '...' : t('postForm.submit'))}
                    </button>
                </div>
            </form>
        </div>
        </>
    );
}

PostFrom.propTypes = {
    addPost : PropTypes.func.isRequired,
    auth: PropTypes.object.isRequired
}

const mapStateToProps = state => ({ auth: state.auth });
export default connect(mapStateToProps, {addPost}) (PostFrom)
