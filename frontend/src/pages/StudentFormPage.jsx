import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { submissionsAPI } from '../api/axios';
import {
    Trophy, User, BookOpen, Phone, CalendarDays,
    Upload, Camera, PenTool, Send, Loader2, CheckCircle,
    School
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const initialFormData = {
    // Event Info
    game_sport_competition: '',
    organizing_institution: '',
    date_of_activity: '',
    year_of_activity: new Date().getFullYear().toString(),

    // Student Info
    student_name: '',
    parent_name: '',
    semester: '',
    branch: '',
    usn: '',
    date_of_birth: '',

    // Contact Info
    blood_group: '',
    contact_address: '',
    phone: '',
    mother_name: '',

    // Academic Info
    course_name: '',
    passing_year_puc: '',
    date_first_admission_course: '',
    date_first_admission_class: '',

    // Previous Participation
    previous_game: '',
    previous_years: '',

    // Uploads
    photo_base64: '',
    signature_base64: '',
};

const branches = [
    'Computer Science', 'Information Science', 'Electronics & Communication',
    'Electrical & Electronics', 'Mechanical', 'Civil', 'Chemical',
    'Biotechnology', 'Industrial Engineering', 'Aerospace'
];

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const semesters = ['1', '2', '3', '4', '5', '6', '7', '8'];

export default function StudentFormPage() {
    const [formData, setFormData] = useState(initialFormData);
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const photoRef = useRef(null);
    const signatureRef = useRef(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = async (e, field) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            toast.error('File size must be less than 2MB');
            return;
        }

        // Convert to base64
        const reader = new FileReader();
        reader.onloadend = () => {
            setFormData(prev => ({ ...prev, [field]: reader.result }));
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await submissionsAPI.create(formData);
            setSubmitted(true);
            toast.success('Form submitted successfully!');
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Submission failed');
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
                <Toaster position="top-right" />
                <div className="card p-12 text-center max-w-md animate-fadeIn">
                    <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-10 h-10 text-emerald-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-3">Submission Received!</h2>
                    <p className="text-gray-400 mb-8">
                        Your form has been submitted successfully. The admin will review and approve your registration.
                    </p>
                    <button
                        onClick={() => {
                            setFormData(initialFormData);
                            setSubmitted(false);
                        }}
                        className="btn btn-primary"
                    >
                        Submit Another Form
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-950 py-8 px-4">
            <Toaster position="top-right" />

            {/* Header */}
            <div className="max-w-4xl mx-auto mb-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-amber-500 rounded-xl flex items-center justify-center">
                            <Trophy className="w-8 h-8 text-gray-900" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">Player Registration</h1>
                            <p className="text-gray-500">Inter-Collegiate Sports Activities</p>
                        </div>
                    </div>
                    <Link
                        to="/login"
                        className="text-amber-400 hover:text-amber-300 text-sm font-medium"
                    >
                        Admin Login →
                    </Link>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
                {/* Event Information */}
                <section className="form-section">
                    <h2 className="form-section-title flex items-center gap-2">
                        <CalendarDays className="w-5 h-5" />
                        Event Information
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="form-label">Game/Sport/Competition *</label>
                            <input
                                type="text"
                                name="game_sport_competition"
                                value={formData.game_sport_competition}
                                onChange={handleChange}
                                placeholder="e.g., Basketball, Cricket, Athletics"
                                required
                                className="form-input"
                            />
                        </div>
                        <div>
                            <label className="form-label">Organizing Institution *</label>
                            <input
                                type="text"
                                name="organizing_institution"
                                value={formData.organizing_institution}
                                onChange={handleChange}
                                placeholder="Institution name"
                                required
                                className="form-input"
                            />
                        </div>
                        <div>
                            <label className="form-label">Date of Activity *</label>
                            <input
                                type="date"
                                name="date_of_activity"
                                value={formData.date_of_activity}
                                onChange={handleChange}
                                required
                                className="form-input"
                            />
                        </div>
                        <div>
                            <label className="form-label">Year *</label>
                            <input
                                type="text"
                                name="year_of_activity"
                                value={formData.year_of_activity}
                                onChange={handleChange}
                                required
                                className="form-input"
                            />
                        </div>
                    </div>
                </section>

                {/* Personal Information */}
                <section className="form-section">
                    <h2 className="form-section-title flex items-center gap-2">
                        <User className="w-5 h-5" />
                        Personal Information
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="form-label">Student Name *</label>
                            <input
                                type="text"
                                name="student_name"
                                value={formData.student_name}
                                onChange={handleChange}
                                placeholder="Full name"
                                required
                                className="form-input"
                            />
                        </div>
                        <div>
                            <label className="form-label">S/o, D/o (Parent Name) *</label>
                            <input
                                type="text"
                                name="parent_name"
                                value={formData.parent_name}
                                onChange={handleChange}
                                placeholder="Father's/Mother's name"
                                required
                                className="form-input"
                            />
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
                                <option value="">Select blood group</option>
                                {bloodGroups.map(bg => (
                                    <option key={bg} value={bg}>{bg}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="form-label">Mother's Name *</label>
                            <input
                                type="text"
                                name="mother_name"
                                value={formData.mother_name}
                                onChange={handleChange}
                                placeholder="Mother's name"
                                required
                                className="form-input"
                            />
                        </div>
                    </div>
                </section>

                {/* Academic Information */}
                <section className="form-section">
                    <h2 className="form-section-title flex items-center gap-2">
                        <BookOpen className="w-5 h-5" />
                        Academic Information
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="form-label">Semester *</label>
                            <select
                                name="semester"
                                value={formData.semester}
                                onChange={handleChange}
                                required
                                className="form-input"
                            >
                                <option value="">Select semester</option>
                                {semesters.map(sem => (
                                    <option key={sem} value={sem}>Semester {sem}</option>
                                ))}
                            </select>
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
                                <option value="">Select branch</option>
                                {branches.map(branch => (
                                    <option key={branch} value={branch}>{branch}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="form-label">USN (University Seat Number) *</label>
                            <input
                                type="text"
                                name="usn"
                                value={formData.usn}
                                onChange={handleChange}
                                placeholder="e.g., 1RV20CS001"
                                required
                                className="form-input uppercase"
                            />
                        </div>
                        <div>
                            <label className="form-label">Course Name *</label>
                            <input
                                type="text"
                                name="course_name"
                                value={formData.course_name}
                                onChange={handleChange}
                                placeholder="e.g., B.E., B.Tech"
                                required
                                className="form-input"
                            />
                        </div>
                        <div>
                            <label className="form-label">Passing Year of 10+2/PUC/Diploma *</label>
                            <input
                                type="text"
                                name="passing_year_puc"
                                value={formData.passing_year_puc}
                                onChange={handleChange}
                                placeholder="e.g., 2020"
                                required
                                className="form-input"
                            />
                        </div>
                        <div>
                            <label className="form-label">Date of First Admission (Present Course) *</label>
                            <input
                                type="date"
                                name="date_first_admission_course"
                                value={formData.date_first_admission_course}
                                onChange={handleChange}
                                required
                                className="form-input"
                            />
                        </div>
                        <div>
                            <label className="form-label">Date of First Admission (Present Class/Sem) *</label>
                            <input
                                type="date"
                                name="date_first_admission_class"
                                value={formData.date_first_admission_class}
                                onChange={handleChange}
                                required
                                className="form-input"
                            />
                        </div>
                    </div>
                </section>

                {/* Contact Information */}
                <section className="form-section">
                    <h2 className="form-section-title flex items-center gap-2">
                        <Phone className="w-5 h-5" />
                        Contact Information
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="form-label">Phone/Cell Number *</label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="10-digit mobile number"
                                required
                                className="form-input"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="form-label">Contact Address *</label>
                            <textarea
                                name="contact_address"
                                value={formData.contact_address}
                                onChange={handleChange}
                                placeholder="Complete address"
                                required
                                rows={3}
                                className="form-input"
                            />
                        </div>
                    </div>
                </section>

                {/* Previous Participation */}
                <section className="form-section">
                    <h2 className="form-section-title flex items-center gap-2">
                        <School className="w-5 h-5" />
                        Previous Participation (if any)
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="form-label">Previous Game</label>
                            <input
                                type="text"
                                name="previous_game"
                                value={formData.previous_game}
                                onChange={handleChange}
                                placeholder="Game participated previously"
                                className="form-input"
                            />
                        </div>
                        <div>
                            <label className="form-label">Years of Participation</label>
                            <input
                                type="text"
                                name="previous_years"
                                value={formData.previous_years}
                                onChange={handleChange}
                                placeholder="e.g., 2022, 2023"
                                className="form-input"
                            />
                        </div>
                    </div>
                </section>

                {/* Uploads */}
                <section className="form-section">
                    <h2 className="form-section-title flex items-center gap-2">
                        <Upload className="w-5 h-5" />
                        Photo & Signature
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Photo Upload */}
                        <div>
                            <label className="form-label">Student Photo *</label>
                            <div
                                onClick={() => photoRef.current?.click()}
                                className="border-2 border-dashed border-gray-700 rounded-xl p-6 text-center cursor-pointer hover:border-amber-500/50 transition-colors"
                            >
                                {formData.photo_base64 ? (
                                    <img
                                        src={formData.photo_base64}
                                        alt="Student"
                                        className="w-32 h-40 object-cover mx-auto rounded-lg"
                                    />
                                ) : (
                                    <div className="py-4">
                                        <Camera className="w-10 h-10 text-gray-600 mx-auto mb-2" />
                                        <p className="text-gray-500 text-sm">Click to upload photo</p>
                                        <p className="text-gray-600 text-xs mt-1">Max 2MB, JPG/PNG</p>
                                    </div>
                                )}
                            </div>
                            <input
                                ref={photoRef}
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleFileChange(e, 'photo_base64')}
                                className="hidden"
                            />
                        </div>

                        {/* Signature Upload */}
                        <div>
                            <label className="form-label">Signature *</label>
                            <div
                                onClick={() => signatureRef.current?.click()}
                                className="border-2 border-dashed border-gray-700 rounded-xl p-6 text-center cursor-pointer hover:border-amber-500/50 transition-colors"
                            >
                                {formData.signature_base64 ? (
                                    <img
                                        src={formData.signature_base64}
                                        alt="Signature"
                                        className="h-20 mx-auto"
                                    />
                                ) : (
                                    <div className="py-4">
                                        <PenTool className="w-10 h-10 text-gray-600 mx-auto mb-2" />
                                        <p className="text-gray-500 text-sm">Click to upload signature</p>
                                        <p className="text-gray-600 text-xs mt-1">Max 2MB, JPG/PNG</p>
                                    </div>
                                )}
                            </div>
                            <input
                                ref={signatureRef}
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleFileChange(e, 'signature_base64')}
                                className="hidden"
                            />
                        </div>
                    </div>
                </section>

                {/* Submit Button */}
                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-primary px-8 py-3 text-lg flex items-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Submitting...
                            </>
                        ) : (
                            <>
                                <Send className="w-5 h-5" />
                                Submit Form
                            </>
                        )}
                    </button>
                </div>
            </form>

            {/* Footer */}
            <footer className="max-w-4xl mx-auto mt-12 text-center text-gray-600 text-sm">
                <p>RV College of Engineering - Physical Education Department</p>
            </footer>
        </div>
    );
}
