import React, { Fragment, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes as RouterRoutes} from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Landing from './components/layout/Landing';
import Routes from './components/routing/Routes';


//Redux, getting provider from react-redux
import { Provider } from 'react-redux';
//import store (store file)
import store from './store';
import {loadUser} from './actions/auth';
import setAuthToken from './utils/setAuthToken';

import './App.css';
//this setauthtoken also need to run here
if (localStorage.token) {
    setAuthToken (localStorage.token);
}

const App = () =>  {
    useEffect(() => {
        store.dispatch(loadUser());
    }, []);

    return (
    //passing provider inthe store
    <Provider store= {store} >
    <Router>
        <Fragment>
            <Navbar />
            <RouterRoutes>
                <Route exact path='/' element={<Landing />} />
                <Route path='/*' element={<Routes />} />
            </RouterRoutes>
        </Fragment>
    </Router>
    </Provider>
    )};

export default App;