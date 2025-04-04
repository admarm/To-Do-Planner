import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
import { Dropdown } from 'react-bootstrap';
import { DndContext, closestCenter, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, horizontalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SketchPicker } from 'react-color';
import { useSelector, useDispatch } from 'react-redux';
import { fetchCards, addCard, updateCard, deleteCard, setCards } from './store';

function Board({ userId }) {
    console.log("Board component rendered with userId:", userId);
    const dispatch = useDispatch();
    const { cards, isLoading, error } = useSelector((state) => state.cards);

    const [newCardTitle, setNewCardTitle] = useState('');
    const [showInput, setShowInput] = useState({});
    const [lists, setLists] = useState(['Tasks', 'In Progress', 'Done']);
    const [listColors, setListColors] = useState({});
    const [newListName, setNewListName] = useState('');
    const [showListInput, setShowListInput] = useState(false);
    const [renamingList, setRenamingList] = useState(null);
    const [renameValue, setRenameValue] = useState('');
    const [editingCard, setEditingCard] = useState(null);
    const [editCardTitle, setEditCardTitle] = useState('');
    const [showColorPicker, setShowColorPicker] = useState(null);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(sortableKeyboardCoordinates)
    );

    // Fetch cards when userId changes
    useEffect(() => {
        if (userId) {
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
                }
            })
            .catch(err => {
                console.error('Error adding card:', err);
                alert('Error adding card');
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
        setLists([...lists, newListName.trim()]);
        setListColors(prev => ({ ...prev, [newListName.trim()]: '#2c3e50' }));
        setNewListName('');
        setShowListInput(false);
    };

    const handleDeleteList = (listName) => {
        if (window.confirm(`Are you sure you want to delete the list "${listName}"? All cards in this list will be moved to "Tasks".`)) {
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
        setRenamingList(null);
        setRenameValue('');
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
            dispatch(deleteCard(cardId));
            axios.delete(`http://localhost:5000/cards/${cardId}`)
                .then(res => {
                    console.log("Card deleted:", res.data);
                })
                .catch(err => console.error("Error deleting card:", err));
        }
    };

    const handleCopyList = (listName) => {
        const newListName = `${listName} (Copy)`;
        if (lists.includes(newListName)) {
            alert('A list with this name already exists');
            return;
        }
        setLists([...lists, newListName]);
        setListColors(prev => ({ ...prev, [newListName]: listColors[listName] || '#2c3e50' }));
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
    };

    const handleMoveList = (listName) => {
        alert(`Move list "${listName}" functionality to be implemented. You can already drag lists to reorder them.`);
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
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;

        if (!over) return;

        // Handle list dragging
        if (lists.includes(active.id) && lists.includes(over.id)) {
            const oldIndex = lists.indexOf(active.id);
            const newIndex = lists.indexOf(over.id);
            if (oldIndex !== newIndex) {
                setLists(arrayMove(lists, oldIndex, newIndex));
            }
            return;
        }

        // Handle card dragging
        const card = cards.find(c => c.id === parseInt(active.id));
        if (!card) return;

        const sourceList = card.column_name;
        const destinationList = over.id;

        if (sourceList !== destinationList) {
            const updatedCards = cards.map(c => {
                if (c.id === card.id) {
                    return { ...c, column_name: destinationList };
                }
                return c;
            });
            dispatch(setCards(updatedCards));
            axios.put(`http://localhost:5000/cards/${card.id}/move`, { column_name: destinationList })
                .then(res => {
                    console.log("Card moved:", res.data);
                })
                .catch(err => console.error("Error moving card:", err));
        }
    };

    const SortableList = ({ column }) => {
        const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: column });

        const style = {
            transform: CSS.Transform.toString(transform),
            transition,
            width: '300px',
        };

        console.log('Cards state before rendering SortableContext:', cards);
        const filteredCards = cards.filter(card => (card.column_name || '').trim() === column);
        console.log(`Filtered cards for column ${column}:`, filteredCards);

        return (
            <div
                ref={setNodeRef}
                style={style}
                {...attributes}
                {...listeners}
                className='flex-shrink-0'
            >
                <div className='card mb-3' style={{ backgroundColor: listColors[column] || '#2c3e50', border: 'none' }}>
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
                                <Dropdown.Item onClick={() => setShowInput({ ...showInput, [column]: true })}>
                                    Add card
                                </Dropdown.Item>
                                <Dropdown.Item onClick={() => handleCopyList(column)}>
                                    Copy list
                                </Dropdown.Item>
                                <Dropdown.Item onClick={() => handleMoveList(column)}>
                                    Move list
                                </Dropdown.Item>
                                <Dropdown.Item onClick={() => handleMoveAllCards(column)}>
                                    Move all cards in this list
                                </Dropdown.Item>
                                <Dropdown.Item onClick={() => handleSortList(column)}>
                                    Sort by...
                                </Dropdown.Item>
                                <Dropdown.Item onClick={() => setShowColorPicker(show => (show => show === column ? null : column))}>
                                    Change list color
                                </Dropdown.Item>
                                {showColorPicker === column && (
                                    <div style={{ position: 'absolute', zIndex: 2 }}>
                                        <SketchPicker
                                            color={listColors[column] || '#2c3e50'}
                                            onChangeComplete={(color) => handleChangeListColor(column, color)}
                                        />
                                    </div>
                                )}
                                <Dropdown.Divider />
                                <Dropdown.Item onClick={() => { setRenamingList(column); setRenameValue(column); }}>
                                    Rename
                                </Dropdown.Item>
                                <Dropdown.Item onClick={() => handleDeleteList(column)} className="text-danger">
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
                                <button className='btn btn-success btn-sm' onClick={() => handleRenameList(column)}>
                                    Save
                                </button>
                                <button className='btn btn-secondary btn-sm' onClick={() => setRenamingList(null)}>
                                    Cancel
                                </button>
                            </div>
                        ) : (
                            <>
                                <SortableContext
                                    items={filteredCards.map(card => card.id) || []}
                                    strategy={horizontalListSortingStrategy}
                                >
                                    {filteredCards.length === 0 ? (
                                        <p className='text-white'>No cards yet.</p>
                                    ) : (
                                        filteredCards.map((card) => (
                                            <SortableCard key={card.id} card={card} />
                                        ))
                                    )}
                                </SortableContext>
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

    const SortableCard = ({ card }) => {
        const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: card.id });

        const style = {
            transform: CSS.Transform.toString(transform),
            transition,
            backgroundColor: '#34495e',
            border: 'none',
            borderLeft: `4px solid ${card.color || 'orange'}`,
            borderRadius: '4px',
        };

        return (
            <div
                ref={setNodeRef}
                style={style}
                {...attributes}
                {...listeners}
                className='card mb-2'
            >
                <div className='card-body p-2 d-flex justify-content-between align-items-center'>
                    {editingCard === card.id ? (
                        <div className='d-flex gap-2 w-100'>
                            <input
                                type='text'
                                className='form-control'
                                value={editCardTitle}
                                onChange={(e) => setEditCardTitle(e.target.value)}
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
                                <button className='btn btn-sm btn-outline-light' onClick={() => { setEditingCard(card.id); setEditCardTitle(card.title); }}>
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
        <div className='d-flex vh-100 p-4' style={{ backgroundColor: '#1a2a44' }}>
            <div className='container-fluid'>
                <div className='d-flex justify-content-between align-items-center mb-4'>
                    <h2 className='text-white'>Board</h2>
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
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={lists} strategy={horizontalListSortingStrategy}>
                        <div className='d-flex gap-3' style={{ overflowX: 'auto' }}>
                            {lists.map((column) => (
                                <SortableList key={column} column={column} />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            </div>
        </div>
    );
}

export default Board;