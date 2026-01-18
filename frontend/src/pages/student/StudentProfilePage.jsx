import { useEffect, useState } from 'react';
import { useStudentAuth } from '../../context/StudentAuthContext';
import { submissionsAPI } from '../../api/axios';
import { Mail, Phone, MapPin, Heart, Share2, Award, Calendar, Home, BookOpen, Quote, Download } from 'lucide-react';

export default function StudentProfilePage() {
    const { token } = useStudentAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await submissionsAPI.getMy(token);
                setProfile(res.data);
            } catch (error) {
                console.error('Failed to load profile', error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [token]);

    if (loading) return <div className="flex justify-center py-20"><div className="loader"></div></div>;
    if (!profile) return <div className="text-center text-gray-400 py-20">Profile data unavailable</div>;

    return (
        <div className="max-w-5xl mx-auto py-8">
            <h1 className="text-2xl font-bold text-white mb-6">Student Profile</h1>

            {/* ID Card Section */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-xl overflow-hidden mb-8">
                {/* Decorative Header Line */}
                <div className="h-2 bg-gradient-to-r from-blue-600 to-indigo-600 w-full"></div>

                <div className="p-8">
                    <div className="flex flex-col md:flex-row gap-8 items-start">
                        {/* ID Photo */}
                        <div className="shrink-0 flex flex-col gap-4">
                            <div className="w-40 h-40 rounded-lg overflow-hidden border-4 border-slate-800 shadow-lg bg-slate-800">
                                {profile.photo_base64 ? (
                                    <img src={profile.photo_base64} alt="Student" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-600">
                                        <span className="text-5xl">🎓</span>
                                    </div>
                                )}
                            </div>
                            <div className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wide uppercase text-center border ${profile.status === 'approved'
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                }`}>
                                {profile.status}
                            </div>
                        </div>

                        {/* Basic Info */}
                        <div className="flex-1 w-full">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h2 className="text-3xl font-bold text-white tracking-tight mb-1">{profile.student_name}</h2>
                                    <p className="text-lg text-indigo-400 font-mono flex items-center gap-2">
                                        {profile.usn}
                                    </p>
                                </div>
                                <Award className="w-12 h-12 text-slate-800" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
                                            <BookOpen className="w-4 h-4 text-blue-400" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400 uppercase tracking-wider">Department</p>
                                            <p className="font-semibold text-slate-200">{profile.branch}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
                                            <Calendar className="w-4 h-4 text-purple-400" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400 uppercase tracking-wider">Current Semester</p>
                                            <p className="font-semibold text-slate-200">{profile.semester}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
                                            <Phone className="w-4 h-4 text-emerald-400" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400 uppercase tracking-wider">Contact</p>
                                            <p className="font-semibold text-slate-200">{profile.phone}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
                                            <Mail className="w-4 h-4 text-amber-400" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400 uppercase tracking-wider">Email</p>
                                            <p className="font-semibold text-slate-200 truncate">{profile.email}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Detailed Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Personal Information */}
                <div className="md:col-span-2">
                    <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 h-full">
                        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2 pb-4 border-b border-slate-800">
                            <Quote className="w-5 h-5 text-indigo-400" />
                            Personal Details
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Date of Birth</p>
                                <p className="text-slate-200 font-medium">
                                    {profile.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString() : 'N/A'}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Blood Group</p>
                                <p className="text-slate-200 font-medium flex items-center gap-2">
                                    <Heart className="w-3 h-3 text-red-500 fill-current" />
                                    {profile.blood_group}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Father's Name</p>
                                <p className="text-slate-200 font-medium">{profile.parent_name}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Mother's Name</p>
                                <p className="text-slate-200 font-medium">{profile.mother_name}</p>
                            </div>
                            <div className="sm:col-span-2">
                                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Permanent Address</p>
                                <p className="text-slate-200 font-medium flex items-start gap-2">
                                    <MapPin className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                                    {profile.contact_address}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Signature Card */}
                <div>
                    <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 h-full flex flex-col">
                        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2 pb-4 border-b border-slate-800">
                            <Share2 className="w-5 h-5 text-indigo-400" />
                            Signature
                        </h3>
                        <div className="flex-1 flex items-center justify-center p-6 bg-white rounded-lg border border-slate-200">
                            {profile.signature_base64 ? (
                                <img src={profile.signature_base64} alt="Signature" className="max-w-full max-h-32 object-contain" />
                            ) : (
                                <p className="text-slate-400 text-sm">No signature on file</p>
                            )}
                        </div>
                        <p className="text-[10px] text-center text-slate-500 mt-4 uppercase tracking-widest">
                            Authenticated Student Record
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
