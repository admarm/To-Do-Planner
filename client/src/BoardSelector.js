// BoardSelector.js
import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

function BoardSelector({ userId, setSelectedBoardId }) {
    const [boards, setBoards] = useState([]);
    const [newBoardName, setNewBoardName] = useState('');
    const [showInput, setShowInput] = useState(false);
    const [renamingBoardId, setRenamingBoardId] = useState(null);
    const [renameValue, setRenameValue] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        if (userId) {
            axios.get(`http://localhost:5000/boards/user/${userId}`)
                .then(res => {
                    console.log("Fetched boards:", res.data);
                    setBoards(res.data);
                    // If there are boards, select the first one by default
                    if (res.data.length > 0) {
                        setSelectedBoardId(res.data[0].id);
                        navigate(`/board/${res.data[0].id}`);
                    }
                })
                .catch(err => {
                    console.error("Error fetching boards:", err);
                    alert('Error fetching boards');
                });
        }
    }, [userId, setSelectedBoardId, navigate]);

    const handleCreateBoard = () => {
        if (newBoardName.trim() === '') {
            alert('Please enter a board name');
            return;
        }
        axios.post('http://localhost:5000/boards', { userId, name: newBoardName.trim() })
            .then(res => {
                console.log("Create board response:", res.data);
                if (res.data.message === 'Board created') {
                    const newBoard = { id: res.data.boardId, name: newBoardName.trim() };
                    setBoards([...boards, newBoard]);
                    setNewBoardName('');
                    setShowInput(false);
                    setSelectedBoardId(newBoard.id);
                    navigate(`/board/${newBoard.id}`);
                } else {
                    alert('Failed to create board');
                }
            })
            .catch(err => {
                console.error("Error creating board:", err);
                alert(err.response?.data || 'Error creating board');
            });
    };

    const handleDeleteBoard = (boardId) => {
        if (window.confirm('Are you sure you want to delete this board? All lists and cards will be deleted.')) {
            axios.delete(`http://localhost:5000/boards/${boardId}`)
                .then(res => {
                    console.log("Delete board response:", res.data);
                    if (res.data.message === 'Board deleted') {
                        const remainingBoards = boards.filter(board => board.id !== boardId);
                        setBoards(remainingBoards);
                        if (remainingBoards.length > 0) {
                            setSelectedBoardId(remainingBoards[0].id);
                            navigate(`/board/${remainingBoards[0].id}`);
                        } else {
                            setSelectedBoardId(null);
                            navigate('/board-selector');
                        }
                    } else {
                        alert('Failed to delete board');
                    }
                })
                .catch(err => {
                    console.error("Error deleting board:", err);
                    alert(err.response?.data || 'Error deleting board');
                });
        }
    };

    const handleRenameBoard = (boardId) => {
        if (renameValue.trim() === '') {
            alert('Please enter a new board name');
            return;
        }
        axios.put(`http://localhost:5000/boards/${boardId}`, { name: renameValue.trim() })
            .then(res => {
                console.log("Rename board response:", res.data);
                if (res.data.message === 'Board name updated') {
                    setBoards(boards.map(board =>
                        board.id === boardId ? { ...board, name: renameValue.trim() } : board
                    ));
                    setRenamingBoardId(null);
                    setRenameValue('');
                } else {
                    alert('Failed to rename board');
                }
            })
            .catch(err => {
                console.error("Error renaming board:", err);
                alert(err.response?.data || 'Error renaming board');
            });
    };

    return (
        <div className='d-flex p-4' style={{ backgroundColor: '#1a2a44', minHeight: '100vh' }}>
            <div className='container-fluid'>
                <h2 className='text-white mb-4'>Your Boards</h2>
                <div className='d-flex gap-3 flex-wrap'>
                    {boards.map(board => (
                        <div key={board.id} className='card' style={{ width: '300px', backgroundColor: '#2c3e50', border: 'none' }}>
                            <div className='card-body d-flex justify-content-between align-items-center'>
                                {renamingBoardId === board.id ? (
                                    <div className='d-flex gap-2 w-100'>
                                        <input
                                            type='text'
                                            className='form-control'
                                            value={renameValue}
                                            onChange={(e) => setRenameValue(e.target.value)}
                                            style={{ backgroundColor: '#34495e', color: 'white', border: 'none' }}
                                        />
                                        <button className='btn btn-success btn-sm' onClick={() => handleRenameBoard(board.id)}>
                                            Save
                                        </button>
                                        <button className='btn btn-secondary btn-sm' onClick={() => setRenamingBoardId(null)}>
                                            Cancel
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <Link
                                            to={`/board/${board.id}`}
                                            className='text-white'
                                            style={{ textDecoration: 'none' }}
                                            onClick={() => setSelectedBoardId(board.id)}
                                        >
                                            <h5 className='mb-0'>{board.name}</h5>
                                        </Link>
                                        <div className='d-flex gap-1'>
                                            <button
                                                className='btn btn-sm btn-outline-light'
                                                onClick={() => {
                                                    setRenamingBoardId(board.id);
                                                    setRenameValue(board.name);
                                                }}
                                            >
                                                Rename
                                            </button>
                                            <button
                                                className='btn btn-sm btn-outline-danger'
                                                onClick={() => handleDeleteBoard(board.id)}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                    <div className='card' style={{ width: '300px', backgroundColor: '#2c3e50', border: 'none' }}>
                        <div className='card-body'>
                            {!showInput ? (
                                <button
                                    className='btn btn-primary w-100'
                                    onClick={() => setShowInput(true)}
                                >
                                    Create New Board
                                </button>
                            ) : (
                                <div className='d-flex gap-2'>
                                    <input
                                        type='text'
                                        className='form-control'
                                        placeholder='Enter board name'
                                        value={newBoardName}
                                        onChange={(e) => setNewBoardName(e.target.value)}
                                        style={{ backgroundColor: '#34495e', color: 'white', border: 'none' }}
                                    />
                                    <button className='btn btn-success btn-sm' onClick={handleCreateBoard}>
                                        Add
                                    </button>
                                    <button className='btn btn-secondary btn-sm' onClick={() => setShowInput(false)}>
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default BoardSelector;