import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';

function Board({ userId }) {
    const [cards, setCards] = useState([]);
    const [newCardTitle, setNewCardTitle] = useState('');
    const [showInput, setShowInput] = useState({});
    const columns = ['Tasks', 'In Progress', 'Done'];

    // Fetch cards when the component mounts
    useEffect(() => {
        if (userId) {
            console.log("Fetching cards for userId:", userId);
            axios.get(`http://localhost:5000/cards/${userId}`)
                .then(res => {
                    if (Array.isArray(res.data)) {
                        setCards(res.data);
                    } else {
                        console.error('Unexpected response format:', res.data);
                    }
                })
                .catch(err => console.error('Error fetching cards:', err));
        } else {
            console.error("userId is undefined in Board component");
        }
    }, [userId]);

    // Handle adding a new card to a specific column
    const handleAddCard = (columnName) => {
        if (newCardTitle.trim() === '') {
            alert('Please enter a card title');
            return;
        }
        if (!userId) {
            alert('User ID is not available. Please log in again.');
            return;
        }
        const newCardData = { userId, title: newCardTitle, color: 'orange', column_name: columnName };
        console.log("Adding card with data:", newCardData);
        axios.post('http://localhost:5000/cards', newCardData)
            .then(res => {
                console.log("Add card response:", res.data);
                // Normalize the message to handle whitespace or case issues
                const message = res.data.message ? res.data.message.trim() : '';
                if (message === "Card Added") {
                    console.log("Card added successfully, updating state...");
                    const newCard = {
                        id: res.data.cardId,
                        title: newCardTitle,
                        color: res.data.color || 'orange',
                        column_name: columnName,
                    };
                    // Ensure state update is applied correctly
                    setCards(prevCards => {
                        const updatedCards = [...prevCards, newCard];
                        console.log("Updated cards:", updatedCards);
                        return updatedCards;
                    });
                    setNewCardTitle('');
                    setShowInput(prev => ({ ...prev, [columnName]: false }));
                } else {
                    console.error('Unexpected response:', res.data);
                    alert('Failed to add card');
                }
            })
            .catch(err => {
                console.error('Error adding card:', err);
                alert('Error adding card');
            });
    };

    return (
        <div className='d-flex vh-100 p-4' style={{ backgroundColor: '#1a2a44' }}>
            <div className='container-fluid'>
                <h2 className='mb-4 text-white'>Board</h2>
                <div className='d-flex gap-3' style={{ overflowX: 'auto' }}>
                    {columns.map((column) => (
                        <div key={column} className='flex-shrink-0' style={{ width: '300px' }}>
                            <div className='card mb-3' style={{ backgroundColor: '#2c3e50', border: 'none' }}>
                                <div className='card-header text-white d-flex justify-content-between align-items-center'>
                                    <h5 className='mb-0'>{column}</h5>
                                    <span>...</span>
                                </div>
                                <div className='card-body p-2'>
                                    {cards.filter(card => card.column_name === column).length === 0 ? (
                                        <p className='text-white'>No cards yet.</p>) : (
                                        cards.filter(card => (card.column_name || '').trim() === column)
                                        .map((card) => (
                                            <div
                                                key={card.id}
                                                className='card mb-2'
                                                style={{
                                                    backgroundColor: '#34495e',
                                                    border: 'none',
                                                    borderLeft: `4px solid ${card.color || 'orange'}`,
                                                    borderRadius: '4px',
                                                }}
                                            >
                                                <div className='card-body p-2'>
                                                    <p className='card-text text-white mb-0'>{card.title}</p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                    {!showInput[column] ? (
                                        <button
                                            className='btn btn-link text-white'
                                            onClick={() => setShowInput({ ...showInput, [column]: true })}
                                            style={{ textDecoration: 'none' }}
                                        >
                                            + Add a card
                                        </button>
                                    ) : (
                                        <div className='card p-2 mb-2' style={{ backgroundColor: '#34495e', border: 'none' }}>
                                            <input
                                                type='text'
                                                className='form-control mb-2'
                                                placeholder='Enter card title'
                                                value={newCardTitle}
                                                onChange={(e) => setNewCardTitle(e.target.value)}
                                                style={{ backgroundColor: '#2c3e50', color: 'white', border: 'none' }}
                                            />
                                            <div className='d-flex gap-2'>
                                                <button
                                                    className='btn btn-success btn-sm'
                                                    onClick={() => handleAddCard(column)}
                                                >
                                                    Add
                                                </button>
                                                <button
                                                    className='btn btn-secondary btn-sm'
                                                    onClick={() => setShowInput({ ...showInput, [column]: false })}
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default Board;