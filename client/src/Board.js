import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';

function Board({ userId }) {
    const [cards, setCards] = useState([]);
    const [newCardTitle, setNewCardTitle] = useState('');
    const [showInput, setShowInput] = useState({});
    const [lists, setLists] = useState([]);
    const [newListName, setNewListName] = useState('');
    const [showListInput, setShowListInput] = useState(false);
    const [renamingList, setRenamingList] = useState(null);
    const [renameValue, setRenameValue] = useState('');

    // Fetch lists and cards when the component mounts
    useEffect(() => {
        if (userId) {
            // Fetch lists
            axios.get(`http://localhost:5000/lists/${userId}`)
                .then(res => {
                    if (Array.isArray(res.data)) {
                        setLists(res.data);
                    } else {
                        console.error('Unexpected lists response format:', res.data);
                    }
                })
                .catch(err => console.error('Error fetching lists:', err));

            // Fetch cards
            axios.get(`http://localhost:5000/cards/${userId}`)
                .then(res => {
                    if (Array.isArray(res.data)) {
                        setCards(res.data);
                    } else {
                        console.error('Unexpected cards response format:', res.data);
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
                const message = res.data.message ? res.data.message.trim() : '';
                if (message === "Card Added") {
                    console.log("Card added successfully, updating state...");
                    const newCard = {
                        id: res.data.cardId,
                        title: newCardTitle,
                        color: res.data.color || 'orange',
                        column_name: columnName,
                    };
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

    // Handle adding a new list
    const handleAddList = () => {
        if (newListName.trim() === '') {
            alert('Please enter a list name');
            return;
        }
        if (lists.includes(newListName.trim())) {
            alert('List name already exists');
            return;
        }
        axios.post('http://localhost:5000/lists', { userId, name: newListName.trim() })
            .then(res => {
                if (res.data === "List Added") {
                    setLists([...lists, newListName.trim()]);
                    setNewListName('');
                    setShowListInput(false);
                } else {
                    alert('Failed to add list');
                }
            })
            .catch(err => {
                console.error('Error adding list:', err);
                alert('Error adding list');
            });
    };

    // Handle deleting a list
    const handleDeleteList = (listName) => {
        if (window.confirm(`Are you sure you want to delete the list "${listName}"? All cards in this list will be moved to "Tasks".`)) {
            // Move cards to "Tasks"
            const updatedCards = cards.map(card => {
                if ((card.column_name || '').trim() === listName) {
                    return { ...card, column_name: 'Tasks' };
                }
                return card;
            });
            setCards(updatedCards);
            // Update the database (move cards)
            axios.put('http://localhost:5000/cards/move', { userId, fromList: listName, toList: 'Tasks' })
                .then(res => {
                    console.log("Cards moved:", res.data);
                })
                .catch(err => console.error("Error moving cards:", err));
            // Delete the list from the database
            axios.delete('http://localhost:5000/lists', { data: { userId, name: listName } })
                .then(res => {
                    if (res.data === "List Deleted") {
                        setLists(lists.filter(list => list !== listName));
                    } else {
                        alert('Failed to delete list');
                    }
                })
                .catch(err => {
                    console.error('Error deleting list:', err);
                    alert('Error deleting list');
                });
        }
    };

    // Handle renaming a list
    const handleRenameList = (oldName) => {
        if (renameValue.trim() === '') {
            alert('Please enter a new list name');
            return;
        }
        if (lists.includes(renameValue.trim())) {
            alert('List name already exists');
            return;
        }
        // Update the list name in the database
        axios.put('http://localhost:5000/lists', { userId, oldName, newName: renameValue.trim() })
            .then(res => {
                if (res.data === "List Renamed") {
                    // Update the list name in the frontend
                    const updatedLists = lists.map(list => (list === oldName ? renameValue.trim() : list));
                    setLists(updatedLists);
                    // Update the column_name of all cards in this list
                    const updatedCards = cards.map(card => {
                        if ((card.column_name || '').trim() === oldName) {
                            return { ...card, column_name: renameValue.trim() };
                        }
                        return card;
                    });
                    setCards(updatedCards);
                    // Update the database (rename cards)
                    axios.put('http://localhost:5000/cards/rename', { userId, oldName, newName: renameValue.trim() })
                        .then(res => {
                            console.log("Cards renamed:", res.data);
                        })
                        .catch(err => console.error("Error renaming cards:", err));
                    // Reset renaming state
                    setRenamingList(null);
                    setRenameValue('');
                } else {
                    alert('Failed to rename list');
                }
            })
            .catch(err => {
                console.error('Error renaming list:', err);
                alert('Error renaming list');
            });
    };

    return (
        <div className='d-flex vh-100 p-4' style={{ backgroundColor: '#1a2a44' }}>
            <div className='container-fluid'>
                <div className='d-flex justify-content-between align-items-center mb-4'>
                    <h2 className='text-white'>Board</h2>
                    <div>
                        {!showListInput ? (
                            <button
                                className='btn btn-primary'
                                onClick={() => setShowListInput(true)}
                            >
                                Add New List
                            </button>
                        ) : (
                            <div className='d-flex gap-2'>
                                <input
                                    type='text'
                                    className='form-control'
                                    placeholder='Enter list name'
                                    value={newListName}
                                    onChange={(e) => setNewListName(e.target.value)}
                                    style={{ backgroundColor: '#2c3e50', color: 'white', border: 'none' }}
                                />
                                <button
                                    className='btn btn-success btn-sm'
                                    onClick={handleAddList}
                                >
                                    Add
                                </button>
                                <button
                                    className='btn btn-secondary btn-sm'
                                    onClick={() => setShowListInput(false)}
                                >
                                    Cancel
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                <div className='d-flex gap-3' style={{ overflowX: 'auto' }}>
                    {lists.map((column) => (
                        <div key={column} className='flex-shrink-0' style={{ width: '300px' }}>
                            <div className='card mb-3' style={{ backgroundColor: '#2c3e50', border: 'none' }}>
                                <div className='card-header text-white d-flex justify-content-between align-items-center'>
                                    <h5 className='mb-0'>{column}</h5>
                                    <div className='dropdown'>
                                        <button
                                            className='btn btn-link text-white'
                                            type='button'
                                            id={`dropdownMenuButton-${column}`}
                                            data-bs-toggle='dropdown'
                                            aria-expanded='false'
                                            style={{ textDecoration: 'none' }}
                                        >
                                            ...
                                        </button>
                                        <ul className='dropdown-menu dropdown-menu-end' aria-labelledby={`dropdownMenuButton-${column}`}>
                                            <li>
                                                <button
                                                    className='dropdown-item'
                                                    onClick={() => {
                                                        setRenamingList(column);
                                                        setRenameValue(column);
                                                    }}
                                                >
                                                    Rename
                                                </button>
                                            </li>
                                            <li>
                                                <button
                                                    className='dropdown-item text-danger'
                                                    onClick={() => handleDeleteList(column)}
                                                >
                                                    Delete
                                                </button>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                                <div className='card-body p-2'>
                                    {renamingList === column ? (
                                        <div className='d-flex gap-2 mb-2'>
                                            <input
                                                type='text'
                                                className='form-control'
                                                value={renameValue}
                                                onChange={(e) => setRenameValue(e.target.value)}
                                                style={{ backgroundColor: '#34495e', color: 'white', border: 'none' }}
                                            />
                                            <button
                                                className='btn btn-success btn-sm'
                                                onClick={() => handleRenameList(column)}
                                            >
                                                Save
                                            </button>
                                            <button
                                                className='btn btn-secondary btn-sm'
                                                onClick={() => setRenamingList(null)}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            {cards.filter(card => (card.column_name || '').trim() === column).length === 0 ? (
                                                <p className='text-white'>No cards yet.</p>
                                            ) : (
                                                cards
                                                    .filter(card => (card.column_name || '').trim() === column)
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
                                        </>
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