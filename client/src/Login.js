import React from 'react'
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios'

function Login(){
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  function handleSubmit(event){
    event.preventDefault();
    axios.post('http://localhost:5000/login', {email, password})
    .then(res => console.log(res))
    .catch(err => console.log(err));
  }


  return (
    <div className='d-flex vh-100 justify-content-center align-items-center bg-primary'>
      <div className='p-3 bg-white w-25'>
        <h2>Login</h2>
        <form onSubmit={handleSubmit}>
          <div className='mb-3'>
            <label htmlFor='email'>Email</label>
            <input type='email' placeholder='Enter Email' className='form-control' onChange={e => setEmail(e.target.value)}/>
          </div>
          <div className='mb-3'>
            <label htmlFor='password'>Password</label>
            <input type='password' placeholder='Enter Password' className='form-control' onChange={e => setPassword(e.target.value)}/>
          </div>
          <button className='btn btn-success'>Login</button>
        </form>
      </div>
    </div>
  )
}

export default Login