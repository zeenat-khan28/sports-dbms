/**
 * Student Registration Page
 */
import { useState, useEffect } from 'react';
import { useStudentAuth } from '../../context/StudentAuthContext';
import { submissionsAPI } from '../../api/axios';
import { User, FileText, CheckCircle, AlertCircle, LogOut } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const branches = ['CSE', 'ISE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'CHEM', 'BIOTECH', 'AIML', 'AIDS'];
const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

export default function StudentRegisterPage() {
    const { student, token, loading, login, logout, isAuthenticated } = useStudentAuth();
    const [existingSubmission, setExistingSubmission] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        student_name: '',
        usn: '',
        branch: '',
        semester: 1,
        date_of_birth: '',
        contact_address: '',
        blood_group: '',
        phone: '',
        parent_name: '',
        mother_name: '',
        photo_base64: '',
        signature_base64: ''
    });

    useEffect(() => {
        if (isAuthenticated && token) {
            checkExistingSubmission();
        }
    }, [isAuthenticated, token]);

    const checkExistingSubmission = async () => {
        try {
            const res = await submissionsAPI.getMy(token);
            if (res.data) {
                setExistingSubmission(res.data);
            }
        } catch (err) {
            console.log('No existing submission');
        }
    };

    const handleLogin = async () => {
        try {
            await login();
            toast.success('Logged in successfully!');
        } catch (err) {
            toast.error(err.message || 'Login failed');
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e, field) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                toast.error('File size must be less than 2MB');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, [field]: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            await submissionsAPI.create(formData, token);
            toast.success('Registration submitted successfully!');
            checkExistingSubmission();
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Submission failed');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="loader w-12 h-12"></div>
            </div>
        );
    }

    // Not logged in
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <Toaster position="top-right" />
                <div className="card p-8 max-w-md w-full text-center animate-fadeIn">
                    <div className="w-16 h-16 bg-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <User className="w-8 h-8 text-indigo-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Student Registration</h1>
                    <p className="text-gray-400 mb-6">
                        Login with your RVCE Google account to register for sports
                    </p>
                    <button
                        onClick={handleLogin}
                        className="btn btn-primary w-full flex items-center justify-center gap-2"
                    >
                        <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                        Login with @rvce.edu.in
                    </button>
                    <p className="text-xs text-gray-500 mt-4">
                        Only @rvce.edu.in emails are allowed
                    </p>
                </div>
            </div>
        );
    }

    // Already has submission
    if (existingSubmission) {
        // Redirect if approved (Auto-navigate to main app)
        if (existingSubmission.status === 'approved') {
            window.location.href = '/student/events';
            return null;
        }

        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <Toaster position="top-right" />
                <div className="card p-8 max-w-md w-full text-center animate-fadeIn">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 ${existingSubmission.status === 'rejected' ? 'bg-red-500/20' : 'bg-amber-500/20'
                        }`}>
                        {existingSubmission.status === 'rejected' ? (
                            <AlertCircle className="w-8 h-8 text-red-400" />
                        ) : (
                            <FileText className="w-8 h-8 text-amber-400" />
                        )}
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Registration Status</h1>
                    <p className="text-gray-400 mb-4">USN: {existingSubmission.usn}</p>
                    <span className={`badge badge-${existingSubmission.status}`}>
                        {existingSubmission.status}
                    </span>

                    {existingSubmission.status === 'rejected' && existingSubmission.rejection_reason && (
                        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                            <p className="text-sm text-red-300">Reason: {existingSubmission.rejection_reason}</p>
                        </div>
                    )}

                    <div className="mt-8 border-t border-white/10 pt-6">
                        <p className="text-sm text-gray-500 mb-4">
                            You will get access to the Events Portal once your registration is approved by the admin.
                        </p>
                        <button
                            onClick={logout}
                            className="btn btn-secondary w-full flex items-center justify-center gap-2"
                        >
                            <LogOut className="w-4 h-4" />
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Registration form
    return (
        <div className="min-h-screen py-12 px-4">
            <Toaster position="top-right" />
            <div className="max-w-2xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Student Registration</h1>
                        <p className="text-gray-400 mt-1">Welcome, {student?.name}</p>
                    </div>
                    <button onClick={logout} className="btn btn-secondary flex items-center gap-2">
                        <LogOut className="w-4 h-4" />
                        Logout
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="card p-8 space-y-6 animate-fadeIn">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="form-label">Full Name *</label>
                            <input
                                type="text"
                                name="student_name"
                                value={formData.student_name}
                                onChange={handleChange}
                                required
                                className="form-input"
                            />
                        </div>
                        <div>
                            <label className="form-label">USN *</label>
                            <input
                                type="text"
                                name="usn"
                                value={formData.usn}
                                onChange={handleChange}
                                required
                                placeholder="1RV21CS001"
                                className="form-input uppercase"
                            />
                        </div>
                        <div>
                            <label className="form-label">Branch *</label>
                            <select
                                name="branch"
                                value={formData.branch}
                                onChange={handleChange}
                                required
                                className="form-input"
                            >
                                <option value="">Select Branch</option>
                                {branches.map(b => <option key={b} value={b}>{b}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="form-label">Semester *</label>
                            <select
                                name="semester"
                                value={formData.semester}
                                onChange={handleChange}
                                required
                                className="form-input"
                            >
                                {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="form-label">Date of Birth *</label>
                            <input
                                type="date"
                                name="date_of_birth"
                                value={formData.date_of_birth}
                                onChange={handleChange}
                                required
                                className="form-input"
                            />
                        </div>
                        <div>
                            <label className="form-label">Blood Group *</label>
                            <select
                                name="blood_group"
                                value={formData.blood_group}
                                onChange={handleChange}
                                required
                                className="form-input"
                            >
                                <option value="">Select</option>
                                {bloodGroups.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="form-label">Phone Number *</label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                required
                                className="form-input"
                            />
                        </div>
                        <div>
                            <label className="form-label">Father's Name *</label>
                            <input
                                type="text"
                                name="parent_name"
                                value={formData.parent_name}
                                onChange={handleChange}
                                required
                                className="form-input"
                            />
                        </div>
                        <div>
                            <label className="form-label">Mother's Name *</label>
                            <input
                                type="text"
                                name="mother_name"
                                value={formData.mother_name}
                                onChange={handleChange}
                                required
                                className="form-input"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="form-label">Contact Address *</label>
                        <textarea
                            name="contact_address"
                            value={formData.contact_address}
                            onChange={handleChange}
                            required
                            rows={3}
                            className="form-input"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="form-label">Photo</label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleFileChange(e, 'photo_base64')}
                                className="form-input"
                            />
                        </div>
                        <div>
                            <label className="form-label">Signature</label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleFileChange(e, 'signature_base64')}
                                className="form-input"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="btn btn-primary w-full"
                    >
                        {submitting ? 'Submitting...' : 'Submit Registration'}
                    </button>
                </form>
            </div>
        </div>
    );
}
