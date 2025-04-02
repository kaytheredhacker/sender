
import React from 'react';
import PropTypes from 'prop-types';
import '../styles/Alert.css';

const Alert = ({ type, message, onClose }) => (
    <div className={`alert alert-${type}`}>
        <div className="alert-content">
            <span className="alert-message">{message}</span>
            <button className="alert-close" onClick={onClose}>×</button>
        </div>
    </div>
);

Alert.propTypes = {
    type: PropTypes.oneOf(['success', 'error', 'warning', 'info']).isRequired,
    message: PropTypes.string.isRequired,
    onClose: PropTypes.func.isRequired
};

export default Alert;
