import React, { useState } from 'react';
import '../styles/FileUpload.css';

const FileUpload = ({ onRecipientsChange, onNamesChange, onSubjectsChange }) => {
    const [recipients, setRecipients] = useState('');
    const [names, setNames] = useState('');
    const [subjects, setSubjects] = useState('');
    const [error, setError] = useState(null);

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result.trim();
            setRecipients(content);
            onRecipientsChange(content.split('\n').map(email => email.trim()).filter(Boolean));
        };
        reader.readAsText(file);
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
        <div className="file-upload">
            <h3>Email Lists</h3>
            
            <div className="input-group">
                <label>Recipients (one email per line)</label>
                <div className="file-input-wrapper">
                    <input
                        type="file"
                        accept=".txt"
                        onChange={handleFileUpload}
                        className="file-input"
                    />
                    <button className="upload-btn">Upload Email List</button>
                </div>
                <textarea
                    value={recipients}
                    onChange={(e) => handleTextChange(e, 'recipients')}
                    placeholder="Enter email addresses (one per line)"
                    className="recipients-input"
                />
                <div className="counter">
                    {recipients.split('\n').filter(Boolean).length} recipients
                </div>
            </div>

            <div className="input-group">
                <label>Names (one name per line)</label>
                <textarea
                    value={names}
                    onChange={(e) => handleTextChange(e, 'names')}
                    placeholder="Enter names (one per line)"
                />
                <div className="counter">
                    {names.split('\n').filter(Boolean).length} names
                </div>
            </div>

            <div className="input-group">
                <label>Subjects (one subject per line)</label>
                <textarea
                    value={subjects}
                    onChange={(e) => handleTextChange(e, 'subjects')}
                    placeholder="Enter subjects (one per line)"
                />
                <div className="counter">
                    {subjects.split('\n').filter(Boolean).length} subjects
                </div>
            </div>

            {error && <div className="error-message">{error}</div>}
        </div>
    );
};

export default FileUpload; 