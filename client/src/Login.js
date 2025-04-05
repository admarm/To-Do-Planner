import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Login({ setIsLoggedIn, setUserId }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = (e) => {
        e.preventDefault();
        axios.post('http://localhost:5000/login', { email, password })
            .then(res => {
                if (res.data.message === "Login Successful") {
                    setIsLoggedIn(true);
                    setUserId(res.data.userId);
                    localStorage.setItem('isLoggedIn', 'true');
                    localStorage.setItem('userId', res.data.userId);
                    navigate('/board-selector');
                } else {
                    setError('Invalid email or password');
                }
            })
            .catch(err => {
                setError('Error logging in. Please try again.');
            });
    };

    return (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
            <div className="card p-4 fade-in" style={{ maxWidth: '400px', width: '100%' }}>
                <h2 className="text-center mb-4" style={{ fontWeight: 600 }}>Login</h2>
                {error && <div className="alert alert-danger">{error}</div>}
                <form onSubmit={handleLogin}>
                    <div className="mb-3">
                        <label htmlFor="email" className="form-label">Email</label>
                        <input
                            type="email"
                            className="form-control"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="password" className="form-label">Password</label>
                        <input
                            type="password"
                            className="form-control"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="btn btn-primary w-100">Login</button>
                </form>
            </div>
        </div>
    );
}

export default Login;