import React from 'react';
import '../styles/Progress.css';

const Progress = ({ status, message }) => {
    const getStatusClass = () => {
        switch (status) {
            case 'sending':
                return 'progress-sending';
            case 'complete':
                return 'progress-complete';
            case 'error':
                return 'progress-error';
            default:
                return 'progress-idle';
        }
    };

    return (
        <div className={`progress-container ${getStatusClass()}`}>
            <div className="progress-status">
                {status === 'sending' && (
                    <div className="progress-spinner">
                        <div className="spinner"></div>
                    </div>
                )}
                <span className="status-text">{message || 'Ready to send'}</span>
            </div>
            <div className="progress-bar">
                <div
                    className="progress-fill"
                    style={{
                        width: status === 'sending' ? '50%' :
                               status === 'complete' ? '100%' : '0%',
                        transition: 'width 0.5s ease-in-out'
                    }}
                ></div>
            </div>
        </div>
    );
};

export default Progress;