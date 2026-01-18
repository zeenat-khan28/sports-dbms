import { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useStudentAuth } from '../context/StudentAuthContext';
import { submissionsAPI } from '../api/axios';
import { Trophy, User, LogOut, ChevronDown, Calendar, Menu, X } from 'lucide-react';
import { Toaster } from 'react-hot-toast';

export default function StudentLayout() {
    const { student, token, logout, isAuthenticated } = useStudentAuth();
    const [profile, setProfile] = useState(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (isAuthenticated && token) {
            fetchProfile();
        }
    }, [isAuthenticated, token]);

    const fetchProfile = async () => {
        try {
            const res = await submissionsAPI.getMy(token);
            setProfile(res.data);
        } catch (err) {
            console.error('Failed to fetch profile', err);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/student/register');
    };

    return (
        <div className="min-h-screen bg-slate-950 relative overflow-hidden font-sans text-slate-100">


            <Toaster
                position="top-right"
                toastOptions={{
                    style: {
                        background: 'rgba(30, 41, 59, 0.9)',
                        color: '#fff',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255,255,255,0.1)',
                    },
                }}
            />

            {/* Navbar */}
            <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 transition-all duration-300">
                <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
                    {/* Brand */}
                    <Link to="/student/events" className="flex items-center gap-3 group">
                        <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform duration-300">
                            <Trophy className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <span className="font-bold text-lg tracking-tight text-white group-hover:text-blue-400 transition-colors">RVCE<span className="text-blue-400 group-hover:text-white">SPORTS</span></span>
                            <span className="text-[10px] text-slate-400 uppercase tracking-widest block -mt-1">Student Portal</span>
                        </div>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-6">
                        <Link
                            to="/student/events"
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 
                                ${location.pathname === '/student/events'
                                    ? 'bg-white/10 text-white shadow-inner shadow-white/5'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <Calendar className="w-4 h-4" />
                            Events Board
                        </Link>

                        {/* Profile Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all duration-300 group"
                            >
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-600 overflow-hidden ring-2 ring-transparent group-hover:ring-blue-500/50 transition-all">
                                    {profile?.photo_base64 ? (
                                        <img src={profile.photo_base64} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <User className="w-4 h-4 text-slate-300" />
                                        </div>
                                    )}
                                </div>
                                <span className="text-sm font-medium text-slate-200 max-w-[100px] truncate">{student?.name?.split(' ')[0]}</span>
                                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isMenuOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Dropdown Menu */}
                            {isMenuOpen && (
                                <>
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setIsMenuOpen(false)}
                                    />
                                    <div className="absolute right-0 mt-3 w-56 bg-[#0f172a] rounded-xl border border-white/10 shadow-2xl py-1 z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                                        <div className="px-4 py-3 border-b border-white/5">
                                            <p className="text-sm font-medium text-white truncate">{student?.name}</p>
                                            <p className="text-xs text-slate-400 truncate">{student?.email}</p>
                                        </div>
                                        <Link
                                            to="/student/profile"
                                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
                                            onClick={() => setIsMenuOpen(false)}
                                        >
                                            <User className="w-4 h-4 text-blue-400" />
                                            View Profile
                                        </Link>
                                        <div className="h-px bg-white/5 my-1" />
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors text-left"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            Logout
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden p-2 text-slate-300 hover:text-white"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>

                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                    <div className="md:hidden absolute top-16 left-0 right-0 bg-[#0f172a] border-b border-white/10 animate-in slide-in-from-top-2 duration-200 shadow-2xl">
                        <div className="p-4 space-y-4">
                            <Link
                                to="/student/events"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="flex items-center gap-3 px-4 py-3 rounded-lg bg-white/5 text-slate-200"
                            >
                                <Calendar className="w-5 h-5 text-blue-500" />
                                Events Board
                            </Link>
                            <Link
                                to="/student/profile"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="flex items-center gap-3 px-4 py-3 rounded-lg bg-white/5 text-slate-200"
                            >
                                <User className="w-5 h-5 text-purple-500" />
                                My Profile
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-red-500/10 text-red-400"
                            >
                                <LogOut className="w-5 h-5" />
                                Logout
                            </button>
                        </div>
                    </div>
                )}
            </nav>

            {/* Main Content */}
            <main className="pt-24 px-4 pb-12 max-w-7xl mx-auto relative z-10 animate-fadeIn">
                <Outlet />
            </main>
        </div>
    );
}
