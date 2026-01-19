import { useState, useEffect } from 'react';
import { submissionsAPI } from '../../api/axios';
import {
    Users, Clock, CheckCircle, XCircle,
    TrendingUp, Trophy, AlertCircle, Activity, Edit
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import EditSubmissionModal from '../../components/admin/EditSubmissionModal';

export default function DashboardPage() {
    const [stats, setStats] = useState({
        pending: 0,
        approved: 0,
        rejected: 0,
        total: 0,
    });
    const [recentSubmissions, setRecentSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingSubmission, setEditingSubmission] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [pending, approved, rejected] = await Promise.all([
                submissionsAPI.getAll({ status: 'pending', per_page: 1 }),
                submissionsAPI.getAll({ status: 'approved', per_page: 1 }),
                submissionsAPI.getAll({ status: 'rejected', per_page: 1 }),
            ]);

            setStats({
                pending: pending.data.total,
                approved: approved.data.total,
                rejected: rejected.data.total,
                total: pending.data.total + approved.data.total + rejected.data.total,
            });

            const recent = await submissionsAPI.getAll({ per_page: 5 });
            setRecentSubmissions(recent.data.submissions);
        } catch (error) {
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveEdit = async (id, data) => {
        try {
            await submissionsAPI.update(id, data);
            toast.success('Details updated successfully');
            fetchData(); // Refresh data
        } catch (error) {
            toast.error('Failed to update details');
            throw error;
        }
    };

    const statCards = [
        {
            label: 'Total Submissions',
            value: stats.total,
            icon: Users,
            color: 'text-blue-400',
            gradient: 'from-blue-500/20 to-blue-500/5',
            border: 'border-blue-500/30'
        },
        {
            label: 'Pending Approval',
            value: stats.pending,
            icon: Clock,
            color: 'text-amber-400',
            gradient: 'from-amber-500/20 to-amber-500/5',
            border: 'border-amber-500/30'
        },
        {
            label: 'Approved Players',
            value: stats.approved,
            icon: CheckCircle,
            color: 'text-emerald-400',
            gradient: 'from-emerald-500/20 to-emerald-500/5',
            border: 'border-emerald-500/30'
        },
        {
            label: 'Rejected',
            value: stats.rejected,
            icon: XCircle,
            color: 'text-red-400',
            gradient: 'from-red-500/20 to-red-500/5',
            border: 'border-red-500/30'
        },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="loader w-12 h-12"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-10">
            {/* Header */}
            <div className="flex items-end justify-between border-b border-slate-700 pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                        <Activity className="w-7 h-7 text-blue-500" />
                        Registration Dashboard
                    </h1>
                    <p className="text-slate-400 mt-1">Overview of student sports registrations</p>
                </div>
                <div className="text-right hidden md:block">
                    <p className="text-xs text-slate-500 uppercase tracking-widest">System Status</p>
                    <div className="flex items-center justify-end gap-2 mt-1">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        <span className="text-green-400 text-sm font-medium">Online</span>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, index) => (
                    <div
                        key={stat.label}
                        className={`relative group overflow-hidden rounded-2xl border ${stat.border} bg-black/40 backdrop-blur-xl p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(0,0,0,0.5)]`}
                        style={{ animationDelay: `${index * 100}ms` }}
                    >
                        <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-50 group-hover:opacity-100 transition-opacity duration-500`}></div>
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-3 rounded-xl bg-white/5 border border-white/10 ${stat.color} shadow-lg`}>
                                    <stat.icon className="w-6 h-6" />
                                </div>
                                <span className={`text-xs font-bold px-2 py-1 rounded-full bg-white/5 border border-white/10 ${stat.color}`}>
                                    +12%
                                </span>
                            </div>
                            <p className="text-gray-400 text-sm font-medium uppercase tracking-wider">{stat.label}</p>
                            <p className="text-4xl font-bold text-white mt-1 tracking-tight drop-shadow-md">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Submissions */}
                <div className="lg:col-span-2 card overflow-hidden border-white/10">
                    <div className="p-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-amber-500" />
                            Live Submissions
                        </h2>
                        <button className="text-xs text-amber-500 hover:text-amber-400 uppercase tracking-wider font-bold">View All</button>
                    </div>
                    <div className="overflow-x-auto">
                        {recentSubmissions.length > 0 ? (
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-black/20">
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Student</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Sport</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Time</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {recentSubmissions.map((sub) => (
                                        <tr key={sub.id} className="group hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center border border-white/10">
                                                        <span className="text-xs font-bold text-white">{sub.student_name[0]}</span>
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-white text-sm group-hover:text-amber-400 transition-colors">{sub.student_name}</p>
                                                        <p className="text-xs text-gray-500">{sub.usn}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-300">{sub.game_sport_competition}</td>
                                            <td className="px-6 py-4">
                                                <span className={`badge badge-${sub.status}`}>
                                                    {sub.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right text-sm text-gray-500 font-mono">
                                                {new Date(sub.submitted_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => setEditingSubmission(sub)}
                                                    className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-blue-400 transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="p-12 text-center">
                                <AlertCircle className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                                <p className="text-gray-500">No data available</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Performance Chart */}
                <div className="space-y-6">
                    <div className="card p-6 border-white/10">
                        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                            <Trophy className="w-5 h-5 text-amber-500" />
                            Submission Breakdown
                        </h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={[
                                            { name: 'Pending', value: stats.pending, color: '#f59e0b' },
                                            { name: 'Approved', value: stats.approved, color: '#10b981' },
                                            { name: 'Rejected', value: stats.rejected, color: '#ef4444' },
                                        ].filter(d => d.value > 0)}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={80}
                                        paddingAngle={3}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {[
                                            { name: 'Pending', value: stats.pending, color: '#f59e0b' },
                                            { name: 'Approved', value: stats.approved, color: '#10b981' },
                                            { name: 'Rejected', value: stats.rejected, color: '#ef4444' },
                                        ].filter(d => d.value > 0).map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Legend
                                        verticalAlign="bottom"
                                        height={36}
                                        formatter={(value) => <span style={{ color: '#9ca3af', fontSize: '12px' }}>{value}</span>}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="text-center mt-2">
                            <p className="text-3xl font-bold text-white">{stats.total}</p>
                            <p className="text-gray-500 text-sm">Total Submissions</p>
                        </div>
                    </div>

                    <div className="card p-6 border-white/10 bg-gradient-to-br from-amber-500/10 to-transparent">
                        <h3 className="text-white font-bold mb-2 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-amber-500" />
                            Pending Actions
                        </h3>
                        <p className="text-gray-400 text-sm mb-4">
                            {stats.pending > 0
                                ? `${stats.pending} submissions require immediate attention.`
                                : "All clear. No pending actions."}
                        </p>
                        <button className="w-full btn btn-primary flex items-center justify-center gap-2">
                            Review Now
                        </button>
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            <EditSubmissionModal
                submission={editingSubmission}
                onClose={() => setEditingSubmission(null)}
                onSave={handleSaveEdit}
            />
        </div>
    );
}
