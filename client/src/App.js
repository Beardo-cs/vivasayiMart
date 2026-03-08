import React, { Fragment, useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes as RouterRoutes} from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Landing from './components/layout/Landing';
import Routes from './components/routing/Routes';
import Loader from './components/layout/Loader';


//Redux, getting provider from react-redux
import { Provider, useSelector } from 'react-redux';
//import store (store file)
import store from './store';
import {loadUser} from './actions/auth';
import setAuthToken from './utils/setAuthToken';

import './App.css';
//this setauthtoken also need to run here
if (localStorage.token) {
    setAuthToken (localStorage.token);
}

// Inner App component to access Redux state
const AppContent = () => {
    const { loading } = useSelector(state => state.auth);
    const [initialLoad, setInitialLoad] = useState(true);

    useEffect(() => {
        // Load user on mount
        store.dispatch(loadUser()).then(() => {
            // Small delay to show the loader
            setTimeout(() => {
                setInitialLoad(false);
            }, 800);
        });
    }, []);

    // Show loader during initial authentication check
    if (initialLoad && loading) {
        return <Loader message="Loading VivasayiMart..." fullPage={true} />;
    }

    return (
        <Router>
            <Fragment>
                <Navbar />
                <RouterRoutes>
                    <Route exact path='/' element={<Landing />} />
                    <Route path='/*' element={<Routes />} />
                </RouterRoutes>
            </Fragment>
        </Router>
    );
};

const App = () => {
    return (
        //passing provider in the store
        <Provider store={store}>
            <AppContent />
        </Provider>
    );
};

export default App;