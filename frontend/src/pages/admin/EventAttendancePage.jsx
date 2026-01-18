/**
 * Event Attendance Management Page
 */
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { attendanceAPI, eventsAPI } from '../../api/axios';
import { Calendar, Users, Check, X, Save, ArrowLeft, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function EventAttendancePage() {
    const { eventId } = useParams();
    const [event, setEvent] = useState(null);
    const [dates, setDates] = useState([]);
    const [selectedDate, setSelectedDate] = useState(null);
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadEventData();
    }, [eventId]);

    useEffect(() => {
        if (selectedDate) {
            loadAttendance(selectedDate);
        }
    }, [selectedDate]);

    const loadEventData = async () => {
        try {
            const [eventRes, datesRes] = await Promise.all([
                eventsAPI.getOne(eventId),
                attendanceAPI.getDates(eventId)
            ]);
            setEvent(eventRes.data);
            setDates(datesRes.data.dates);
            if (datesRes.data.dates.length > 0) {
                setSelectedDate(datesRes.data.dates[0]);
            }
        } catch (err) {
            toast.error('Failed to load event data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const loadAttendance = async (date) => {
        try {
            const res = await attendanceAPI.get(eventId, date);
            setAttendance(res.data);
        } catch (err) {
            console.error('Failed to load attendance:', err);
            setAttendance([]);
        }
    };

    const toggleStatus = (usn, newStatus) => {
        setAttendance(prev => prev.map(record =>
            record.usn === usn
                ? { ...record, status: record.status === newStatus ? null : newStatus }
                : record
        ));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const records = attendance.map(a => ({
                usn: a.usn,
                student_name: a.student_name,
                status: a.status
            }));

            await attendanceAPI.save(eventId, {
                attendance_date: selectedDate,
                records
            });
            toast.success('Attendance saved successfully!');
        } catch (err) {
            toast.error('Failed to save attendance');
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center p-12"><div className="loader"></div></div>;
    }

    if (!event) {
        return <div className="text-center text-gray-400 p-12">Event not found</div>;
    }

    const presentCount = attendance.filter(a => a.status === 'present').length;
    const absentCount = attendance.filter(a => a.status === 'absent').length;

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <Link to="/admin/events" className="text-indigo-400 hover:text-indigo-300 flex items-center gap-2 mb-2">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Events
                    </Link>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Calendar className="w-8 h-8 text-indigo-500" />
                        {event.name} - Attendance
                    </h1>
                    <p className="text-gray-400 mt-1">{event.start_date} to {event.end_date}</p>
                </div>

                <button
                    onClick={handleSave}
                    disabled={saving || attendance.length === 0}
                    className="btn btn-primary flex items-center gap-2"
                >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save Attendance'}
                </button>
            </div>

            {/* Date Selector */}
            <div className="card p-4">
                <label className="text-sm font-semibold text-slate-300 mb-3 block">Select Date</label>
                <div className="flex flex-wrap gap-2">
                    {dates.map(date => (
                        <button
                            key={date}
                            onClick={() => setSelectedDate(date)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedDate === date
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                }`}
                        >
                            {new Date(date + 'T00:00:00').toLocaleDateString('en-IN', {
                                weekday: 'short',
                                day: 'numeric',
                                month: 'short'
                            })}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="card p-4 text-center">
                    <Users className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-white">{attendance.length}</p>
                    <p className="text-sm text-gray-400">Total</p>
                </div>
                <div className="card p-4 text-center">
                    <Check className="w-6 h-6 text-green-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-green-400">{presentCount}</p>
                    <p className="text-sm text-gray-400">Present</p>
                </div>
                <div className="card p-4 text-center">
                    <X className="w-6 h-6 text-red-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-red-400">{absentCount}</p>
                    <p className="text-sm text-gray-400">Absent</p>
                </div>
            </div>

            {/* Attendance Table */}
            {attendance.length > 0 ? (
                <div className="card overflow-hidden">
                    <table>
                        <thead>
                            <tr>
                                <th>USN</th>
                                <th>Student Name</th>
                                <th className="text-center">Status</th>
                                <th className="text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {attendance.map(record => (
                                <tr key={record.usn}>
                                    <td className="font-mono text-indigo-400">{record.usn}</td>
                                    <td className="text-white">{record.student_name}</td>
                                    <td className="text-center">
                                        {record.status === 'present' && (
                                            <span className="badge badge-selected">Present</span>
                                        )}
                                        {record.status === 'absent' && (
                                            <span className="badge badge-dropped">Absent</span>
                                        )}
                                        {!record.status && (
                                            <span className="text-gray-500 text-sm">Not marked</span>
                                        )}
                                    </td>
                                    <td className="text-center">
                                        <div className="flex justify-center gap-2">
                                            <button
                                                onClick={() => toggleStatus(record.usn, 'present')}
                                                className={`p-2 rounded-lg transition-all ${record.status === 'present'
                                                    ? 'bg-green-600 text-white'
                                                    : 'bg-slate-700 text-slate-400 hover:bg-green-600/20 hover:text-green-400'
                                                    }`}
                                                title="Mark Present"
                                            >
                                                <Check className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => toggleStatus(record.usn, 'absent')}
                                                className={`p-2 rounded-lg transition-all ${record.status === 'absent'
                                                    ? 'bg-red-600 text-white'
                                                    : 'bg-slate-700 text-slate-400 hover:bg-red-600/20 hover:text-red-400'
                                                    }`}
                                                title="Mark Absent"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="card p-12 text-center">
                    <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No approved participants for this event</p>
                    <p className="text-sm text-gray-500 mt-2">Approve participants first from the Events page</p>
                </div>
            )}
        </div>
    );
}
