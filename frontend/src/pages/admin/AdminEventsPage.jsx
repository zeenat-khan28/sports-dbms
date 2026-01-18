/**
 * Admin Events Management Page
 */
import { useState, useEffect } from 'react';
import { eventsAPI, participationAPI, exportAPI } from '../../api/axios';
import { Link } from 'react-router-dom';
import { Calendar, Plus, MapPin, Users, Eye, Check, X, Download, Trash2, ClipboardCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminEventsPage() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [loadingParticipants, setLoadingParticipants] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        location: '',
        start_date: '',
        end_date: '',
        description: ''
    });

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const res = await eventsAPI.getAll();
            setEvents(res.data);
        } catch (err) {
            toast.error('Failed to load events');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await eventsAPI.create(formData);
            toast.success('Event created!');
            setShowCreate(false);
            setFormData({ name: '', location: '', start_date: '', end_date: '', description: '' });
            fetchEvents();
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to create');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this event?')) return;
        try {
            await eventsAPI.delete(id);
            toast.success('Event deleted');
            fetchEvents();
        } catch (err) {
            toast.error('Failed to delete');
        }
    };

    const viewParticipants = async (event) => {
        setSelectedEvent(event);
        setLoadingParticipants(true);
        try {
            const res = await participationAPI.getByEvent(event.id);
            setParticipants(res.data);
        } catch (err) {
            toast.error('Failed to load participants');
        } finally {
            setLoadingParticipants(false);
        }
    };

    const updateParticipant = async (id, status) => {
        try {
            await participationAPI.updateStatus(id, { status });
            toast.success(`Player ${status}!`);
            viewParticipants(selectedEvent);
        } catch (err) {
            toast.error('Failed to update');
        }
    };

    const exportParticipants = async (eventId) => {
        try {
            const res = await exportAPI.eventParticipants(eventId);
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `event_${eventId}_participants.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            toast.error('Export failed');
        }
    };

    if (loading) {
        return <div className="flex justify-center p-12"><div className="loader"></div></div>;
    }

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Calendar className="w-8 h-8 text-indigo-500" />
                        Events Management
                    </h1>
                    <p className="text-gray-400 mt-1">Create and manage sports events</p>
                </div>
                <button onClick={() => setShowCreate(true)} className="btn btn-primary flex items-center gap-2">
                    <Plus className="w-4 h.4" />
                    New Event
                </button>
            </div>

            {/* Create Modal */}
            {showCreate && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="card p-6 max-w-lg w-full animate-scaleIn">
                        <h2 className="text-xl font-bold text-white mb-4">Create Event</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="form-label">Event Name *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    required
                                    className="form-input"
                                />
                            </div>
                            <div>
                                <label className="form-label">Location</label>
                                <input
                                    type="text"
                                    value={formData.location}
                                    onChange={e => setFormData(prev => ({ ...prev, location: e.target.value }))}
                                    className="form-input"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="form-label">Start Date *</label>
                                    <input
                                        type="date"
                                        value={formData.start_date}
                                        onChange={e => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                                        required
                                        className="form-input"
                                    />
                                </div>
                                <div>
                                    <label className="form-label">End Date *</label>
                                    <input
                                        type="date"
                                        value={formData.end_date}
                                        onChange={e => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                                        required
                                        className="form-input"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="form-label">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    rows={3}
                                    className="form-input"
                                />
                            </div>
                            <div className="flex gap-3">
                                <button type="submit" className="btn btn-primary flex-1">Create</button>
                                <button type="button" onClick={() => setShowCreate(false)} className="btn btn-secondary">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Participants Modal */}
            {selectedEvent && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="card p-6 max-w-3xl w-full max-h-[80vh] overflow-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-white">{selectedEvent.name} - Participants</h2>
                            <div className="flex gap-2">
                                <button onClick={() => exportParticipants(selectedEvent.id)} className="btn btn-secondary flex items-center gap-1">
                                    <Download className="w-4 h-4" />
                                    Export
                                </button>
                                <button onClick={() => setSelectedEvent(null)} className="btn btn-secondary">Close</button>
                            </div>
                        </div>
                        {loadingParticipants ? (
                            <div className="flex justify-center p-8"><div className="loader"></div></div>
                        ) : participants.length > 0 ? (
                            <table>
                                <thead>
                                    <tr>
                                        <th>USN</th>
                                        <th>Name</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {participants.map(p => (
                                        <tr key={p.id}>
                                            <td className="font-mono text-indigo-400">{p.usn}</td>
                                            <td className="text-white">{p.student_name}</td>
                                            <td><span className={`badge badge-${p.status}`}>{p.status}</span></td>
                                            <td>
                                                {p.status === 'pending' && (
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => updateParticipant(p.id, 'selected')}
                                                            className="btn btn-success text-xs px-2 py-1"
                                                        >
                                                            <Check className="w-3 h-3" />
                                                        </button>
                                                        <button
                                                            onClick={() => updateParticipant(p.id, 'dropped')}
                                                            className="btn btn-danger text-xs px-2 py-1"
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                )}
                                                {p.blockchain_hash && (
                                                    <span className="text-xs text-gray-500 font-mono" title={p.blockchain_hash}>
                                                        🔗 {p.blockchain_hash.slice(0, 8)}...
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p className="text-gray-400 text-center py-8">No participation requests yet</p>
                        )}
                    </div>
                </div>
            )}

            {/* Events List */}
            {events.length > 0 ? (
                <div className="grid gap-6">
                    {events.map(event => (
                        <div key={event.id} className="card p-6 group">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors">
                                        {event.name}
                                    </h3>
                                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-400">
                                        <span className="flex items-center gap-1">
                                            <MapPin className="w-4 h-4" />
                                            {event.location || 'TBD'}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-4 h-4" />
                                            {event.start_date} - {event.end_date}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Users className="w-4 h-4" />
                                            {event.participant_count} selected
                                        </span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => viewParticipants(event)} className="btn btn-secondary flex items-center gap-1">
                                        <Eye className="w-4 h-4" />
                                        View
                                    </button>
                                    <Link to={`/admin/events/${event.id}/attendance`} className="btn btn-primary flex items-center gap-1">
                                        <ClipboardCheck className="w-4 h-4" />
                                        Attendance
                                    </Link>
                                    <button onClick={() => handleDelete(event.id)} className="btn btn-danger flex items-center gap-1">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="card p-12 text-center">
                    <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No events created yet</p>
                </div>
            )}
        </div>
    );
}
