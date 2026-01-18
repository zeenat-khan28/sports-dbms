import { Outlet, useLocation, Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Toaster } from 'react-hot-toast';
import { Trophy, Calendar, Users, Mail, BarChart3 } from 'lucide-react';

export default function AdminLayout() {
    const location = useLocation();
    const isEvents = location.pathname.includes('/events');
    const isAnalytics = location.pathname.includes('/analytics');

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 4000,
                    style: {
                        background: '#1e293b',
                        color: '#f1f5f9',
                        border: '1px solid #334155',
                    },
                    success: {
                        iconTheme: { primary: '#22c55e', secondary: '#fff' },
                    },
                    error: {
                        iconTheme: { primary: '#ef4444', secondary: '#fff' },
                    },
                }}
            />

            {/* Professional Header */}
            <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700 flex items-center px-6 justify-between shadow-lg">
                <div className="flex items-center gap-10">
                    {/* University Logo */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-md">
                            <Trophy className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="font-bold text-lg text-white tracking-wide">RVCE SPORTS</h1>
                            <p className="text-[10px] text-slate-400 uppercase tracking-widest">Admin Portal</p>
                        </div>
                    </div>

                    {/* Main Navigation Tabs */}
                    <nav className="flex items-center gap-1 bg-slate-800/50 p-1 rounded-lg border border-slate-700">
                        <Link
                            to="/admin"
                            className={`px-5 py-2 rounded-md text-sm font-semibold transition-all duration-200 flex items-center gap-2
                                ${!isEvents && !location.pathname.includes('/email') && !isAnalytics
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                                }`}
                        >
                            <Users className="w-4 h-4" />
                            Registrations
                        </Link>
                        <Link
                            to="/admin/events"
                            className={`px-5 py-2 rounded-md text-sm font-semibold transition-all duration-200 flex items-center gap-2
                                ${isEvents
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                                }`}
                        >
                            <Calendar className="w-4 h-4" />
                            Events
                        </Link>
                        <Link
                            to="/admin/email"
                            className={`px-5 py-2 rounded-md text-sm font-semibold transition-all duration-200 flex items-center gap-2
                                ${location.pathname.includes('/email')
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                                }`}
                        >
                            <Mail className="w-4 h-4" />
                            Email Center
                        </Link>
                        <Link
                            to="/admin/analytics"
                            className={`px-5 py-2 rounded-md text-sm font-semibold transition-all duration-200 flex items-center gap-2
                                ${isAnalytics
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                                }`}
                        >
                            <BarChart3 className="w-4 h-4" />
                            Analytics
                        </Link>
                    </nav>
                </div>

                {/* Admin Badge */}
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-full border border-slate-700">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    <span className="text-xs text-slate-300 font-medium">Admin Online</span>
                </div>
            </header>

            <Sidebar />

            <main className="ml-[280px] pt-24 p-8 max-w-[1600px]">
                <div className="relative z-10">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
