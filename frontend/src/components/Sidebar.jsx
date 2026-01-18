import { NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, Clock, CheckCircle, XCircle,
    Calendar, Download, LogOut, Users, Trophy
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/admin/login');
    };

    const navItems = [
        { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
        { to: '/admin/pending', label: 'Pending', icon: Clock },
        { to: '/admin/approved', label: 'Approved', icon: CheckCircle },
        { to: '/admin/rejected', label: 'Rejected', icon: XCircle },
        { to: '/admin/export', label: 'Export Data', icon: Download },
    ];

    return (
        <aside className="w-64 fixed left-4 top-20 bottom-4 z-40 flex flex-col rounded-xl border border-slate-700 bg-slate-900/90 backdrop-blur-sm shadow-xl">
            {/* User Info */}
            <div className="p-4 border-b border-slate-700">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">
                            {user?.email || 'Administrator'}
                        </p>
                        <p className="text-xs text-green-400 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                            Online
                        </p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.end}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group
                            ${isActive
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800'
                            }`
                        }
                    >
                        <item.icon className="w-5 h-5" />
                        <span className="font-medium">{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            {/* Logout */}
            <div className="p-4 border-t border-slate-700">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-red-900/30 text-slate-300 hover:text-red-400 border border-slate-700 hover:border-red-900/50 rounded-lg transition-all duration-200"
                >
                    <LogOut className="w-4 h-4" />
                    <span className="font-medium">Logout</span>
                </button>
            </div>
        </aside>
    );
}
