import React from 'react';
import EmailForm from './components/EmailForm';
import './App.css';

function App() {
    return (
        <div className="app">

            {/* Floating brand names */}
            <div className="floating-brand">Tech-Girl-Nerd</div>
            <div className="floating-brand">Tech-Girl-Nerd</div>
            <div className="floating-brand">Tech-Girl-Nerd</div>
            <div className="floating-brand">Tech-Girl-Nerd</div>

            <main className="main-container">
                <EmailForm />
            </main>

            <div className="supported-by">
                Supported by the Source!
            </div>
        </div>
    );
}

export default App;
