import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

function BoardSelector({ userId, setSelectedBoardId }) {
    const [boards, setBoards] = useState([]);
    const [newBoardName, setNewBoardName] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        if (userId) {
            axios.get(`http://localhost:5000/boards/user/${userId}`)
                .then(res => {
                    setBoards(res.data);
                    // Remove automatic navigation to the first board
                    // Only set the boards and let the user select one manually
                })
                .catch(err => {
                    console.error("Error fetching boards:", err);
                    alert('Error fetching boards. Please try refreshing the page.');
                });
        }
    }, [userId]);

    const handleAddBoard = () => {
        if (newBoardName.trim() === '') {
            alert('Please enter a board name');
            return;
        }
        axios.post('http://localhost:5000/boards', { userId, name: newBoardName })
            .then(res => {
                if (res.data.message === 'Board created') {
                    const newBoard = { id: res.data.boardId, name: newBoardName };
                    setBoards([...boards, newBoard]);
                    setNewBoardName('');
                    // Optionally navigate to the new board after creation
                    setSelectedBoardId(newBoard.id);
                    navigate(`/board/${newBoard.id}`);
                } else {
                    alert('Failed to create board');
                }
            })
            .catch(err => {
                alert(err.response?.data || 'Error creating board');
            });
    };

    const handleDeleteBoard = (boardId) => {
        if (window.confirm('Are you sure you want to delete this board?')) {
            axios.delete(`http://localhost:5000/boards/${boardId}`)
                .then(res => {
                    if (res.data.message === 'Board deleted') {
                        const remainingBoards = boards.filter(board => board.id !== boardId);
                        setBoards(remainingBoards);
                        // If the deleted board was the selected one, clear the selection
                        setSelectedBoardId(null);
                    } else {
                        alert('Failed to delete board');
                    }
                })
                .catch(err => {
                    alert('Error deleting board');
                });
        }
    };

    const handleSelectBoard = (boardId) => {
        setSelectedBoardId(boardId);
        navigate(`/board/${boardId}`);
    };

    return (
        <div className="container mt-5">
            <h2 className="mb-4 fade-in" style={{ fontWeight: 600 }}>Your Boards</h2>
            <div className="row mb-4">
                <div className="col-md-6">
                    <div className="d-flex gap-2">
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Enter board name"
                            value={newBoardName}
                            onChange={(e) => setNewBoardName(e.target.value)}
                        />
                        <button className="btn btn-primary" onClick={handleAddBoard}>
                            Add Board
                        </button>
                    </div>
                </div>
            </div>
            <div className="row">
                {boards.length === 0 ? (
                    <div className="col-12 text-center text-secondary">
                        No boards yet. Create one to get started!
                    </div>
                ) : (
                    boards.map(board => (
                        <div key={board.id} className="col-md-4 mb-4">
                            <div className="card fade-in">
                                <div className="card-body d-flex justify-content-between align-items-center">
                                    <Link
                                        to={`/board/${board.id}`}
                                        className="text-primary"
                                        style={{ textDecoration: 'none', fontWeight: 600 }}
                                        onClick={(e) => {
                                            e.preventDefault(); // Prevent default Link behavior
                                            handleSelectBoard(board.id);
                                        }}
                                    >
                                        <h5 className="mb-0">{board.name}</h5>
                                    </Link>
                                    <button
                                        className="btn btn-sm btn-outline-danger"
                                        onClick={() => handleDeleteBoard(board.id)}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default BoardSelector;