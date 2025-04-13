import React, { useState } from 'react';
import { isElectron, callElectronAPI } from '../utils/electronUtils';
import '../styles/UrlEncoder.css';

const UrlEncoder = () => {
    const [url, setUrl] = useState('');
    const [encodedUrl, setEncodedUrl] = useState('');
    const [isEncoding, setIsEncoding] = useState(false);
    const [error, setError] = useState(null);

    const handleUrlChange = (e) => {
        setUrl(e.target.value);
        setError(null);
    };

    const handleEncode = async () => {
        if (!url.trim()) {
            setError('Please enter a URL to encode');
            return;
        }

        setIsEncoding(true);
        setError(null);

        try {
            let result;

            if (isElectron()) {
                // Call the Electron API if running in Electron
                result = await callElectronAPI('encodeUrl', url);
            } else {
                // Otherwise, call the server API directly
                const response = await fetch('/api/url-encoder/encode', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ url }),
                });

                result = await response.json();
            }

            if (result.success) {
                setEncodedUrl(result.encodedUrl);
            } else {
                setError(result.message || 'Failed to encode URL');
            }
        } catch (err) {
            setError(err.message || 'An error occurred while encoding the URL');
        } finally {
            setIsEncoding(false);
        }
    };

    const handleCopy = () => {
        if (encodedUrl) {
            navigator.clipboard.writeText(encodedUrl)
                .then(() => {
                    // Show a temporary "Copied!" message
                    const copyButton = document.getElementById('copy-button');
                    const originalText = copyButton.textContent;
                    copyButton.textContent = 'Copied!';
                    setTimeout(() => {
                        copyButton.textContent = originalText;
                    }, 2000);
                })
                .catch(err => {
                    setError('Failed to copy to clipboard');
                });
        }
    };

    return (
        <div className="url-encoder">
            <h3>URL Encoder (HTML Entities)</h3>
            
            <div className="encoder-form">
                <div className="form-group">
                    <label htmlFor="url-input">URL to Encode:</label>
                    <input
                        id="url-input"
                        type="text"
                        value={url}
                        onChange={handleUrlChange}
                        placeholder="Enter URL to encode"
                        disabled={isEncoding}
                    />
                </div>
                
                <button
                    className="encode-button"
                    onClick={handleEncode}
                    disabled={isEncoding || !url.trim()}
                >
                    {isEncoding ? 'Encoding...' : 'Encode URL'}
                </button>
                
                {error && <div className="error-message">{error}</div>}
                
                {encodedUrl && (
                    <div className="result-container">
                        <label htmlFor="encoded-url">Encoded URL:</label>
                        <textarea
                            id="encoded-url"
                            value={encodedUrl}
                            readOnly
                            rows={4}
                        />
                        <button
                            id="copy-button"
                            className="copy-button"
                            onClick={handleCopy}
                        >
                            Copy to Clipboard
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UrlEncoder;
