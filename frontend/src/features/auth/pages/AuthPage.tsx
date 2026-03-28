import './AuthPage.scss'
import { useState } from 'react';
import { LoginForm } from '../components/LoginForm';
import { SignupForm } from '../components/SignupForm'; 

export function AuthPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const isLogin = mode === 'login';

  return (
    <main>
      {isLogin ? <h1>Log In</h1>: <h1>Sign Up</h1>}

      {isLogin ? <LoginForm /> : <SignupForm />}
      
        <p>
          <span> {isLogin ? 'Not a member?' : 'Already a member?'} </span>
          <button onClick={isLogin? () => setMode('signup') : () => setMode('login')}>
            {isLogin? 'Sign up here' : 'Log in here'}
          </button>
        </p>
      
    </main>
  );
}
