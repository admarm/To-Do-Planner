import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
import { SketchPicker } from 'react-color';
import { useSelector, useDispatch } from 'react-redux';
import { fetchCards, addCard, updateCard, deleteCard, setCards } from './store';

function Board({ userId }) {
    console.log("Board component rendered with userId:", userId);
    const dispatch = useDispatch();
    const { cards = [], isLoading, error } = useSelector((state) => state.cards);

    const [newCardTitle, setNewCardTitle] = useState('');
    const [showInput, setShowInput] = useState({});
    const [lists, setLists] = useState([]); // Initialize as empty; will fetch from backend
    const [listColors, setListColors] = useState({});
    const [listIds, setListIds] = useState({}); // Store list IDs from the backend
    const [newListName, setNewListName] = useState('');
    const [showListInput, setShowListInput] = useState(false);
    const [renamingList, setRenamingList] = useState(null);
    const [renameValue, setRenameValue] = useState('');
    const [editingCard, setEditingCard] = useState(null);
    const [editCardTitle, setEditCardTitle] = useState('');
    const [showColorPicker, setShowColorPicker] = useState(null);
    const [boardName, setBoardName] = useState('Board'); // Initialize as default; will fetch from backend
    const [renamingBoard, setRenamingBoard] = useState(false);
    const [newBoardName, setNewBoardName] = useState('');

    // Fetch board name, lists, and cards when userId changes
    useEffect(() => {
        if (userId) {
            // Fetch board and lists
            axios.get(`http://localhost:5000/boards/${userId}`)
                .then(res => {
                    console.log("Fetched board and lists:", res.data);
                    setBoardName(res.data.boardName);
                    const fetchedLists = res.data.lists.map(list => list.name);
                    const fetchedColors = {};
                    const fetchedIds = {};
                    res.data.lists.forEach(list => {
                        fetchedColors[list.name] = list.color;
                        fetchedIds[list.name] = list.id;
                    });
                    setLists(fetchedLists);
                    setListColors(fetchedColors);
                    setListIds(fetchedIds);
                })
                .catch(err => {
                    console.error("Error fetching board and lists:", err);
                    alert('Error fetching board and lists');
                });

            // Fetch cards
            dispatch(setCards([]));
            dispatch(fetchCards(userId));
        }
    }, [userId, dispatch]);

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
                    dispatch(addCard(newCard));
                    setNewCardTitle('');
                    setShowInput(prev => ({ ...prev, [columnName]: false }));
                } else {
                    console.error('Unexpected response:', res.data);
                    alert('Failed to add card');
                    dispatch(fetchCards(userId));
                }
            })
            .catch(err => {
                console.error('Error adding card:', err);
                alert('Error adding card');
                dispatch(fetchCards(userId));
            });
    };

    const handleAddList = () => {
        if (newListName.trim() === '') {
            alert('Please enter a list name');
            return;
        }
        if (lists.includes(newListName.trim())) {
            alert('List name already exists');
            return;
        }
        const newList = { userId, name: newListName.trim(), color: '#2c3e50' };
        axios.post('http://localhost:5000/lists', newList)
            .then(res => {
                console.log("Add list response:", res.data);
                if (res.data.message === 'List added') {
                    const newListNameTrimmed = newListName.trim();
                    setLists([...lists, newListNameTrimmed]);
                    setListColors(prev => ({ ...prev, [newListNameTrimmed]: '#2c3e50' }));
                    setListIds(prev => ({ ...prev, [newListNameTrimmed]: res.data.listId }));
                    setNewListName('');
                    setShowListInput(false);
                } else {
                    alert('Failed to add list');
                }
            })
            .catch(err => {
                console.error("Error adding list:", err);
                alert('Error adding list');
            });
    };

    const handleDeleteList = (listName) => {
        if (window.confirm(`Are you sure you want to delete the list "${listName}"? All cards in this list will be moved to "Tasks".`)) {
            const listId = listIds[listName];
            axios.delete(`http://localhost:5000/lists/${listId}`)
                .then(res => {
                    console.log("Delete list response:", res.data);
                    if (res.data.message === 'List deleted') {
                        const updatedCards = cards.map(card => {
                            if ((card.column_name || '').trim() === listName) {
                                return { ...card, column_name: 'Tasks' };
                            }
                            return card;
                        });
                        dispatch(setCards(updatedCards));
                        axios.put('http://localhost:5000/cards/move', { userId, fromList: listName, toList: 'Tasks' })
                            .then(res => {
                                console.log("Cards moved:", res.data);
                            })
                            .catch(err => console.error("Error moving cards:", err));
                        setLists(lists.filter(list => list !== listName));
                        setListColors(prev => {
                            const newColors = { ...prev };
                            delete newColors[listName];
                            return newColors;
                        });
                        setListIds(prev => {
                            const newIds = { ...prev };
                            delete newIds[listName];
                            return newIds;
                        });
                    } else {
                        alert('Failed to delete list');
                    }
                })
                .catch(err => {
                    console.error("Error deleting list:", err);
                    alert('Error deleting list');
                });
        }
    };

    const handleRenameList = (oldName) => {
        if (renameValue.trim() === '') {
            alert('Please enter a new list name');
            return;
        }
        if (lists.includes(renameValue.trim())) {
            alert('List name already exists');
            return;
        }
        const listId = listIds[oldName];
        axios.put(`http://localhost:5000/lists/${listId}`, { name: renameValue.trim() })
            .then(res => {
                console.log("Rename list response:", res.data);
                if (res.data.message === 'List renamed') {
                    const updatedLists = lists.map(list => (list === oldName ? renameValue.trim() : list));
                    setLists(updatedLists);
                    const updatedCards = cards.map(card => {
                        if ((card.column_name || '').trim() === oldName) {
                            return { ...card, column_name: renameValue.trim() };
                        }
                        return card;
                    });
                    dispatch(setCards(updatedCards));
                    axios.put('http://localhost:5000/cards/rename', { userId, oldName, newName: renameValue.trim() })
                        .then(res => {
                            console.log("Cards renamed:", res.data);
                        })
                        .catch(err => console.error("Error renaming cards:", err));
                    setListColors(prev => {
                        const newColors = { ...prev };
                        newColors[renameValue.trim()] = newColors[oldName];
                        delete newColors[oldName];
                        return newColors;
                    });
                    setListIds(prev => {
                        const newIds = { ...prev };
                        newIds[renameValue.trim()] = newIds[oldName];
                        delete newIds[oldName];
                        return newIds;
                    });
                    setRenamingList(null);
                    setRenameValue('');
                } else {
                    alert('Failed to rename list');
                }
            })
            .catch(err => {
                console.error("Error renaming list:", err);
                alert('Error renaming list');
            });
    };

    const handleEditCard = (card) => {
        if (editCardTitle.trim() === '') {
            alert('Please enter a card title');
            return;
        }
        dispatch(updateCard({ id: card.id, updates: { title: editCardTitle.trim() } }));
        axios.put(`http://localhost:5000/cards/${card.id}`, { title: editCardTitle.trim() })
            .then(res => {
                console.log("Card updated:", res.data);
            })
            .catch(err => console.error("Error updating card:", err));
        setEditingCard(null);
        setEditCardTitle('');
    };

    const handleDeleteCard = (cardId) => {
        if (window.confirm('Are you sure you want to delete this card?')) {
            axios.delete(`http://localhost:5000/cards/${cardId}`)
                .then(res => {
                    console.log("Delete card response:", res.data);
                    if (res.data === "Card Deleted") {
                        dispatch(deleteCard(cardId));
                    } else {
                        console.error("Unexpected response:", res.data);
                        alert('Failed to delete card');
                        dispatch(fetchCards(userId));
                    }
                })
                .catch(err => {
                    console.error("Error deleting card:", err);
                    if (err.response && err.response.status === 404) {
                        alert('Card not found. It may have already been deleted.');
                        dispatch(deleteCard(cardId));
                    } else {
                        alert('Error deleting card');
                        dispatch(fetchCards(userId));
                    }
                });
        }
    };

    const handleCopyList = (listName) => {
        const newListName = `${listName} (Copy)`;
        if (lists.includes(newListName)) {
            alert('A list with this name already exists');
            return;
        }
        const newList = { userId, name: newListName, color: listColors[listName] || '#2c3e50' };
        axios.post('http://localhost:5000/lists', newList)
            .then(res => {
                console.log("Copy list response:", res.data);
                if (res.data.message === 'List added') {
                    setLists([...lists, newListName]);
                    setListColors(prev => ({ ...prev, [newListName]: listColors[listName] || '#2c3e50' }));
                    setListIds(prev => ({ ...prev, [newListName]: res.data.listId }));
                    const cardsToCopy = cards.filter(card => (card.column_name || '').trim() === listName);
                    const newCards = cardsToCopy.map(card => ({
                        userId,
                        title: card.title,
                        color: card.color,
                        column_name: newListName,
                    }));
                    Promise.all(
                        newCards.map(card =>
                            axios.post('http://localhost:5000/cards', card)
                                .then(res => ({
                                    id: res.data.cardId,
                                    title: card.title,
                                    color: card.color,
                                    column_name: newListName,
                                }))
                        )
                    )
                        .then(newCards => {
                            dispatch(setCards([...cards, ...newCards]));
                        })
                        .catch(err => console.error("Error copying list:", err));
                } else {
                    alert('Failed to copy list');
                }
            })
            .catch(err => {
                console.error("Error copying list:", err);
                alert('Error copying list');
            });
    };

    const handleMoveList = (listName) => {
        alert(`Move list "${listName}" functionality to be implemented.`);
    };

    const handleMoveAllCards = (listName) => {
        const otherLists = lists.filter(list => list !== listName);
        if (otherLists.length === 0) {
            alert('There are no other lists to move cards to.');
            return;
        }
        const targetList = prompt(`Enter the name of the list to move all cards to (${otherLists.join(', ')}):`);
        if (!targetList || !otherLists.includes(targetList)) {
            alert('Invalid list name.');
            return;
        }
        const updatedCards = cards.map(card => {
            if ((card.column_name || '').trim() === listName) {
                return { ...card, column_name: targetList };
            }
            return card;
        });
        dispatch(setCards(updatedCards));
        axios.put('http://localhost:5000/cards/move', { userId, fromList: listName, toList: targetList })
            .then(res => {
                console.log("Cards moved:", res.data);
            })
            .catch(err => console.error("Error moving cards:", err));
    };

    const handleSortList = (listName) => {
        const listCards = cards.filter(card => (card.column_name || '').trim() === listName);
        const otherCards = cards.filter(card => (card.column_name || '').trim() !== listName);
        const sortedCards = listCards.sort((a, b) => a.title.localeCompare(b.title));
        dispatch(setCards([...otherCards, ...sortedCards]));
    };

    const handleChangeListColor = (listName, color) => {
        setListColors(prev => ({ ...prev, [listName]: color.hex }));
        setShowColorPicker(null);
        // Optionally, you can add an API call to save the color to the backend
        // For simplicity, we're keeping it in state, but you can extend this
    };

    const handleRenameBoard = () => {
        if (newBoardName.trim() === '') {
            alert('Please enter a board name');
            return;
        }
        axios.put(`http://localhost:5000/boards/${userId}`, { name: newBoardName.trim() })
            .then(res => {
                console.log("Rename board response:", res.data);
                if (res.data.message === 'Board name updated') {
                    setBoardName(newBoardName.trim());
                    setRenamingBoard(false);
                    setNewBoardName('');
                } else {
                    alert('Failed to rename board');
                }
            })
            .catch(err => {
                console.error("Error renaming board:", err);
                alert('Error renaming board');
            });
    };

    const SimpleList = ({ column }) => {
        const inputRef = React.useRef(null);
        const addCardInputRef = React.useRef(null);
        const [isDropdownOpen, setIsDropdownOpen] = useState(false);

        // Sanitize the column name for use in CSS selectors
        const sanitizeColumnName = (name) => {
            return name.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '');
        };

        const sanitizedColumn = sanitizeColumnName(column);

        React.useEffect(() => {
            if (renamingList === column && inputRef.current) {
                inputRef.current.focus();
            }
        }, [column]);

        React.useEffect(() => {
            if (showInput[column] && addCardInputRef.current) {
                addCardInputRef.current.focus();
            }
        }, [column]);

        // Close dropdown when clicking outside
        React.useEffect(() => {
            const handleClickOutside = (event) => {
                if (
                    isDropdownOpen &&
                    !event.target.closest(`#dropdown-${sanitizedColumn}`) &&
                    !event.target.closest('.custom-dropdown-menu')
                ) {
                    setIsDropdownOpen(false);
                }
            };
            document.addEventListener('mousedown', handleClickOutside);
            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
            };
        }, [isDropdownOpen, sanitizedColumn]);

        console.log('Cards state before rendering list:', cards);
        const filteredCards = (cards || []).filter(card => (card.column_name || '').trim() === column);
        console.log(`Filtered cards for column ${column}:`, filteredCards);

        return (
            <div className='flex-shrink-0' style={{ width: '300px' }}>
                <div className='card mb-3' style={{ backgroundColor: listColors[column] || '#2c3e50', border: 'none', overflow: 'visible' }}>
                    <div className='card-header text-white d-flex justify-content-between align-items-center' style={{ width: '100%' }}>
                        <h5
                            className='mb-0'
                            style={{
                                maxWidth: '200px',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                            }}
                            title={column}
                        >
                            {column}
                        </h5>
                        <div style={{ width: '30px', textAlign: 'center', position: 'relative' }}>
                            <button
                                id={`dropdown-${sanitizedColumn}`}
                                className="text-white p-0"
                                style={{ background: 'none', border: 'none', textDecoration: 'none', width: '30px', textAlign: 'center' }}
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            >
                                ...
                            </button>
                            {isDropdownOpen && (
                                <div
                                    className="custom-dropdown-menu"
                                    style={{
                                        position: 'absolute',
                                        top: '100%',
                                        right: 0,
                                        zIndex: 1000,
                                        width: '200px',
                                        minWidth: '200px',
                                        maxWidth: '200px',
                                        backgroundColor: 'white',
                                        border: '1px solid #ccc',
                                        borderRadius: '4px',
                                        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                                        padding: '5px 0',
                                    }}
                                >
                                    <div
                                        className="dropdown-item"
                                        onClick={() => {
                                            setShowInput({ ...showInput, [column]: true });
                                            setIsDropdownOpen(false);
                                        }}
                                        style={{ padding: '5px 10px', cursor: 'pointer', color: 'black' }}
                                    >
                                        Add card
                                    </div>
                                    <div
                                        className="dropdown-item"
                                        onClick={() => {
                                            handleCopyList(column);
                                            setIsDropdownOpen(false);
                                        }}
                                        style={{ padding: '5px 10px', cursor: 'pointer', color: 'black' }}
                                    >
                                        Copy list
                                    </div>
                                    <div
                                        className="dropdown-item"
                                        onClick={() => {
                                            handleMoveList(column);
                                            setIsDropdownOpen(false);
                                        }}
                                        style={{ padding: '5px 10px', cursor: 'pointer', color: 'black' }}
                                    >
                                        Move list
                                    </div>
                                    <div
                                        className="dropdown-item"
                                        onClick={() => {
                                            handleMoveAllCards(column);
                                            setIsDropdownOpen(false);
                                        }}
                                        style={{ padding: '5px 10px', cursor: 'pointer', color: 'black' }}
                                    >
                                        Move all cards in this list
                                    </div>
                                    <div
                                        className="dropdown-item"
                                        onClick={() => {
                                            handleSortList(column);
                                            setIsDropdownOpen(false);
                                        }}
                                        style={{ padding: '5px 10px', cursor: 'pointer', color: 'black' }}
                                    >
                                        Sort by...
                                    </div>
                                    <div
                                        className="dropdown-item"
                                        onClick={() => {
                                            setShowColorPicker(show => (show => show === column ? null : column));
                                            setIsDropdownOpen(false);
                                        }}
                                        style={{ padding: '5px 10px', cursor: 'pointer', color: 'black' }}
                                    >
                                        Change list color
                                    </div>
                                    {showColorPicker === column && (
                                        <div style={{ position: 'absolute', zIndex: 1001, right: '100%', top: 0 }}>
                                            <SketchPicker
                                                color={listColors[column] || '#2c3e50'}
                                                onChangeComplete={(color) => handleChangeListColor(column, color)}
                                            />
                                        </div>
                                    )}
                                    <hr style={{ margin: '5px 0' }} />
                                    <div
                                        className="dropdown-item"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setRenamingList(column);
                                            setRenameValue(column);
                                            setIsDropdownOpen(false);
                                        }}
                                        style={{ padding: '5px 10px', cursor: 'pointer', color: 'black' }}
                                    >
                                        Rename
                                    </div>
                                    <div
                                        className="dropdown-item text-danger"
                                        onClick={() => {
                                            handleDeleteList(column);
                                            setIsDropdownOpen(false);
                                        }}
                                        style={{ padding: '5px 10px', cursor: 'pointer', color: '#dc3545' }}
                                    >
                                        Delete
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    <div
                        className='card-body p-2'
                        style={{
                            maxHeight: '400px',
                            overflowY: 'auto',
                        }}
                    >
                        {renamingList === column ? (
                            <div className='d-flex gap-2 mb-2'>
                                <input
                                    ref={inputRef}
                                    type='text'
                                    className='form-control'
                                    value={renameValue}
                                    onChange={(e) => setRenameValue(e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                    onKeyDown={(e) => e.stopPropagation()}
                                    style={{ backgroundColor: '#34495e', color: 'white', border: 'none' }}
                                />
                                <button className='btn btn-success btn-sm' onClick={() => handleRenameList(column)}>
                                    Save
                                </button>
                                <button className='btn btn-secondary btn-sm' onClick={() => setRenamingList(null)}>
                                    Cancel
                                </button>
                            </div>
                        ) : (
                            <>
                                {filteredCards.length === 0 ? (
                                    <p className='text-white'>No cards yet.</p>
                                ) : (
                                    filteredCards.map((card) => (
                                        <SimpleCard key={card.id} card={card} />
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
                                            ref={addCardInputRef}
                                            type='text'
                                            className='form-control mb-2'
                                            placeholder='Enter card title'
                                            value={newCardTitle}
                                            onChange={(e) => setNewCardTitle(e.target.value)}
                                            onClick={(e) => e.stopPropagation()}
                                            onKeyDown={(e) => e.stopPropagation()}
                                            style={{ backgroundColor: '#2c3e50', color: 'white', border: 'none' }}
                                        />
                                        <div className='d-flex gap-2'>
                                            <button className='btn btn-success btn-sm' onClick={() => handleAddCard(column)}>
                                                Add
                                            </button>
                                            <button className='btn btn-secondary btn-sm' onClick={() => setShowInput({ ...showInput, [column]: false })}>
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
        );
    };

    const SimpleCard = ({ card }) => {
        const inputRef = React.useRef(null);

        React.useEffect(() => {
            if (editingCard === card.id && inputRef.current) {
                inputRef.current.focus();
            }
        }, [card.id]);

        const style = {
            backgroundColor: '#34495e',
            border: 'none',
            borderLeft: `4px solid ${card.color || 'orange'}`,
            borderRadius: '4px',
        };

        return (
            <div style={style} className='card mb-2'>
                <div className='card-body p-2 d-flex justify-content-between align-items-center'>
                    {editingCard === card.id ? (
                        <div className='d-flex gap-2 w-100'>
                            <input
                                ref={inputRef}
                                type='text'
                                className='form-control'
                                value={editCardTitle}
                                onChange={(e) => setEditCardTitle(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                onKeyDown={(e) => e.stopPropagation()}
                                style={{ backgroundColor: '#2c3e50', color: 'white', border: 'none' }}
                            />
                            <button className='btn btn-success btn-sm' onClick={() => handleEditCard(card)}>
                                Save
                            </button>
                            <button className='btn btn-secondary btn-sm' onClick={() => setEditingCard(null)}>
                                Cancel
                            </button>
                        </div>
                    ) : (
                        <>
                            <p className='card-text text-white mb-0'>{card.title}</p>
                            <div className='d-flex gap-1'>
                                <button
                                    className='btn btn-sm btn-outline-light'
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingCard(card.id);
                                        setEditCardTitle(card.title);
                                    }}
                                >
                                    Edit
                                </button>
                                <button className='btn btn-sm btn-outline-danger' onClick={() => handleDeleteCard(card.id)}>
                                    Delete
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        );
    };

    if (!userId) {
        console.log("userId is not available in Board component");
        return <div className="text-white">User ID is not available. Please log in again.</div>;
    }

    if (isLoading) {
        console.log("Board is loading...");
        return <div className="text-white">Loading...</div>;
    }

    if (error) {
        console.log("Error in Board:", error);
        return <div className="text-white">Error loading cards: {error}</div>;
    }

    console.log("Rendering Board with cards:", cards);
    return (
        <div className='d-flex p-4' style={{ backgroundColor: '#1a2a44', minHeight: '100vh' }}>
            <div className='container-fluid'>
                <div className='d-flex justify-content-between align-items-center mb-4'>
                    {renamingBoard ? (
                        <div className='d-flex gap-2'>
                            <input
                                type='text'
                                className='form-control'
                                value={newBoardName}
                                onChange={(e) => setNewBoardName(e.target.value)}
                                placeholder='Enter board name'
                                style={{ backgroundColor: '#2c3e50', color: 'white', border: 'none' }}
                            />
                            <button className='btn btn-success btn-sm' onClick={handleRenameBoard}>
                                Save
                            </button>
                            <button className='btn btn-secondary btn-sm' onClick={() => setRenamingBoard(false)}>
                                Cancel
                            </button>
                        </div>
                    ) : (
                        <h2 className='text-white' onClick={() => { setRenamingBoard(true); setNewBoardName(boardName); }}>
                            {boardName}
                        </h2>
                    )}
                    <div>
                        {!showListInput ? (
                            <button className='btn btn-primary' onClick={() => setShowListInput(true)}>
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
                                <button className='btn btn-success btn-sm' onClick={handleAddList}>
                                    Add
                                </button>
                                <button className='btn btn-secondary btn-sm' onClick={() => setShowListInput(false)}>
                                    Cancel
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                <div className='d-flex gap-3' style={{ overflowX: 'auto' }}>
                    {lists.map((column) => (
                        <SimpleList key={column} column={column} />
                    ))}
                </div>
            </div>
        </div>
    );
}

export default Board;