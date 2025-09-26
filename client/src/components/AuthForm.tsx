import React, { useState } from 'react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

interface AuthFormProps {
  onAuthSuccess: (token: string, user: { email: string; username: string }) => void;
}

export default function AuthForm({ onAuthSuccess }: AuthFormProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const url = isLogin
        ? `${BACKEND_URL}/api/auth/login`
        : `${BACKEND_URL}/api/auth/register`;
      const body = isLogin
        ? { emailOrUsername: email || username, password }
        : { email, username, password };
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      let data;
      try {
        data = await res.json();
      } catch {
        setError('Server error: Invalid response');
        return;
      }
      if (!res.ok) {
        setError(data.message || 'Auth failed');
        return;
      }
      onAuthSuccess(data.token, data.user);
    } catch (err: any) {
      setError('Network/server error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      <form onSubmit={handleSubmit} className="max-w-md w-full p-8 rounded-lg shadow-2xl bg-gray-900 border border-gray-700">
        <h2 className="text-2xl font-bold mb-6 text-center text-white">{isLogin ? 'Login' : 'Register'}</h2>
        {!isLogin && (
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="mb-4 w-full px-4 py-2 rounded bg-gray-800 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        )}
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          className="mb-4 w-full px-4 py-2 rounded bg-gray-800 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required={!isLogin}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="mb-4 w-full px-4 py-2 rounded bg-gray-800 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        {error && <div className="text-red-400 mb-4 text-center">{error}</div>}
        <button
          type="submit"
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition-colors font-semibold"
          disabled={loading}
        >
          {loading ? 'Please wait...' : isLogin ? 'Login' : 'Register'}
        </button>
        <div className="mt-6 text-center">
          <button
            type="button"
            className="text-green-400 hover:underline"
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? 'No account? Register' : 'Already have an account? Login'}
          </button>
        </div>
      </form>
    </div>
  );
}
