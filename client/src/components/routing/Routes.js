import React from 'react';
import {Route, Routes as RouterRoutes, Navigate, useParams} from 'react-router-dom';
import Register from '../auth/Register';
import Login from '../auth/Login';
import Alert from '../layout/Alert';  //importing  alert
import FarmerDashboard from '../dashboard/FarmerDashboard';
import ConsumerDashboard from '../dashboard/ConsumerDashboard';
import CreateFarmerProfile from '../farmer-profile/CreateFarmerProfile';
import CreateConsumerProfile from '../consumer-profile/CreateConsumerProfile';
import Posts from '../posts/Posts';
import Post from '../post/Post';
import Home from './Home';
import Farmers from '../farmers/Farmers';
import FarmerPage from '../farmers/FarmerPage';
import PostForm from '../posts/PostForm';
import Legal from '../legal/Legal';
import ChooseRole from '../auth/ChooseRole';
import Account from '../auth/Account';
import Orders from '../orders/Orders';
import OrderPlaced from '../orders/OrderPlaced';
import Cart from '../cart/Cart';
import Admin from '../admin/Admin';
import ForgotPassword from '../auth/ForgotPassword';
import ResetPassword from '../auth/ResetPassword';
import VerifyEmail from '../auth/VerifyEmail';
import MarketPrice from '../market-price/MarketPrice';
import NotFound from '../layout/NotFound';
import PrivateRoute from '../routing/PrivateRoute';
import CropHealthRoute from '../vivasayi-ai/CropHealthRoute';
import VivasayiHome from '../vivasayi-ai/VivasayiHome';
import NewCheck from '../vivasayi-ai/NewCheck';
import CheckResult from '../vivasayi-ai/CheckResult';

const LegacyProfileRedirect = () => {
    const { id } = useParams();
    return <Navigate to={`/farmer/${id}`} replace />;
};

const Routes = () => {
    return (
        <section className="container">
            <Alert />
                <RouterRoutes>
                    <Route path='/register' element={<Register />} />
                    <Route path='/login' element={<Login />} />
                    <Route path='/forgot-password' element={<ForgotPassword />} />
                    <Route path='/reset-password/:token' element={<ResetPassword />} />
                    <Route path='/verify-email/:token' element={<VerifyEmail />} />
                    <Route path='/privacy' element={<Legal type='privacy' />} />
                    <Route path='/terms' element={<Legal type='terms' />} />
                    <Route path='/farmers' element={<Farmers />} />
                    <Route path='/farmer/:id' element={<FarmerPage />} />
                    {/* old links */}
                    <Route path='/profiles' element={<Navigate to='/farmers' replace />} />
                    <Route path='/profile/:id' element={<LegacyProfileRedirect />} />

                    {/* Farmer Routes */}
                    <Route path='/farmer-dashboard' element={<PrivateRoute><FarmerDashboard /></PrivateRoute>} />
                    <Route path='/create-farmer-profile' element={<PrivateRoute><CreateFarmerProfile /></PrivateRoute>} />

                    {/* Consumer Routes */}
                    <Route path='/consumer-dashboard' element={<PrivateRoute><ConsumerDashboard /></PrivateRoute>} />
                    <Route path='/create-consumer-profile' element={<PrivateRoute><CreateConsumerProfile /></PrivateRoute>} />
                    <Route path='/account' element={<PrivateRoute><Account /></PrivateRoute>} />
                    <Route path='/choose-role' element={<PrivateRoute><ChooseRole /></PrivateRoute>} />
                    <Route path='/dashboard' element={<PrivateRoute><Home /></PrivateRoute>} />

                    {/* Common Routes */}
                    <Route path='/posts' element={<PrivateRoute><Posts /></PrivateRoute>} />
                    <Route path='/posts/:id' element={<PrivateRoute><Post /></PrivateRoute>} />
                    <Route path='/add-product' element={<PrivateRoute><PostForm /></PrivateRoute>} />
                    <Route path='/cart' element={<PrivateRoute><Cart /></PrivateRoute>} />
                    <Route path='/admin' element={<PrivateRoute><Admin /></PrivateRoute>} />
                    <Route path='/order-placed' element={<PrivateRoute><OrderPlaced /></PrivateRoute>} />
                    <Route path='/orders' element={<PrivateRoute><Orders /></PrivateRoute>} />
                    <Route path='/market-price' element={<MarketPrice />} />

                    {/* Vivasayi AI preview */}
                    <Route path='/vivasayi-ai' element={<PrivateRoute><CropHealthRoute><VivasayiHome /></CropHealthRoute></PrivateRoute>} />
                    <Route path='/vivasayi-ai/new' element={<PrivateRoute><CropHealthRoute><NewCheck /></CropHealthRoute></PrivateRoute>} />
                    <Route path='/vivasayi-ai/assessments/:id' element={<PrivateRoute><CropHealthRoute><CheckResult /></CropHealthRoute></PrivateRoute>} />
                    <Route path='*' element={<NotFound />} />

                </RouterRoutes>
            </section>
    )
}

export default Routes