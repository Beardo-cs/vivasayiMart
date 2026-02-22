import React from 'react';
import {Route, Routes as RouterRoutes} from 'react-router-dom';
import Register from '../auth/Register';
import Login from '../auth/Login';
import Alert from '../layout/Alert';  //importing  alert
import Dashboard from '../dashboard/Dashboard';
import FarmerDashboard from '../dashboard/FarmerDashboard';
import ConsumerDashboard from '../dashboard/ConsumerDashboard';
import CreateProfile from '../profile-forms/CreateProfile';
import EditProfile from '../profile-forms/EditProfile';
import CreateFarmerProfile from '../farmer-profile/CreateFarmerProfile';
import CreateConsumerProfile from '../consumer-profile/CreateConsumerProfile';
import AddExperience from '../profile-forms/AddExperience';
import AddEducation from '../profile-forms/AddEducation';
import Profiles from '../profiles/Profiles';
import Profile from '../profile/Profile';
import Posts from '../posts/Posts';
import Post from '../post/Post';
import MarketPrice from '../market-price/MarketPrice';
import NotFound from '../layout/NotFound';
import PrivateRoute from '../routing/PrivateRoute';

const Routes = () => {
    return (
        <section className="container">
            <Alert />
                <RouterRoutes>
                    <Route path='/register' element={<Register />} />
                    <Route path='/login' element={<Login />} />
                    <Route path='/profiles' element={<Profiles />} />
                    <Route path='/profile/:id' element={<Profile />} />

                    {/* Farmer Routes */}
                    <Route path='/farmer-dashboard' element={<PrivateRoute><FarmerDashboard /></PrivateRoute>} />
                    <Route path='/create-farmer-profile' element={<PrivateRoute><CreateFarmerProfile /></PrivateRoute>} />

                    {/* Consumer Routes */}
                    <Route path='/consumer-dashboard' element={<PrivateRoute><ConsumerDashboard /></PrivateRoute>} />
                    <Route path='/create-consumer-profile' element={<PrivateRoute><CreateConsumerProfile /></PrivateRoute>} />

                    {/* Legacy Routes */}
                    <Route path='/dashboard' element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                    <Route path='/create-profile' element={<PrivateRoute><CreateProfile /></PrivateRoute>} />
                    <Route path='/edit-profile' element={<PrivateRoute><EditProfile /></PrivateRoute>} />
                    <Route path='/add-experience' element={<PrivateRoute><AddExperience /></PrivateRoute>} />
                    <Route path='/add-education' element={<PrivateRoute><AddEducation /></PrivateRoute>} />

                    {/* Common Routes */}
                    <Route path='/posts' element={<PrivateRoute><Posts /></PrivateRoute>} />
                    <Route path='/posts/:id' element={<PrivateRoute><Post /></PrivateRoute>} />
                    <Route path='/market-price' element={<MarketPrice />} />
                    <Route path='*' element={<NotFound />} />

                </RouterRoutes>
            </section>
    )
}

export default Routes