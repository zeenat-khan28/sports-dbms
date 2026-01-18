import { useState, useEffect } from 'react';
import { useStudentAuth } from '../../context/StudentAuthContext';
import { eventsAPI, participationAPI, submissionsAPI } from '../../api/axios';
import { Calendar, MapPin, Users, CheckCircle, Clock, AlertCircle, ArrowRight, Activity, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

export default function StudentEventsPage() {
    const { token, isAuthenticated } = useStudentAuth();
    const [events, setEvents] = useState([]);
    const [myParticipations, setMyParticipations] = useState([]);
    const [myRegistration, setMyRegistration] = useState(null);
    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
        if (isAuthenticated && token) {
            checkAccess();
        } else {
            setLoadingData(false);
        }
    }, [isAuthenticated, token]);

    const checkAccess = async () => {
        try {
            const regRes = await submissionsAPI.getMy(token);
            const registration = regRes.data;
            setMyRegistration(registration);

            // Redirect if not approved
            if (!registration || registration.status !== 'approved') {
                window.location.href = '/student/register';
                return;
            }

            // Load data only if approved
            const [eventsRes, partRes] = await Promise.all([
                eventsAPI.getAll({ upcoming_only: true }),
                participationAPI.getMy(token)
            ]);
            setEvents(eventsRes.data);
            setMyParticipations(partRes.data || []);

        } catch (err) {
            console.error('Failed to fetch data:', err);
        } finally {
            setLoadingData(false);
        }
    };

    const handleParticipate = async (eventId) => {
        if (!myRegistration || myRegistration.status !== 'approved') {
            toast.error('Your student registration must be approved first');
            return;
        }

        try {
            await participationAPI.submit({ event_id: eventId }, token);
            toast.success('Participation submitted!');
            // Refresh local data
            const partRes = await participationAPI.getMy(token);
            setMyParticipations(partRes.data || []);
            // Update event participant count locally
            setEvents(events.map(e =>
                e.id === eventId
                    ? { ...e, participant_count: (e.participant_count || 0) + 1 }
                    : e
            ));
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to submit');
        }
    };

    const getParticipationStatus = (eventId) => {
        const p = myParticipations.find(m => m.event_id === eventId);
        return p ? p.status : null;
    };

    if (loadingData) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="loader w-12 h-12"></div>
            </div>
        );
    }

    return (
        <div className="space-y-12">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-xl bg-slate-900 border border-slate-800 p-8 md:p-12 shadow-2xl">
                <div className="relative z-10">
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
                        Discover & Compete
                    </h1>
                    <p className="text-lg text-slate-400 max-w-2xl">
                        Join the most exciting sports events at RVCE. Showcase your talent, compete with the best, and make your mark.
                    </p>
                </div>
            </div>

            {/* My Participations */}
            {myParticipations.length > 0 && (
                <section>
                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                        <Activity className="w-6 h-6 text-emerald-400" />
                        My Activity
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {myParticipations.map(p => (
                            <div key={p.id} className="group relative bg-slate-900/50 backdrop-blur-sm border border-white/5 rounded-2xl p-6 hover:bg-white/5 transition-all duration-300">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-indigo-500/20 rounded-xl">
                                        <TrophyIcon status={p.status} />
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${p.status === 'selected' ? 'bg-green-500/20 text-green-400 border-green-500/20' :
                                        p.status === 'pending' ? 'bg-amber-500/20 text-amber-400 border-amber-500/20' :
                                            'bg-red-500/20 text-red-400 border-red-500/20'
                                        }`}>
                                        {p.status.toUpperCase()}
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">
                                    {p.event_name}
                                </h3>
                                <p className="text-sm text-slate-400">Application submitted</p>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Upcoming Events */}
            <section>
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Sparkles className="w-6 h-6 text-amber-400" />
                        Featured Events
                    </h2>
                    <span className="text-sm text-slate-400">{events.length} events upcoming</span>
                </div>

                {events.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {events.map((event) => {
                            const status = getParticipationStatus(event.id);
                            const isRegistered = !!status;

                            return (
                                <div key={event.id} className="group relative bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-indigo-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-900/20">
                                    <div className="p-6 md:p-8">
                                        <div className="flex justify-between items-start gap-4">
                                            <div>
                                                <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
                                                    {event.name}
                                                </h3>
                                                <div className="flex flex-wrap gap-4 text-sm text-slate-400 mb-6">
                                                    <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-lg">
                                                        <Calendar className="w-4 h-4 text-blue-400" />
                                                        {event.start_date}
                                                    </span>
                                                    <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-lg">
                                                        <MapPin className="w-4 h-4 text-purple-400" />
                                                        {event.location || 'Venue TBD'}
                                                    </span>
                                                    <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-lg">
                                                        <Users className="w-4 h-4 text-emerald-400" />
                                                        {event.participant_count} Applied
                                                    </span>
                                                </div>
                                            </div>
                                            {isRegistered && (
                                                <div className="absolute top-6 right-6">
                                                    <span className="flex h-3 w-3">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        <p className="text-slate-300 mb-8 line-clamp-2">
                                            {event.description || 'Join us for this exciting event. Compete, have fun, and showcase your skills!'}
                                        </p>

                                        <div className="flex items-center justify-between mt-auto">
                                            {status ? (
                                                <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium w-full justify-center border ${status === 'selected' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                                    'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                                    }`}>
                                                    {status === 'selected' ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                                                    {status === 'selected' ? 'Selected for Event' : 'Registration Pending'}
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => handleParticipate(event.id)}
                                                    className="w-full relative overflow-hidden group/btn bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
                                                >
                                                    <span className="relative z-10 flex items-center gap-2">
                                                        Register Now
                                                        <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                                    </span>
                                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-400 opacity-0 group-hover/btn:opacity-20 transition-opacity"></div>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-slate-900/30 rounded-3xl border border-white/5 border-dashed">
                        <Calendar className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">No Events Scheduled</h3>
                        <p className="text-slate-400">Check back later for upcoming sports events.</p>
                    </div>
                )}
            </section>
        </div>
    );
}

function TrophyIcon({ status }) {
    if (status === 'selected') return <CheckCircle className="w-6 h-6 text-green-400" />;
    if (status === 'dropped') return <AlertCircle className="w-6 h-6 text-red-400" />;
    return <Clock className="w-6 h-6 text-amber-400" />;
}
