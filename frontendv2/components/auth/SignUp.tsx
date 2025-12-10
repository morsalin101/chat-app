import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { BASE_API_URL } from '../../config/Config';

export default function SignUp() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      const res = await fetch(`${BASE_API_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fullName, email, password }),
      });

      if (!res.ok) {
        throw new Error('Registration failed');
      }

      const data = await res.json();
      console.log('[SignUp] Response:', data);
      
      if (data.token) {
        localStorage.setItem('jwt', data.token);
        console.log('[SignUp] Token saved, navigating to /chat');
        navigate('/chat', { replace: true });
      } else {
        throw new Error('No token in response');
      }
    } catch (err) {
      setError('Registration failed. Please try again.');
      console.error('Registration error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#111b21] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-[#00a884] p-4 rounded-full">
              <MessageCircle className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-white text-2xl font-semibold mb-2">CHATAPP</h1>
          <p className="text-gray-400 text-sm">Create your account</p>
        </div>

        {/* Sign Up Form */}
        <div className="bg-[#222e35] rounded-lg p-8 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-300 mb-2">
                Full Name
              </label>
              <input
                type="text"
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 bg-[#2a3942] border border-[#3b4a54] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00a884] focus:border-transparent"
                placeholder="Enter your full name"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-[#2a3942] border border-[#3b4a54] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00a884] focus:border-transparent"
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-[#2a3942] border border-[#3b4a54] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00a884] focus:border-transparent"
                placeholder="Enter your password"
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#00a884] hover:bg-[#00a884]/90 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
            >
              Sign Up
            </button>
            
            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Already have an account?{' '}
              <button
                onClick={() => navigate('/signin')}
                className="text-[#00a884] hover:underline font-medium"
              >
                Sign In
              </button>
            </p>
          </div>
        </div>

        <p className="text-center text-gray-500 text-xs mt-8">
          End-to-end encrypted
        </p>
      </div>
    </div>
  );
}
