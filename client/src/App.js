import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import Login from "./Login";
import Signup from "./Signup";
import Board from "./Board";
import BoardSelector from "./BoardSelector";
import './styles.css';

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(() => {
        return localStorage.getItem('isLoggedIn') === 'true';
    });
    const [userId, setUserId] = useState(() => {
        return localStorage.getItem('userId') || null;
    });
    const [selectedBoardId, setSelectedBoardId] = useState(null);
    const [darkMode, setDarkMode] = useState(() => {
        const savedMode = localStorage.getItem('darkMode');
        return savedMode ? JSON.parse(savedMode) : false;
    });

    useEffect(() => {
        localStorage.setItem('isLoggedIn', isLoggedIn);
        localStorage.setItem('userId', userId);
    }, [isLoggedIn, userId]);

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark-mode');
        } else {
            document.documentElement.classList.remove('dark-mode');
        }
        localStorage.setItem('darkMode', JSON.stringify(darkMode));
    }, [darkMode]);

    const handleLogout = () => {
        setIsLoggedIn(false);
        setUserId(null);
        setSelectedBoardId(null);
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userId');
    };

    return (
        <Router>
            <div>
                <nav className="navbar navbar-expand-lg">
                    <div className="container-fluid">
                        <Link className="navbar-brand" to="/">To-Do App</Link>
                        <button
                            className="navbar-toggler"
                            type="button"
                            data-bs-toggle="collapse"
                            data-bs-target="#navbarNav"
                            aria-controls="navbarNav"
                            aria-expanded="false"
                            aria-label="Toggle navigation"
                        >
                            <span className="navbar-toggler-icon"></span>
                        </button>
                        <div className="collapse navbar-collapse" id="navbarNav">
                            <div className="navbar-nav ms-auto">
                                {!isLoggedIn ? (
                                    <>
                                        <Link className="nav-link" to="/login">Login</Link>
                                        <Link className="nav-link" to="/signup">Sign Up</Link>
                                    </>
                                ) : (
                                    <>
                                        <Link className="nav-link" to="/board-selector">Boards</Link>
                                        {selectedBoardId && (
                                            <Link className="nav-link" to={`/board/${selectedBoardId}`}>
                                                Current Board
                                            </Link>
                                        )}
                                        <button
                                            className="nav-link btn btn-link"
                                            onClick={handleLogout}
                                        >
                                            Logout
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </nav>

                <div className="container mt-4">
                    <Routes>
                        <Route
                            path="/login"
                            element={<Login setIsLoggedIn={setIsLoggedIn} setUserId={setUserId} />}
                        />
                        <Route path="/signup" element={<Signup />} />
                        <Route
                            path="/board-selector"
                            element={
                                isLoggedIn && userId ? (
                                    <BoardSelector userId={userId} setSelectedBoardId={setSelectedBoardId} />
                                ) : (
                                    <Navigate to="/login" replace />
                                )
                            }
                        />
                        <Route
                            path="/board/:boardId"
                            element={
                                isLoggedIn && userId ? (
                                    <Board userId={userId} boardId={selectedBoardId} />
                                ) : (
                                    <Navigate to="/login" replace />
                                )
                            }
                        />
                        <Route
                            path="/board"
                            element={<Navigate to="/board-selector" replace />}
                        />
                        <Route
                            path="/"
                            element={
                                isLoggedIn ? (
                                    <Navigate to="/board-selector" replace />
                                ) : (
                                    <Navigate to="/login" replace />
                                )
                            }
                        />
                        <Route
                            path="*"
                            element={<Navigate to="/board-selector" replace />}
                        />
                    </Routes>
                </div>
            </div>
        </Router>
    );
}

export default App;