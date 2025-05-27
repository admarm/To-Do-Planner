import React, { useState, useEffect, useCallback } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
import { SketchPicker } from 'react-color';
import { useSelector, useDispatch } from 'react-redux';
import { fetchCards, addCard, updateCard, deleteCard, setCards } from './store';
import { useParams } from 'react-router-dom';

function Board({ userId }) {
    const { boardId } = useParams();
    const dispatch = useDispatch();
    const { cards = [], isLoading, error } = useSelector((state) => state.cards);

    const [showInput, setShowInput] = useState({});
    const [lists, setLists] = useState([]);
    const [listColors, setListColors] = useState({});
    const [listIds, setListIds] = useState({});
    const [newListName, setNewListName] = useState('');
    const [showListInput, setShowListInput] = useState(false);
    const [renamingList, setRenamingList] = useState(null);
    const [editingCard, setEditingCard] = useState(null);
    const [showColorPicker, setShowColorPicker] = useState(null);
    const [boardName, setBoardName] = useState('My Board');
    const [renamingBoard, setRenamingBoard] = useState(false);
    const [newBoardName, setNewBoardName] = useState('');
    const [isLoadingBoard, setIsLoadingBoard] = useState(true);

    useEffect(() => {
        if (userId && boardId) {
            setIsLoadingBoard(true);
            axios.get(`http://localhost:5000/boards/${boardId}`)
                .then(res => {
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
                    alert('Error fetching board and lists. Please try refreshing the page.');
                })
                .finally(() => setIsLoadingBoard(false));

            dispatch(setCards([]));
            dispatch(fetchCards({ userId, boardId }));
        }
    }, [userId, boardId, dispatch]);

    const handleAddList = useCallback(() => {
        if (newListName.trim() === '') {
            alert('Please enter a list name');
            return;
        }
        if (lists.includes(newListName.trim())) {
            alert('List name already exists');
            return;
        }
        const newList = { boardId, name: newListName.trim(), color: '#2c3e50' };
        axios.post('http://localhost:5000/lists', newList)
            .then(res => {
                if (res.data.message === 'List added') {
                    const newListNameTrimmed = newListName.trim();
                    setLists(l => [...l, newListNameTrimmed]);
                    setListColors(prev => ({ ...prev, [newListNameTrimmed]: '#2c3e50' }));
                    setListIds(prev => ({ ...prev, [newListNameTrimmed]: res.data.listId }));
                    setNewListName('');
                    setShowListInput(false);
                } else {
                    alert('Failed to add list');
                }
            })
            .catch(err => {
                alert(err.response?.data || 'Error adding list');
            });
    }, [newListName, boardId, lists]);

    const handleDeleteList = useCallback((listName) => {
        if (window.confirm(`Are you sure you want to delete the list "${listName}"? All cards in this list will be moved to "Tasks".`)) {
            const listId = listIds[listName];
            axios.delete(`http://localhost:5000/lists/${listId}`)
                .then(res => {
                    if (res.data.message === 'List deleted') {
                        const updatedCards = cards.map(card => {
                            if ((card.column_name || '').trim() === listName) {
                                return { ...card, column_name: 'Tasks' };
                            }
                            return card;
                        });
                        dispatch(setCards(updatedCards));
                        axios.put('http://localhost:5000/cards/move', { userId, fromList: listName, toList: 'Tasks' })
                            .then(res => {})
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
                    alert('Error deleting list');
                });
        }
    }, [listIds, cards, userId, dispatch]);

    const handleRenameList = useCallback((oldName, newName) => {
        if (newName.trim() === '') {
            alert('Please enter a new list name');
            return;
        }
        if (lists.includes(newName.trim())) {
            alert('List name already exists');
            return;
        }
        const listId = listIds[oldName];
        axios.put(`http://localhost:5000/lists/${listId}`, { name: newName.trim() })
            .then(res => {
                if (res.data.message === 'List renamed') {
                    const updatedLists = lists.map(list => (list === oldName ? newName.trim() : list));
                    setLists(updatedLists);
                    console.log('Sending payload to /cards/rename:', { userId, oldName: oldName, newName: newName.trim() });
                    axios.put('http://localhost:5000/cards/rename', { userId, oldName: oldName, newName: newName.trim() })
                        .then(res => {
                            if (res.data === "Cards Renamed") {
                                const updatedCards = cards.map(card => {
                                    if ((card.column_name || '').trim() === oldName) {
                                        return { ...card, column_name: newName.trim() };
                                    }
                                    return card;
                                });
                                dispatch(setCards(updatedCards));
                                setListColors(prev => {
                                    const newColors = { ...prev };
                                    newColors[newName.trim()] = newColors[oldName];
                                    delete newColors[oldName];
                                    return newColors;
                                });
                                setListIds(prev => {
                                    const newIds = { ...prev };
                                    newIds[newName.trim()] = newIds[oldName];
                                    delete newIds[oldName];
                                    return newIds;
                                });
                                setRenamingList(null);
                            } else {
                                alert('Failed to update cards. Reverting list name change.');
                                axios.put(`http://localhost:5000/lists/${listId}`, { name: oldName })
                                    .then(() => {
                                        setLists(lists);
                                    })
                                    .catch(err => {
                                        alert('Error reverting list name. Please refresh the page.');
                                    });
                            }
                        })
                        .catch(err => {
                            console.error('Error from /cards/rename:', err.response?.data);
                            alert(err.response?.data || 'Error renaming cards. Reverting list name change.');
                            axios.put(`http://localhost:5000/lists/${listId}`, { name: oldName })
                                .then(() => {
                                    setLists(lists);
                                })
                                .catch(err => {
                                    alert('Error reverting list name. Please refresh the page.');
                                });
                        });
                } else {
                    alert('Failed to rename list');
                }
            })
            .catch(err => {
                alert(err.response?.data || 'Error renaming list');
            });
    }, [lists, listIds, userId, cards, dispatch]);

    const handleEditCard = useCallback((card, newTitle) => {
        console.log(`handleEditCard called with newTitle: "${newTitle}"`);
        if (newTitle.trim() === '') {
            alert('Please enter a card title');
            return;
        }
        axios.put(`http://localhost:5000/cards/${card.id}`, { title: newTitle.trim() })
            .then(res => {
                if (res.data === "Card Updated") {
                    dispatch(updateCard({ id: card.id, updates: { title: newTitle.trim() } }));
                    setEditingCard(null);
                } else {
                    alert('Failed to update card');
                    dispatch(fetchCards({ userId, boardId }));
                }
            })
            .catch(err => {
                alert(err.response?.data || 'Error updating card');
                dispatch(fetchCards({ userId, boardId }));
            });
    }, [userId, boardId, dispatch]);

    const handleDeleteCard = useCallback((cardId) => {
        if (window.confirm('Are you sure you want to delete this card?')) {
            axios.delete(`http://localhost:5000/cards/${cardId}`)
                .then(res => {
                    if (res.data === "Card Deleted") {
                        dispatch(deleteCard(cardId));
                    } else {
                        alert('Failed to delete card');
                        dispatch(fetchCards({ userId, boardId }));
                    }
                })
                .catch(err => {
                    if (err.response && err.response.status === 404) {
                        alert('Card not found. It may have already been deleted.');
                        dispatch(deleteCard(cardId));
                    } else {
                        alert('Error deleting card');
                        dispatch(fetchCards({ userId, boardId }));
                    }
                });
        }
    }, [userId, boardId, dispatch]);

    const handleCopyList = useCallback((listName) => {
        const newListName = `${listName} (Copy)`;
        if (lists.includes(newListName)) {
            alert('A list with this name already exists');
            return;
        }
        const newList = { boardId, name: newListName, color: listColors[listName] || '#2c3e50' };
        axios.post('http://localhost:5000/lists', newList)
            .then(res => {
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
                alert(err.response?.data || 'Error copying list');
            });
    }, [lists, listColors, boardId, cards, userId, dispatch]);

    const handleMoveList = useCallback((listName) => {
        alert(`Move list "${listName}" functionality to be implemented.`);
    }, []);

    const handleMoveAllCards = useCallback((listName) => {
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
            .then(res => {})
            .catch(err => console.error("Error moving cards:", err));
    }, [lists, cards, userId, dispatch]);

    const handleSortList = useCallback((listName) => {
        const listCards = cards.filter(card => (card.column_name || '').trim() === listName);
        const otherCards = cards.filter(card => (card.column_name || '').trim() !== listName);
        const sortedCards = listCards.sort((a, b) => a.title.localeCompare(b.title));
        dispatch(setCards([...otherCards, ...sortedCards]));
    }, [cards, dispatch]);

    const handleChangeListColor = useCallback((listName, color) => {
        const listId = listIds[listName];
        axios.put(`http://localhost:5000/lists/${listId}/color`, { color: color.hex })
            .then(res => {
                if (res.data.message === 'List color updated') {
                    setListColors(prev => ({ ...prev, [listName]: color.hex }));
                    setShowColorPicker(null);
                } else {
                    alert('Failed to update list color');
                }
            })
            .catch(err => {
                alert(err.response?.data || 'Error updating list color');
            });
    }, [listIds]);

    const handleRenameBoard = useCallback(() => {
        if (newBoardName.trim() === '') {
            alert('Please enter a board name');
            return;
        }
        axios.put(`http://localhost:5000/boards/${boardId}`, { name: newBoardName.trim() })
            .then(res => {
                if (res.data.message === 'Board name updated') {
                    setBoardName(newBoardName.trim());
                    setRenamingBoard(false);
                    setNewBoardName('');
                } else {
                    alert('Failed to rename board');
                }
            })
            .catch(err => {
                alert(err.response?.data || 'Error renaming board');
            });
    }, [newBoardName, boardId]);

    const SimpleList = React.memo(({ column }) => {
        const inputRef = React.useRef(null);
        const addCardInputRef = React.useRef(null);
        const [isDropdownOpen, setIsDropdownOpen] = useState(false);
        const [newCardTitle, setNewCardTitle] = useState('');
        const [renameValue, setRenameValue] = useState(column);

        const sanitizeColumnName = (name) => {
            return name.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '');
        };

        const sanitizedColumn = sanitizeColumnName(column);

        React.useEffect(() => {
            if (renamingList === column && inputRef.current) {
                inputRef.current.focus();
                setRenameValue(column);
            }
        }, [renamingList, column]);

        React.useEffect(() => {
            if (showInput[column] && addCardInputRef.current) {
                addCardInputRef.current.focus();
            }
        }, [showInput, column]);

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

        const handleAddCard = useCallback(() => {
            if (newCardTitle.trim() === '') {
                alert('Please enter a card title');
                return;
            }
            if (!userId) {
                alert('User ID is not available. Please log in again.');
                return;
            }
            const newCardData = { userId, title: newCardTitle, color: 'orange', column_name: column };
            axios.post('http://localhost:5000/cards', newCardData)
                .then(res => {
                    const message = res.data.message ? res.data.message.trim() : '';
                    if (message === "Card Added") {
                        const newCard = {
                            id: res.data.cardId,
                            title: newCardTitle,
                            color: res.data.color || 'orange',
                            column_name: column,
                        };
                        dispatch(addCard(newCard));
                        setNewCardTitle('');
                        setShowInput(prev => ({ ...prev, [column]: false }));
                    } else {
                        alert('Failed to add card');
                        dispatch(fetchCards({ userId, boardId }));
                    }
                })
                .catch(err => {
                    alert('Error adding card');
                    dispatch(fetchCards({ userId, boardId }));
                });
        }, [newCardTitle, column]);

        const filteredCards = (cards || []).filter(card => (card.column_name || '').trim() === column);

        return (
            <div className="flex-shrink-0 list-card fade-in" style={{ width: '300px' }}>
                <div className="card mb-3">
                    <div className="card-header text-white">
                        <h5
                            className="mb-0"
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
                                <i className="bi bi-three-dots-vertical"></i>
                            </button>
                            {isDropdownOpen && (
                                <div
                                    className="custom-dropdown-menu"
                                    style={{
                                        position: 'absolute',
                                        top: '100%',
                                        right: 0,
                                        zIndex: 1000,
                                        width: '220px',
                                        minWidth: '220px',
                                        maxWidth: '220px',
                                        padding: '5px 0',
                                    }}
                                >
                                    <div
                                        className="dropdown-item"
                                        onClick={() => {
                                            setShowInput({ ...showInput, [column]: true });
                                            setIsDropdownOpen(false);
                                        }}
                                    >
                                        Add card
                                    </div>
                                    <div
                                        className="dropdown-item"
                                        onClick={() => {
                                            handleCopyList(column);
                                            setIsDropdownOpen(false);
                                        }}
                                    >
                                        Copy list
                                    </div>
                                    <div
                                        className="dropdown-item"
                                        onClick={() => {
                                            handleMoveList(column);
                                            setIsDropdownOpen(false);
                                        }}
                                    >
                                        Move list
                                    </div>
                                    <div
                                        className="dropdown-item"
                                        onClick={() => {
                                            handleMoveAllCards(column);
                                            setIsDropdownOpen(false);
                                        }}
                                    >
                                        Move all cards in this list
                                    </div>
                                    <div
                                        className="dropdown-item"
                                        onClick={() => {
                                            handleSortList(column);
                                            setIsDropdownOpen(false);
                                        }}
                                    >
                                        Sort by...
                                    </div>
                                    <div
                                        className="dropdown-item"
                                        onClick={() => {
                                            setShowColorPicker(show => (show === column ? null : column));
                                            setIsDropdownOpen(false);
                                        }}
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
                                    >
                                        Rename
                                    </div>
                                    <div
                                        className="dropdown-item text-danger"
                                        onClick={() => {
                                            handleDeleteList(column);
                                            setIsDropdownOpen(false);
                                        }}
                                    >
                                        Delete
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    <div
                        className="card-body"
                        style={{
                            maxHeight: '600px',
                            overflowY: 'auto',
                        }}
                    >
                        {renamingList === column ? (
                            <div className="d-flex gap-2 mb-2">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    className="form-control"
                                    value={renameValue}
                                    onChange={(e) => setRenameValue(e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                    onKeyDown={(e) => {
                                        e.stopPropagation();
                                        if (e.key === 'Enter') {
                                            handleRenameList(column, renameValue);
                                        } else if (e.key === 'Escape') {
                                            setRenamingList(null);
                                        }
                                    }}
                                />
                                <button className="btn btn-success btn-sm" onClick={() => handleRenameList(column, renameValue)}>
                                    Save
                                </button>
                                <button className="btn btn-secondary btn-sm" onClick={() => setRenamingList(null)}>
                                    Cancel
                                </button>
                            </div>
                        ) : (
                            <>
                                {filteredCards.length === 0 ? (
                                    <p className="text-secondary">No cards yet.</p>
                                ) : (
                                    filteredCards.map((card) => (
                                        <SimpleCard key={card.id} card={card} />
                                    ))
                                )}
                                {!showInput[column] ? (
                                    <button
                                        className="btn btn-link text-primary"
                                        onClick={() => setShowInput({ ...showInput, [column]: true })}
                                        style={{ textDecoration: 'none', fontWeight: 600 }}
                                    >
                                        + Add a card
                                    </button>
                                ) : (
                                    <div className="card p-2 mb-2">
                                        <input
                                            ref={addCardInputRef}
                                            type="text"
                                            className="form-control mb-2"
                                            placeholder="Enter card title"
                                            value={newCardTitle}
                                            onChange={(e) => setNewCardTitle(e.target.value)}
                                            onClick={(e) => e.stopPropagation()}
                                            onKeyDown={(e) => {
                                                e.stopPropagation();
                                                if (e.key === 'Enter') {
                                                    handleAddCard();
                                                } else if (e.key === 'Escape') {
                                                    setShowInput({ ...showInput, [column]: false });
                                                }
                                            }}
                                        />
                                        <div className="d-flex gap-2">
                                            <button className="btn btn-success btn-sm" onClick={handleAddCard}>
                                                Add
                                            </button>
                                            <button className="btn btn-secondary btn-sm" onClick={() => setShowInput({ ...showInput, [column]: false })}>
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
    });

    const SimpleCard = React.memo(({ card }) => {
        const inputRef = React.useRef(null);
        const [localEditCardTitle, setLocalEditCardTitle] = useState(card.title);

        React.useEffect(() => {
            if (editingCard === card.id && inputRef.current) {
                inputRef.current.focus();
                setLocalEditCardTitle(card.title);
            }
        }, [editingCard, card.id, card.title]);

        return (
            <div className="mb-2">
                <div className="simple-card card" style={{ minWidth: '200px', maxWidth: '100%', wordWrap: 'break-word' }}>
                    <div className="card-body p-2">
                        {editingCard === card.id ? (
                            <div className="d-flex gap-2 w-100">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    className="form-control"
                                    value={localEditCardTitle}
                                    onChange={(e) => setLocalEditCardTitle(e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                    onKeyDown={(e) => {
                                        e.stopPropagation();
                                        if (e.key === 'Enter' && localEditCardTitle.trim() !== '') {
                                            handleEditCard(card, localEditCardTitle);
                                        } else if (e.key === 'Escape') {
                                            setEditingCard(null);
                                        }
                                    }}
                                />
                                <button
                                    className="btn btn-success btn-sm"
                                    onClick={() => handleEditCard(card, localEditCardTitle)}
                                    disabled={localEditCardTitle.trim() === ''}
                                >
                                    Save
                                </button>
                                <button className="btn btn-secondary btn-sm" onClick={() => setEditingCard(null)}>
                                    Cancel
                                </button>
                            </div>
                        ) : (
                            <p className="card-text mb-0" style={{ wordWrap: 'break-word', maxWidth: '100%' }}>
                                {card.title}
                            </p>
                        )}
                    </div>
                </div>
                {editingCard !== card.id && (
                    <div className="d-flex gap-1 mt-1">
                        <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={(e) => {
                                e.stopPropagation();
                                setEditingCard(card.id);
                            }}
                        >
                            Edit
                        </button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteCard(card.id)}>
                            Delete
                        </button>
                    </div>
                )}
            </div>
        );
    });

    if (!userId || !boardId) {
        return <div className="text-center text-secondary mt-5">User ID or Board ID is not available. Please select a board.</div>;
    }

    if (isLoadingBoard || isLoading) {
        return <div className="text-center text-secondary mt-5">Loading...</div>;
    }

    if (error) {
        return <div className="text-center text-danger mt-5">Error loading cards: {error}</div>;
    }

    return (
        <div className="p-4">
            <div className="container-fluid">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    {renamingBoard ? (
                        <div className="d-flex gap-2">
                            <input
                                type="text"
                                className="form-control"
                                value={newBoardName}
                                onChange={(e) => setNewBoardName(e.target.value)}
                                placeholder="Enter board name"
                            />
                            <button className="btn btn-success btn-sm" onClick={handleRenameBoard}>
                                Save
                            </button>
                            <button className="btn btn-secondary btn-sm" onClick={() => setRenamingBoard(false)}>
                                Cancel
                            </button>
                        </div>
                    ) : (
                        <h2
                            className="fade-in"
                            onClick={() => { setRenamingBoard(true); setNewBoardName(boardName); }}
                            style={{ cursor: 'pointer', fontWeight: 600 }}
                        >
                            {boardName}
                        </h2>
                    )}
                    <div>
                        {!showListInput ? (
                            <button className="btn btn-primary" onClick={() => setShowListInput(true)}>
                                Add New List
                            </button>
                        ) : (
                            <div className="d-flex gap-2">
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Enter list name"
                                    value={newListName}
                                    onChange={(e) => setNewListName(e.target.value)}
                                />
                                <button className="btn btn-success btn-sm" onClick={handleAddList}>
                                    Add
                                </button>
                                <button className="btn btn-secondary btn-sm" onClick={() => setShowListInput(false)}>
                                    Cancel
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                <div className="d-flex gap-3" style={{ overflowX: 'auto', paddingBottom: '1rem' }}>
                    {lists.map((column) => (
                        <SimpleList key={column} column={column} />
                    ))}
                </div>
            </div>
        </div>
    );
}

export default Board;