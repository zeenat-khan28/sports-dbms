import { useState } from 'react';
import { emailAPI, submissionsAPI } from '../../api/axios';
import { Mail, CheckCircle, AlertCircle, Users, RefreshCw, Send, Eye, Search, X } from 'lucide-react';
import toast from 'react-hot-toast';

const BRANCHES = ["CSE", "ISE", "ECE", "EEE", "ME", "CV", "AI&ML", "BT", "CH"];
const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

export default function AdminEmailPage() {
    const [filters, setFilters] = useState({
        semester: [],
        branch: []
    });
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('Dear {{student_name}},\n\n\n\nRegards,\nRVCE Sports Dept');
    const [loading, setLoading] = useState(false);
    const [previewData, setPreviewData] = useState(null);
    const [showConfirm, setShowConfirm] = useState(false);

    // Student Search State
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedStudents, setSelectedStudents] = useState([]);

    const toggleFilter = (type, value) => {
        setFilters(prev => {
            const current = prev[type];
            const updated = current.includes(value)
                ? current.filter(item => item !== value)
                : [...current, value];
            return { ...prev, [type]: updated };
        });
        setPreviewData(null); // Reset preview on filter change
    };

    const handleSearch = async (e) => {
        const term = e.target.value;
        setSearchTerm(term);
        if (term.length < 2) {
            setSearchResults([]);
            return;
        }

        try {
            const res = await submissionsAPI.getAll({
                search: term,
                status: 'approved',
                per_page: 5
            });
            setSearchResults(res.data.submissions);
        } catch (err) {
            console.error(err);
        }
    };

    const addStudent = (student) => {
        if (!selectedStudents.find(s => s.usn === student.usn)) {
            setSelectedStudents(prev => [...prev, student]);
            setPreviewData(null);
        }
        setSearchTerm('');
        setSearchResults([]);
    };

    const removeStudent = (usn) => {
        setSelectedStudents(prev => prev.filter(s => s.usn !== usn));
        setPreviewData(null);
    };

    const handlePreview = async () => {
        setLoading(true);
        try {
            const res = await emailAPI.send({
                filters: {
                    semester: filters.semester.length > 0 ? filters.semester : null,
                    branch: filters.branch.length > 0 ? filters.branch : null,
                    usn: selectedStudents.length > 0 ? selectedStudents.map(s => s.usn) : null
                },
                subject,
                body,
                dry_run: true
            });
            setPreviewData(res.data);
            if (res.data.recipient_count === 0) {
                toast.error("No recipients found matching these filters.");
            } else {
                toast.success(`Found ${res.data.recipient_count} recipients.`);
            }
        } catch (err) {
            toast.error("Failed to calculate recipients.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async () => {
        setLoading(true);
        try {
            const res = await emailAPI.send({
                filters: {
                    semester: filters.semester.length > 0 ? filters.semester : null,
                    branch: filters.branch.length > 0 ? filters.branch : null,
                    usn: selectedStudents.length > 0 ? selectedStudents.map(s => s.usn) : null
                },
                subject,
                body,
                dry_run: false
            });
            toast.success(`Successfully queued ${res.data.success_count} emails.`);
            setShowConfirm(false);
            setPreviewData(null);
            setSubject('');
            setFilters({ semester: [], branch: [] });
            setSelectedStudents([]);
            setBody('Dear {{student_name}},\n\n\n\nRegards,\nRVCE Sports Dept');
        } catch (err) {
            toast.error("Failed to send emails.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-fadeIn pb-20">
            {/* Page Header */}
            <div className="flex justify-between items-center bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Mail className="w-6 h-6 text-blue-400" />
                        Email Center
                    </h1>
                    <p className="text-slate-400 mt-1">Send official notifications to students.</p>
                </div>
                <div className="text-right">
                    <p className="text-xs text-slate-500 uppercase tracking-widest">System Status</p>
                    <p className="text-green-400 text-sm font-semibold flex items-center justify-end gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        SMTP Ready
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Filters */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
                        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Users className="w-5 h-5 text-purple-400" />
                            Target Audience
                        </h2>

                        {/* Semester Filter */}
                        <div className="mb-6">
                            <label className="text-sm font-semibold text-slate-300 mb-2 block uppercase tracking-wider">Semester</label>
                            <div className="grid grid-cols-4 gap-2">
                                {SEMESTERS.map(sem => (
                                    <button
                                        key={sem}
                                        onClick={() => toggleFilter('semester', sem)}
                                        className={`py-2 rounded-md text-sm font-medium transition-all ${filters.semester.includes(sem)
                                            ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-500/50'
                                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                            }`}
                                    >
                                        {sem}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Branch Filter */}
                        <div className="mb-6">
                            <label className="text-sm font-semibold text-slate-300 mb-2 block uppercase tracking-wider">Branch</label>
                            <div className="flex flex-wrap gap-2">
                                {BRANCHES.map(branch => (
                                    <button
                                        key={branch}
                                        onClick={() => toggleFilter('branch', branch)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${filters.branch.includes(branch)
                                            ? 'bg-purple-600/20 text-purple-300 border-purple-500'
                                            : 'bg-slate-700/50 text-slate-400 border-slate-600 hover:border-slate-500'
                                            }`}
                                    >
                                        {branch}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Specific Student Filter */}
                        <div>
                            <label className="text-sm font-semibold text-slate-300 mb-2 block uppercase tracking-wider">Specific Students</label>
                            <div className="relative mb-3">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Search className="h-4 w-4 text-slate-500" />
                                </div>
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={handleSearch}
                                    placeholder="Search by Name or USN..."
                                    className="w-full bg-slate-900 border border-slate-600 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                                />
                                {searchResults.length > 0 && (
                                    <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                                        {searchResults.map(student => (
                                            <button
                                                key={student.id}
                                                onClick={() => addStudent(student)}
                                                className="w-full text-left px-4 py-2 hover:bg-slate-700 transition-colors border-b border-slate-700 last:border-0"
                                            >
                                                <div className="text-sm font-medium text-white">{student.student_name}</div>
                                                <div className="text-xs text-slate-400">{student.usn} • {student.branch}</div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Selected Students Tags */}
                            {selectedStudents.length > 0 && (
                                <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50 max-h-40 overflow-y-auto space-y-2">
                                    {selectedStudents.map(student => (
                                        <div key={student.usn} className="flex items-center justify-between bg-slate-800 border border-slate-600 rounded px-2 py-1.5">
                                            <div className="min-w-0">
                                                <div className="text-xs font-semibold text-slate-200 truncate">{student.student_name}</div>
                                                <div className="text-[10px] text-slate-400">{student.usn}</div>
                                            </div>
                                            <button
                                                onClick={() => removeStudent(student.usn)}
                                                className="text-slate-500 hover:text-red-400 p-1"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="mt-6 pt-6 border-t border-slate-700">
                            <p className="text-xs text-slate-500 mb-2">Note: Only approved students will receive emails.</p>
                            {filters.semester.length === 0 && filters.branch.length === 0 && selectedStudents.length === 0 && (
                                <div className="bg-amber-900/20 border border-amber-900/50 text-amber-200 p-3 rounded-lg text-xs flex gap-2">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    Selecting no filters will target ALL students.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Composer */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
                        <label className="block text-sm font-semibold text-slate-300 mb-2">Subject</label>
                        <input
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="Important Announcement: Upcoming Sports Meet"
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-6 font-medium"
                        />

                        <label className="block text-sm font-semibold text-slate-300 mb-2">Message Body</label>
                        <textarea
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            rows={12}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-4 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm leading-relaxed"
                        />

                        <div className="mt-2 flex gap-2 text-xs text-slate-500">
                            Available variables:
                            <span className="text-blue-400 bg-blue-900/20 px-1 rounded">{'{{student_name}}'}</span>
                            <span className="text-blue-400 bg-blue-900/20 px-1 rounded">{'{{usn}}'}</span>
                            <span className="text-blue-400 bg-blue-900/20 px-1 rounded">{'{{branch}}'}</span>
                            <span className="text-blue-400 bg-blue-900/20 px-1 rounded">{'{{semester}}'}</span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            {previewData ? (
                                <div className="text-slate-300 flex items-center gap-2">
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                    <span>Targeting <strong className="text-white">{previewData.recipient_count}</strong> students</span>
                                </div>
                            ) : (
                                <span className="text-slate-500 text-sm">Preview to calculate recipients.</span>
                            )}
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={handlePreview}
                                disabled={loading}
                                className="px-6 py-2.5 rounded-lg bg-slate-700 text-white font-medium hover:bg-slate-600 transition-colors flex items-center gap-2 disabled:opacity-50"
                            >
                                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                                Calculate Count
                            </button>
                            <button
                                onClick={() => setShowConfirm(true)}
                                disabled={!subject || !body || loading || (previewData && previewData.recipient_count === 0)}
                                className="px-6 py-2.5 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Send className="w-4 h-4" />
                                Send Emails
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Confirmation Modal */}
            {showConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-slate-800 rounded-2xl p-8 max-w-md w-full border border-slate-600 shadow-2xl">
                        <h3 className="text-xl font-bold text-white mb-4">Confirm Dispatch</h3>

                        <div className="bg-slate-900 rounded-lg p-4 mb-6 border border-slate-700">
                            <div className="flex justify-between mb-2">
                                <span className="text-slate-400">Recipients:</span>
                                <span className="text-white font-bold">{previewData?.recipient_count || '?'}</span>
                            </div>
                            <div className="flex justify-between mb-2">
                                <span className="text-slate-400">Subject:</span>
                                <span className="text-white truncate max-w-[200px]">{subject}</span>
                            </div>
                            <div className="h-px bg-slate-700 my-3"></div>
                            <p className="text-xs text-amber-500 flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                This action cannot be undone. All selected students will receive this email immediately via SMTP.
                            </p>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowConfirm(false)}
                                className="flex-1 py-3 rounded-xl bg-slate-700 text-white font-semibold hover:bg-slate-600 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSend}
                                disabled={loading}
                                className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition-colors shadow-lg"
                            >
                                {loading ? 'Sending...' : 'Confirm & Send'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
