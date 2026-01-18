/**
 * Analytics Dashboard - Professional Data & Insights
 */
import { useState, useEffect } from 'react';
import { analyticsAPI } from '../../api/axios';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, Area, AreaChart
} from 'recharts';
import {
    TrendingUp, Users, Calendar, CheckCircle, BarChart3, PieChart as PieChartIcon,
    Activity, Award, Target
} from 'lucide-react';
import toast from 'react-hot-toast';

// Professional color palette
const COLORS = {
    primary: '#6366f1',
    secondary: '#8b5cf6',
    success: '#22c55e',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#0ea5e9',
    slate: '#64748b'
};

const CHART_COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#0ea5e9', '#22c55e'];

export default function AnalyticsDashboardPage() {
    const [overview, setOverview] = useState(null);
    const [participation, setParticipation] = useState(null);
    const [events, setEvents] = useState(null);
    const [attendance, setAttendance] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAllData();
    }, []);

    const loadAllData = async () => {
        try {
            const [overviewRes, participationRes, eventsRes, attendanceRes] = await Promise.all([
                analyticsAPI.getOverview(),
                analyticsAPI.getParticipation(),
                analyticsAPI.getEvents(),
                analyticsAPI.getAttendance()
            ]);
            setOverview(overviewRes.data);
            setParticipation(participationRes.data);
            setEvents(eventsRes.data);
            setAttendance(attendanceRes.data);
        } catch (err) {
            console.error('Failed to load analytics:', err);
            toast.error('Failed to load analytics data');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="loader mb-4"></div>
                    <p className="text-gray-400">Loading Analytics...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <BarChart3 className="w-8 h-8 text-indigo-500" />
                        Data & Analytics
                    </h1>
                    <p className="text-gray-400 mt-1">Insights for strategic sports management decisions</p>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard
                    title="Total Students"
                    value={overview?.total_students || 0}
                    icon={Users}
                    color="indigo"
                    trend="+12%"
                />
                <KPICard
                    title="Events Conducted"
                    value={overview?.total_events || 0}
                    icon={Calendar}
                    color="violet"
                />
                <KPICard
                    title="Total Registrations"
                    value={overview?.total_registrations || 0}
                    icon={Target}
                    color="cyan"
                />
                <KPICard
                    title="Avg Attendance"
                    value={`${overview?.avg_attendance_rate || 0}%`}
                    icon={CheckCircle}
                    color="emerald"
                />
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Event Participation Bar Chart */}
                <ChartCard title="Sport-wise Participation" icon={BarChart3}>
                    {participation?.event_participation?.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={participation.event_participation} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis type="number" stroke="#94a3b8" />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    width={120}
                                    stroke="#94a3b8"
                                    tick={{ fontSize: 12 }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1e293b',
                                        border: '1px solid #334155',
                                        borderRadius: '8px'
                                    }}
                                />
                                <Bar
                                    dataKey="participants"
                                    fill="#6366f1"
                                    radius={[0, 4, 4, 0]}
                                    name="Participants"
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <EmptyChart message="No participation data yet" />
                    )}
                </ChartCard>

                {/* Branch Distribution Pie Chart */}
                <ChartCard title="Branch Distribution" icon={PieChartIcon}>
                    {participation?.branch_distribution?.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={participation.branch_distribution}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                >
                                    {participation.branch_distribution.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={CHART_COLORS[index % CHART_COLORS.length]}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1e293b',
                                        border: '1px solid #334155',
                                        borderRadius: '8px'
                                    }}
                                />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <EmptyChart message="No branch data yet" />
                    )}
                </ChartCard>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Event Trend Line Chart */}
                <ChartCard title="Event Participation Trend" icon={TrendingUp}>
                    {events?.event_trend?.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={events.event_trend}>
                                <defs>
                                    <linearGradient id="colorParticipants" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis
                                    dataKey="date"
                                    stroke="#94a3b8"
                                    tick={{ fontSize: 11 }}
                                />
                                <YAxis stroke="#94a3b8" />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1e293b',
                                        border: '1px solid #334155',
                                        borderRadius: '8px'
                                    }}
                                    labelFormatter={(value) => `Date: ${value}`}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="participants"
                                    stroke="#6366f1"
                                    fillOpacity={1}
                                    fill="url(#colorParticipants)"
                                    name="Participants"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <EmptyChart message="No event trend data yet" />
                    )}
                </ChartCard>

                {/* Top Events */}
                <ChartCard title="Top Events by Registration" icon={Award}>
                    {events?.top_events?.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={events.top_events}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis
                                    dataKey="name"
                                    stroke="#94a3b8"
                                    tick={{ fontSize: 11 }}
                                    interval={0}
                                    angle={-15}
                                    textAnchor="end"
                                    height={60}
                                />
                                <YAxis stroke="#94a3b8" />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1e293b',
                                        border: '1px solid #334155',
                                        borderRadius: '8px'
                                    }}
                                />
                                <Bar
                                    dataKey="participants"
                                    fill="#8b5cf6"
                                    radius={[4, 4, 0, 0]}
                                    name="Participants"
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <EmptyChart message="No top events data yet" />
                    )}
                </ChartCard>
            </div>

            {/* Attendance Analytics */}
            <ChartCard title="Attendance Rate by Event" icon={Activity} fullWidth>
                {attendance?.attendance_rates?.length > 0 ? (
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={attendance.attendance_rates}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis
                                dataKey="name"
                                stroke="#94a3b8"
                                tick={{ fontSize: 11 }}
                                interval={0}
                                angle={-20}
                                textAnchor="end"
                                height={80}
                            />
                            <YAxis
                                stroke="#94a3b8"
                                domain={[0, 100]}
                                tickFormatter={(value) => `${value}%`}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#1e293b',
                                    border: '1px solid #334155',
                                    borderRadius: '8px'
                                }}
                                formatter={(value, name) => {
                                    if (name === 'rate') return [`${value}%`, 'Attendance Rate'];
                                    return [value, name];
                                }}
                            />
                            <Legend />
                            <Bar
                                dataKey="rate"
                                fill="#22c55e"
                                radius={[4, 4, 0, 0]}
                                name="Attendance Rate (%)"
                            />
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <EmptyChart message="No attendance data yet" />
                )}
            </ChartCard>

            {/* Semester Distribution */}
            <ChartCard title="Semester-wise Student Distribution" icon={Users} fullWidth>
                {participation?.semester_distribution?.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={participation.semester_distribution}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis
                                dataKey="semester"
                                stroke="#94a3b8"
                                tickFormatter={(value) => `Sem ${value}`}
                            />
                            <YAxis stroke="#94a3b8" />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#1e293b',
                                    border: '1px solid #334155',
                                    borderRadius: '8px'
                                }}
                                labelFormatter={(value) => `Semester ${value}`}
                            />
                            <Bar
                                dataKey="count"
                                fill="#0ea5e9"
                                radius={[4, 4, 0, 0]}
                                name="Students"
                            />
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <EmptyChart message="No semester data yet" />
                )}
            </ChartCard>
        </div>
    );
}

