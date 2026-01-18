/**
 * Login Page for Admin authentication
 */
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, AlertCircle, Trophy } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function LoginPage() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await login(email, password);
            toast.success('Login successful!');
            navigate('/admin');
        } catch (err) {
            console.error('Login Error:', err);
            let msg = 'Login failed';

            if (err.response) {
                const status = err.response.status;
                const data = err.response.data;
                const detail = data?.detail;

                msg = `Server Error (${status}): `;

                if (typeof detail === 'string') {
                    msg += detail;
                } else if (Array.isArray(detail)) {
                    // Start with first validation error
                    msg += detail.map(d => d.msg).join(', ');
                } else if (typeof detail === 'object') {
                    msg += JSON.stringify(detail);
                } else {
                    msg += JSON.stringify(data);
                }
            } else if (err.request) {
                msg = 'Network Error: No response from server. Check backend.';
            } else {
                msg = err.message;
            }

            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <Toaster position="top-right" />
            <div className="card p-8 max-w-md w-full animate-fadeIn">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-[0_0_25px_rgba(99,102,241,0.4)]">
                        <Trophy className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">Admin Login</h1>
                    <p className="text-gray-400 mt-1">RVCE Sports Management</p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-6">
                        <div className="flex items-center gap-2 text-red-400 font-bold">
                            <AlertCircle className="w-5 h-5" />
                            <span>Login Failed</span>
                        </div>
                        <p className="text-red-300 text-sm mt-1 font-mono break-all">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="form-label flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="form-input"
                            placeholder="admin@example.com"
                        />
                    </div>

                    <div>
                        <label className="form-label flex items-center gap-2">
                            <Lock className="w-4 h-4" />
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="form-input"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-primary w-full"
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <div className="mt-6 text-center space-y-2">
                    <Link to="/" className="text-sm text-gray-500 hover:text-gray-400 block">
                        ← Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
