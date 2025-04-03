import React, { useState, useRef } from 'react';
import '../styles/FileUpload.css';

const FileUpload = ({ onRecipientsChange, onNamesChange, onSubjectsChange }) => {
    const [recipients, setRecipients] = useState('');
    const [names, setNames] = useState('');
    const [subjects, setSubjects] = useState('');
    const [error, setError] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        processFile(file);
    };

    const processFile = (file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result.trim();
            setRecipients(content);
            onRecipientsChange(content.split('\n').map(email => email.trim()).filter(Boolean));
        };
        reader.readAsText(file);
    };

    // Drag and drop handlers
    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            processFile(file);
            // Reset the file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleTextChange = (event, type) => {
        const value = event.target.value;
        switch (type) {
            case 'recipients':
                setRecipients(value);
                onRecipientsChange(value.split('\n').map(email => email.trim()).filter(Boolean));
                break;
            case 'names':
                setNames(value);
                onNamesChange(value.split('\n').map(name => name.trim()).filter(Boolean));
                break;
            case 'subjects':
                setSubjects(value);
                onSubjectsChange(value.split('\n').map(subject => subject.trim()).filter(Boolean));
                break;
        }
    };

    return (
        <div className="file-upload-container">
            <div className="grid-3">
                <div
                    className={`file-upload-box ${isDragging ? 'dragging' : ''}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <label className="upload-label">Recipients</label>
                    <div className="file-input-wrapper">
                        <input
                            type="file"
                            accept=".txt"
                            onChange={handleFileUpload}
                            className="file-input"
                            id="recipient-file"
                            ref={fileInputRef}
                        />
                        <label htmlFor="recipient-file" className="upload-btn">Upload List</label>
                    </div>
                    <textarea
                        value={recipients}
                        onChange={(e) => handleTextChange(e, 'recipients')}
                        placeholder="Enter email addresses (one per line) or drag & drop a .txt file"
                        className="recipients-input"
                    />
                    <div className="counter">
                        <span className="count-number">{recipients.split('\n').filter(Boolean).length}</span> recipients
                    </div>
                </div>

                <div className="file-upload-box">
                    <label className="upload-label">From Names</label>
                    <textarea
                        value={names}
                        onChange={(e) => handleTextChange(e, 'names')}
                        placeholder="Enter sender names (one per line)"
                        className="names-input"
                    />
                    <div className="counter">
                        <span className="count-number">{names.split('\n').filter(Boolean).length}</span> names
                    </div>
                </div>

                <div className="file-upload-box">
                    <label className="upload-label">Email Subjects</label>
                    <textarea
                        value={subjects}
                        onChange={(e) => handleTextChange(e, 'subjects')}
                        placeholder="Enter email subjects (one per line)"
                        className="subjects-input"
                    />
                    <div className="counter">
                        <span className="count-number">{subjects.split('\n').filter(Boolean).length}</span> subjects
                    </div>
                </div>
            </div>

            {error && <div className="error-message">{error}</div>}
        </div>
    );
};

export default FileUpload;