import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Login from "./Login";
import Signup from "./Signup";

function App() {
    return (
        <Router>
            <div>
                {/* Navigation Bar */}
                <nav className="navbar navbar-expand-lg navbar-light bg-light">
                    <div className="container-fluid">
                        <Link className="navbar-brand" to="/">To-Do App</Link>
                        <div className="navbar-nav">
                            <Link className="nav-link" to="/login">Login</Link>
                            <Link className="nav-link" to="/signup">Sign Up</Link>
                        </div>
                    </div>
                </nav>

                {/* Routes */}
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/" element={<Login />} /> {/* Default route */}
                </Routes>
            </div>
        </Router>
    );
}

export default App;