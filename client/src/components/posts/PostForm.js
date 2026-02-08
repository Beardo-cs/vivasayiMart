// this file is to create the post box for agricultural products
import React, {useState} from 'react';
import PropTypes from 'prop-types';
import {connect } from 'react-redux';
import {addPost} from '../../actions/post';
import api from '../../utils/api';

const PostFrom =({ addPost}) => {
    const [formData, setFormData] = useState({
        text: '',
        farmerName: '',
        productName: '',
        mobileNumber: '',
        productImage: '',
        weight: '',
        price: '',
        address: ''
    });

    const [analyzing, setAnalyzing] = useState(false);
    const [aiSuggestion, setAiSuggestion] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    const { text, farmerName, productName, mobileNumber, productImage, weight, price, address } = formData;

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    // Handle image file upload
    const onImageChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file');
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
            const base64 = await fileToBase64(file);
            const base64Data = base64.split(',')[1]; // Remove data:image/jpeg;base64, prefix

            // Call AI analysis API
            const res = await api.post('/api/ai/analyze-product', {
                imageBase64: base64Data,
                mimeType: file.type
            });

            setAiSuggestion(res.data);

            // Auto-fill product name if detected
            if (res.data.productName && res.data.productName !== 'Unknown') {
                setFormData(prev => ({
                    ...prev,
                    productName: res.data.productName,
                    productImage: base64 // Store base64 image
                }));

                // Get price suggestion if address is available
                if (address) {
                    getPriceSuggestion(res.data.productName, address);
                }
            }

        } catch (err) {
            console.error('AI Analysis Error:', err);
            alert('Could not analyze image. Please enter product details manually.');
        } finally {
            setAnalyzing(false);
        }
    };

    // Convert file to base64
    const fileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    };

    // Get price suggestion from AI
    const getPriceSuggestion = async (product, location) => {
        try {
            const res = await api.post('/api/ai/suggest-price', {
                productName: product,
                location: location
            });

            if (res.data.suggestedPricePerKg) {
                setFormData(prev => ({
                    ...prev,
                    price: res.data.suggestedPricePerKg.toString()
                }));
                setAiSuggestion(prev => ({
                    ...prev,
                    priceInfo: res.data
                }));
            }
        } catch (err) {
            console.error('Price Suggestion Error:', err);
        }
    };

    const onSubmit = e => {
        e.preventDefault();

        // Calculate total amount
        const totalAmount = parseFloat(weight) * parseFloat(price);

        addPost({
            text,
            farmerName,
            productName,
            mobileNumber,
            productImage,
            weight: parseFloat(weight),
            price: parseFloat(price),
            totalAmount,
            address
        });

        // Reset form
        setFormData({
            text: '',
            farmerName: '',
            productName: '',
            mobileNumber: '',
            productImage: '',
            weight: '',
            price: '',
            address: ''
        });
        setImagePreview(null);
        setAiSuggestion(null);
    };

    return (
        <div className='post-form'>
            <div className='bg-primary p'>
                <h3>Post Your Agricultural Product</h3>
            </div>
            <form className='form my-1' onSubmit={onSubmit}>
                {/* Seller Details Section */}
                <div className='form-section'>
                    <h4 className='text-primary'>Seller Details</h4>

                    <div className='form-group'>
                        <input
                            type='text'
                            placeholder='Farmer Name'
                            name='farmerName'
                            value={formData.farmerName || ''}
                            onChange={onChange}
                            required
                        />
                    </div>

                    <div className='form-group'>
                        <input
                            type='text'
                            placeholder='Mobile Number'
                            name='mobileNumber'
                            value={mobileNumber}
                            onChange={onChange}
                            required
                        />
                    </div>
                </div>

                <div className='form-group'>
                        <textarea
                            name='address'
                            cols='30'
                            rows='3'
                            placeholder='Farmer Address'
                            value={address}
                            onChange={onChange}
                            required
                        />
                    </div>

                {/* Product Details Section */}
                <div className='form-section'>
                    <h4 className='text-primary'>Product Details</h4>

                    {/* AI-Powered Image Upload */}
                    <div className='form-group'>
                        <label htmlFor='imageUpload' className='btn btn-primary' style={{cursor: 'pointer'}}>
                            📸 Upload Product Image (AI Detection)
                        </label>
                        <input
                            id='imageUpload'
                            type='file'
                            accept='image/*'
                            onChange={onImageChange}
                            style={{display: 'none'}}
                        />
                        <small className='form-text'>
                            Upload a photo of your product. AI will automatically detect the product name and suggest price!
                        </small>
                    </div>

                    {/* Image Preview */}
                    {imagePreview && (
                        <div className='form-group'>
                            <img
                                src={imagePreview}
                                alt='Product Preview'
                                style={{maxWidth: '300px', borderRadius: '5px', marginBottom: '1rem'}}
                            />
                        </div>
                    )}

                    {/* AI Analysis Status */}
                    {analyzing && (
                        <div className='form-group'>
                            <p className='text-primary'>🤖 AI is analyzing your image...</p>
                        </div>
                    )}

                    {/* AI Suggestions */}
                    {aiSuggestion && (
                        <div className='form-group' style={{backgroundColor: '#f4f4f4', padding: '1rem', borderRadius: '5px'}}>
                            <h5 className='text-primary'>🤖 AI Detection Results:</h5>
                            <p><strong>Product:</strong> {aiSuggestion.productName}</p>
                            <p><strong>Category:</strong> {aiSuggestion.category}</p>
                            <p><strong>Quality:</strong> {aiSuggestion.quality}</p>
                            <p><strong>Confidence:</strong> {aiSuggestion.confidence}%</p>
                            {aiSuggestion.priceInfo && (
                                <>
                                    <p><strong>Suggested Price:</strong> ₹{aiSuggestion.priceInfo.suggestedPricePerKg}/kg</p>
                                    <p><strong>Price Range:</strong> ₹{aiSuggestion.priceInfo.priceRange.min} - ₹{aiSuggestion.priceInfo.priceRange.max}/kg</p>
                                    <small>{aiSuggestion.priceInfo.reasoning}</small>
                                </>
                            )}
                        </div>
                    )}

                    <div className='form-group'>
                        <input
                            type='text'
                            placeholder='Product Image URL (Optional - if not uploading)'
                            name='productImage'
                            value={productImage}
                            onChange={onChange}
                        />
                        <small className='form-text'>Or paste an image URL</small>
                    </div>

                    <div className='form-group'>
                        <input
                            type='text'
                            placeholder='Product Name'
                            name='productName'
                            value={productName}
                            onChange={onChange}
                            required
                        />
                        {aiSuggestion && <small className='form-text text-success'>✓ Auto-filled by AI</small>}
                    </div>

                    <div className='form-group'>
                        <input
                            type='text'
                            placeholder='Weight (in kg)'
                            name='weight'
                            value={weight}
                            onChange={onChange}
                            required
                        />
                    </div>

                    <div className='form-group'>
                        <input
                            type='text'
                            placeholder='Price per kg (₹)'
                            name='price'
                            value={price}
                            onChange={onChange}
                            required
                        />
                    </div>

                    {weight && price && (
                        <div className='form-group'>
                            <p className='lead'>
                                <strong>Total Amount: ₹{(parseFloat(weight) * parseFloat(price)).toFixed(2)}</strong>
                            </p>
                        </div>
                    )}

                    <div className='form-group'>
                        <textarea
                            name='text'
                            cols='30'
                            rows='4'
                            placeholder='Product Description'
                            value={text}
                            onChange={onChange}
                            required
                        />
                    </div>
                </div>

                <input type='submit' className='btn btn-dark my-1' value='Submit' />
            </form>
        </div>
    );
}

PostFrom.propTypes = {
    addPost : PropTypes.func.isRequired
}

export default connect(null, {addPost}) (PostFrom)