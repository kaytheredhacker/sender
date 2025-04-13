import React from 'react';
import EmailForm from './components/EmailForm';
import UrlEncoder from './components/UrlEncoder';
import './App.css';
import './styles/NeonTheme.css';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
    return (
        <ErrorBoundary>
            <div className="app compact-layout">
                {/* Neon Header */}
                <header className="neon-header">
                    <h1 className="neon-title">Tech-Girl-Nerd</h1>
                    <p className="neon-subtitle">Professional Email Campaign Tool</p>
                </header>

                {/* Floating brand names with neon colors */}
                <div className="floating-brand">Tech-Girl-Nerd</div>
                <div className="floating-brand">Tech-Girl-Nerd</div>
                <div className="floating-brand">Tech-Girl-Nerd</div>
                <div className="floating-brand">Tech-Girl-Nerd</div>
                <div className="floating-brand">Tech-Girl-Nerd</div>
                <div className="floating-brand">Tech-Girl-Nerd</div>

                <main className="main-container">
                    <UrlEncoder />
                    <EmailForm />
                </main>

                <div className="supported-by">
                    Powered by <span className="neon-text neon-text-blue">Tech-Girl-Nerd</span>
                </div>
            </div>
        </ErrorBoundary>
    );
}

export default App;
