import React from 'react';
import EmailForm from './components/EmailForm';
import './App.css';
import './styles/NeonTheme.css';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
    return (
        <ErrorBoundary>
            <div className="app compact-layout">
                {/* Neon Header */}
                <header className="neon-header">
                    <h1 className="neon-title">Email Sender Pro</h1>
                    <p className="neon-subtitle">Professional Email Campaign Tool</p>
                </header>

                {/* Floating brand names with neon colors */}
                <div className="floating-brand">Tech-Girl-Nerd</div>
                <div className="floating-brand">Tech-Girl-Nerd</div>
                <div className="floating-brand">Tech-Girl-Nerd</div>
                <div className="floating-brand">Tech-Girl-Nerd</div>

                <main className="main-container">
                    <EmailForm />
                </main>

                <div className="supported-by">
                    Powered by Tech-Girl-Nerd
                </div>
            </div>
        </ErrorBoundary>
    );
}

export default App;