// KPI Card Component
function KPICard({ title, value, icon: Icon, color, trend }) {
    const colorClasses = {
        indigo: 'from-indigo-600/20 to-indigo-600/5 border-indigo-500/30',
        violet: 'from-violet-600/20 to-violet-600/5 border-violet-500/30',
        cyan: 'from-cyan-600/20 to-cyan-600/5 border-cyan-500/30',
        emerald: 'from-emerald-600/20 to-emerald-600/5 border-emerald-500/30'
    };

    const iconColors = {
        indigo: 'text-indigo-400',
        violet: 'text-violet-400',
        cyan: 'text-cyan-400',
        emerald: 'text-emerald-400'
    };

    return (
        <div className={`card bg-gradient-to-br ${colorClasses[color]} border p-6 relative overflow-hidden`}>
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm text-gray-400 font-medium">{title}</p>
                    <p className="text-3xl font-bold text-white mt-2">{value}</p>
                    {trend && (
                        <p className="text-sm text-emerald-400 mt-2 flex items-center gap-1">
                            <TrendingUp className="w-4 h-4" />
                            {trend} from last month
                        </p>
                    )}
                </div>
                <div className={`p-3 rounded-xl bg-slate-800/50 ${iconColors[color]}`}>
                    <Icon className="w-6 h-6" />
                </div>
            </div>
            {/* Decorative background */}
            <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full ${iconColors[color]} opacity-10`}></div>
        </div>
    );
}

// Chart Card Wrapper
function ChartCard({ title, icon: Icon, children, fullWidth }) {
    return (
        <div className={`card p-6 ${fullWidth ? 'col-span-full' : ''}`}>
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-indigo-600/20">
                    <Icon className="w-5 h-5 text-indigo-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">{title}</h3>
            </div>
            {children}
        </div>
    );
}

// Empty Chart Placeholder
function EmptyChart({ message }) {
    return (
        <div className="flex items-center justify-center h-[300px] text-gray-500">
            <div className="text-center">
                <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>{message}</p>
            </div>
        </div>
    );
}
