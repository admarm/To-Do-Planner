import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
import { Dropdown } from 'react-bootstrap'; // Import React Bootstrap Dropdown

function Board({ userId }) {
    const [cards, setCards] = useState([]);
    const [newCardTitle, setNewCardTitle] = useState('');
    const [showInput, setShowInput] = useState({});
    const [lists, setLists] = useState(['Tasks', 'In Progress', 'Done']);
    const [newListName, setNewListName] = useState('');
    const [showListInput, setShowListInput] = useState(false);
    const [renamingList, setRenamingList] = useState(null);
    const [renameValue, setRenameValue] = useState('');

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
        setLists([...lists, newListName.trim()]);
        setNewListName('');
        setShowListInput(false);
    };

    // Handle deleting a list
    const handleDeleteList = (listName) => {
        if (window.confirm(`Are you sure you want to delete the list "${listName}"? All cards in this list will be moved to "Tasks".`)) {
            const updatedCards = cards.map(card => {
                if ((card.column_name || '').trim() === listName) {
                    return { ...card, column_name: 'Tasks' };
                }
                return card;
            });
            setCards(updatedCards);
            axios.put('http://localhost:5000/cards/move', { userId, fromList: listName, toList: 'Tasks' })
                .then(res => {
                    console.log("Cards moved:", res.data);
                })
                .catch(err => console.error("Error moving cards:", err));
            setLists(lists.filter(list => list !== listName));
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
        const updatedLists = lists.map(list => (list === oldName ? renameValue.trim() : list));
        setLists(updatedLists);
        const updatedCards = cards.map(card => {
            if ((card.column_name || '').trim() === oldName) {
                return { ...card, column_name: renameValue.trim() };
            }
            return card;
        });
        setCards(updatedCards);
        axios.put('http://localhost:5000/cards/rename', { userId, oldName, newName: renameValue.trim() })
            .then(res => {
                console.log("Cards renamed:", res.data);
            })
            .catch(err => console.error("Error renaming cards:", err));
        setRenamingList(null);
        setRenameValue('');
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
                                    <Dropdown>
                                        <Dropdown.Toggle
                                            variant="link"
                                            id={`dropdown-${column}`}
                                            className="text-white p-0"
                                            style={{ textDecoration: 'none' }}
                                        >
                                            ...
                                        </Dropdown.Toggle>
                                        <Dropdown.Menu align="end">
                                            <Dropdown.Item
                                                onClick={() => {
                                                    setRenamingList(column);
                                                    setRenameValue(column);
                                                }}
                                            >
                                                Rename
                                            </Dropdown.Item>
                                            <Dropdown.Item
                                                onClick={() => handleDeleteList(column)}
                                                className="text-danger"
                                            >
                                                Delete
                                            </Dropdown.Item>
                                        </Dropdown.Menu>
                                    </Dropdown>
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