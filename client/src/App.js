import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import Login from "./Login";
import Signup from "./Signup";
import Board from "./Board";

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userId, setUserId] = useState(null);

    return (
        <Router>
            <div>
                <nav className="navbar navbar-expand-lg navbar-light bg-light">
                    <div className="container-fluid">
                        <Link className="navbar-brand" to="/">To-Do App</Link>
                        <div className="navbar-nav">
                            {!isLoggedIn ? (
                                <>
                                    <Link className="nav-link" to="/login">Login</Link>
                                    <Link className="nav-link" to="/signup">Sign Up</Link>
                                </>
                            ) : (
                                <>
                                    <Link className="nav-link" to="/board">Board</Link>
                                    <button
                                        className="nav-link btn btn-link"
                                        onClick={() => {
                                            setIsLoggedIn(false);
                                            setUserId(null);
                                        }}
                                    >
                                        Logout
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </nav>

                <Routes>
                    <Route
                        path="/login"
                        element={<Login setIsLoggedIn={setIsLoggedIn} setUserId={setUserId} />}
                    />
                    <Route path="/signup" element={<Signup />} />
                    <Route
                        path="/board"
                        element={
                            isLoggedIn ? (
                                <>
                                    {console.log("userId in App.js:", userId)}
                                    <Board userId={userId} />
                                </>
                            ) : (
                                <Navigate to="/login" replace />
                            )
                        }
                    />
                    <Route
                        path="/"
                        element={
                            isLoggedIn ? (
                                <Navigate to="/board" replace />
                            ) : (
                                <Navigate to="/login" replace />
                            )
                        }
                    />
                </Routes>
            </div>
        </Router>
    );
}

export default App;