import React, { useState, useEffect } from 'react';

const RecipientListManager = ({ currentRecipients, onLoadRecipients }) => {
    const [savedLists, setSavedLists] = useState([]);
    const [listName, setListName] = useState('');
    const [error, setError] = useState('');

    // Load saved lists on component mount
    useEffect(() => {
        loadSavedLists();
    }, []);

    const loadSavedLists = async () => {
        try {
            const result = await window.electronAPI.getRecipientLists();
            if (result.success) {
                setSavedLists(result.lists || []);
            } else {
                setError('Failed to load saved recipient lists');
            }
        } catch (err) {
            setError(err.message || 'An error occurred while loading recipient lists');
        }
    };

    const handleSaveList = async () => {
        try {
            // Validate
            if (!listName.trim()) {
                setError('Please enter a name for the list');
                return;
            }

            if (!currentRecipients || currentRecipients.length === 0) {
                setError('No recipients to save');
                return;
            }

            // Check if we already have 2 lists and this would be a new one
            if (savedLists.length >= 2 && !savedLists.some(list => list.name === listName)) {
                setError('Maximum of 2 recipient lists allowed. Please delete one first.');
                return;
            }

            const result = await window.electronAPI.saveRecipientList({
                name: listName,
                recipients: currentRecipients
            });

            if (result.success) {
                await loadSavedLists();
                setListName('');
                setError('');
            } else {
                setError(result.message || 'Failed to save recipient list');
            }
        } catch (err) {
            setError(err.message || 'An error occurred while saving the list');
        }
    };

    const handleDeleteList = async (listName) => {
        try {
            const result = await window.electronAPI.deleteRecipientList(listName);
            if (result.success) {
                await loadSavedLists();
                setError('');
            } else {
                setError(result.message || 'Failed to delete recipient list');
            }
        } catch (err) {
            setError(err.message || 'An error occurred while deleting the list');
        }
    };

    const handleLoadList = (recipients) => {
        if (onLoadRecipients && typeof onLoadRecipients === 'function') {
            onLoadRecipients(recipients);
        }
    };

    return (
        <div className="recipient-list-manager">
            <h3>Recipient Lists</h3>
            
            {error && <div className="error-message">{error}</div>}
            
            <div className="save-list-form">
                <input
                    type="text"
                    placeholder="List Name"
                    value={listName}
                    onChange={(e) => setListName(e.target.value)}
                    className="list-name-input"
                />
                <button 
                    className="save-list-button"
                    onClick={handleSaveList}
                >
                    Save Current List
                </button>
            </div>
            
            <div className="saved-lists">
                {savedLists.length === 0 ? (
                    <p className="no-lists-message">No saved recipient lists</p>
                ) : (
                    savedLists.map((list, index) => (
                        <div key={index} className="saved-list-item">
                            <div className="list-info">
                                <span className="list-name">{list.name}</span>
                                <span className="list-count">({list.recipients.length} recipients)</span>
                            </div>
                            <div className="list-actions">
                                <button 
                                    className="load-list-button"
                                    onClick={() => handleLoadList(list.recipients)}
                                >
                                    Load
                                </button>
                                <button 
                                    className="delete-list-button"
                                    onClick={() => handleDeleteList(list.name)}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default RecipientListManager;
