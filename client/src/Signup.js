import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
import { Link } from 'react-router-dom';

function Signup() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');

    function handleSubmit(event) {
        event.preventDefault();
        axios.post('http://localhost:5000/signup', { email, password })
            .then(res => setMessage(res.data))
            .catch(err => setMessage('Request failed'));
    }

    return (
        <div className='d-flex vh-100 justify-content-center align-items-center bg-primary'>
            <div className='p-3 bg-white w-25'>
                <h2>Sign Up</h2>
                <form onSubmit={handleSubmit}>
                    <div className='mb-3'>
                        <label htmlFor='email'>Email</label>
                        <input
                            type='email'
                            placeholder='Enter Email'
                            className='form-control'
                            onChange={e => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className='mb-3'>
                        <label htmlFor='password'>Password</label>
                        <input
                            type='password'
                            placeholder='Enter Password'
                            className='form-control'
                            onChange={e => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button className='btn btn-success w-100'>Sign Up</button>
                </form>
                {message && <p className='mt-3 text-center'>{message}</p>}
                <p className='mt-3 text-center'>
                    Already have an account? <Link to="/login">Login here</Link>
                </p>
            </div>
        </div>
    );
}

export default Signup;