import { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';

export default function EditSubmissionModal({ submission, onClose, onSave }) {
    const [formData, setFormData] = useState({
        student_name: '',
        usn: '',
        branch: '',
        semester: '',
        date_of_birth: '',
        blood_group: '',
        phone: '',
        parent_name: '',
        mother_name: '',
        contact_address: ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (submission) {
            setFormData({
                student_name: submission.student_name || '',
                usn: submission.usn || '',
                branch: submission.branch || '',
                semester: submission.semester || '',
                date_of_birth: submission.date_of_birth || '',
                blood_group: submission.blood_group || '',
                phone: submission.phone || '',
                parent_name: submission.parent_name || '',
                mother_name: submission.mother_name || '',
                contact_address: submission.contact_address || ''
            });
        }
    }, [submission]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave(submission.id, formData);
            onClose();
        } catch (error) {
            console.error("Save failed", error);
        } finally {
            setLoading(false);
        }
    };

    if (!submission) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="sticky top-0 bg-slate-900 p-6 border-b border-slate-700 flex justify-between items-center z-10">
                    <h2 className="text-xl font-bold text-white">Edit Student Details</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-400">Student Name</label>
                            <input
                                name="student_name"
                                value={formData.student_name}
                                onChange={handleChange}
                                className="w-full bg-slate-800 border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-400">USN</label>
                            <input
                                name="usn"
                                value={formData.usn}
                                onChange={handleChange}
                                className="w-full bg-slate-800 border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-400">Branch</label>
                            <input
                                name="branch"
                                value={formData.branch}
                                onChange={handleChange}
                                className="w-full bg-slate-800 border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-400">Semester</label>
                            <input
                                type="number"
                                name="semester"
                                value={formData.semester}
                                onChange={handleChange}
                                className="w-full bg-slate-800 border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-400">Date of Birth</label>
                            <input
                                type="date"
                                name="date_of_birth"
                                value={formData.date_of_birth}
                                onChange={handleChange}
                                className="w-full bg-slate-800 border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-400">Blood Group</label>
                            <input
                                name="blood_group"
                                value={formData.blood_group}
                                onChange={handleChange}
                                className="w-full bg-slate-800 border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-400">Phone</label>
                            <input
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                className="w-full bg-slate-800 border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-400">Father Name</label>
                            <input
                                name="parent_name"
                                value={formData.parent_name}
                                onChange={handleChange}
                                className="w-full bg-slate-800 border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-400">Mother Name</label>
                            <input
                                name="mother_name"
                                value={formData.mother_name}
                                onChange={handleChange}
                                className="w-full bg-slate-800 border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-400">Address</label>
                        <textarea
                            name="contact_address"
                            value={formData.contact_address}
                            onChange={handleChange}
                            rows={3}
                            className="w-full bg-slate-800 border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
