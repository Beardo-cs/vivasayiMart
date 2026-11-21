import React from 'react'
import PropTypes from 'prop-types'
import {connect } from 'react-redux';
// alerts is a destructor here
const Alert = ({ alerts}) => 
// if the below cdn satisfied it will print corresponding alert type.here we have only one which is for pw.
    alerts !== null && 
    alerts.length > 0 && (
    <div className="toast-stack" role="status" aria-live="polite">
    {alerts.map(alert => (
    <div key={alert.id} className ={`alert alert-${alert.alertType}`}>
    {alert.msg}
    </div>
    ))}
    </div>
    );

Alert.propTypes = {
    alerts: PropTypes.array.isRequired
};

const mapStateToProps =  state => ({
    alerts: state.alert
});

export default connect(mapStateToProps) (Alert);