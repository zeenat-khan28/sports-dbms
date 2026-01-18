import { useState, useEffect } from 'react';
import { submissionsAPI } from '../../api/axios';
import {
    XCircle, Search, Eye, Trash2, User,
    ChevronLeft, ChevronRight, AlertCircle, Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function RejectedPage() {
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const [selectedSubmission, setSelectedSubmission] = useState(null);
    const perPage = 10;

    useEffect(() => {
        fetchSubmissions();
    }, [page]);

    const fetchSubmissions = async () => {
        setLoading(true);
        try {
            const response = await submissionsAPI.getAll({
                status: 'rejected',
                page,
                per_page: perPage
            });
            setSubmissions(response.data.submissions);
            setTotal(response.data.total);
        } catch (error) {
            toast.error('Failed to load submissions');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to permanently delete this submission?')) return;

        setActionLoading(id);
        try {
            await submissionsAPI.delete(id);
            toast.success('Submission deleted');
            fetchSubmissions();
        } catch (error) {
            toast.error('Failed to delete submission');
        } finally {
            setActionLoading(null);
        }
    };

    const filteredSubmissions = submissions.filter(sub =>
        sub.student_name.toLowerCase().includes(search.toLowerCase()) ||
        sub.usn.toLowerCase().includes(search.toLowerCase())
    );

    const totalPages = Math.ceil(total / perPage);

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <XCircle className="w-8 h-8 text-red-400" />
                        Rejected Submissions
                    </h1>
                    <p className="text-gray-500 mt-1">{total} rejected submissions</p>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search..."
                        className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg w-full md:w-60"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="card overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="loader"></div>
                    </div>
                ) : filteredSubmissions.length > 0 ? (
                    <>
                        <div className="overflow-x-auto">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Student</th>
                                        <th>USN</th>
                                        <th>Sport</th>
                                        <th>Rejection Reason</th>
                                        <th>Rejected On</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredSubmissions.map((sub) => (
                                        <tr key={sub.id}>
                                            <td>
                                                <div className="flex items-center gap-3">
                                                    {sub.photo_base64 ? (
                                                        <img
                                                            src={sub.photo_base64}
                                                            alt=""
                                                            className="w-10 h-10 rounded-full object-cover opacity-60"
                                                        />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                                                            <User className="w-5 h-5 text-gray-500" />
                                                        </div>
                                                    )}
                                                    <span className="font-medium text-gray-400">{sub.student_name}</span>
                                                </div>
                                            </td>
                                            <td className="text-gray-500 font-mono">{sub.usn}</td>
                                            <td className="text-gray-500">{sub.game_sport_competition}</td>
                                            <td className="text-red-400 text-sm max-w-xs truncate">
                                                {sub.rejection_reason || 'No reason provided'}
                                            </td>
                                            <td className="text-gray-500 text-sm">
                                                {sub.reviewed_at
                                                    ? new Date(sub.reviewed_at).toLocaleDateString()
                                                    : '-'
                                                }
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => setSelectedSubmission(sub)}
                                                        className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                                                        title="View Details"
                                                    >
                                                        <Eye className="w-4 h-4 text-gray-400" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(sub.id)}
                                                        disabled={actionLoading === sub.id}
                                                        className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                                                        title="Delete Permanently"
                                                    >
                                                        {actionLoading === sub.id ? (
                                                            <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                                                        ) : (
                                                            <Trash2 className="w-4 h-4 text-red-400" />
                                                        )}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="p-4 border-t border-gray-800 flex items-center justify-between">
                                <p className="text-gray-500 text-sm">
                                    Page {page} of {totalPages}
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        className="btn btn-secondary flex items-center gap-1"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                        Previous
                                    </button>
                                    <button
                                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                        disabled={page === totalPages}
                                        className="btn btn-secondary flex items-center gap-1"
                                    >
                                        Next
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="p-12 text-center">
                        <AlertCircle className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                        <p className="text-gray-500">No rejected submissions</p>
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {selectedSubmission && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-fadeIn">
                        <div className="p-6 border-b border-gray-800 flex items-center justify-between">
                            <div>
                                <span className="badge badge-rejected mb-2">Rejected</span>
                                <h2 className="text-xl font-bold text-white">Submission Details</h2>
                            </div>
                            <button
                                onClick={() => setSelectedSubmission(null)}
                                className="text-gray-500 hover:text-gray-300"
                            >
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            {/* Rejection Reason */}
                            {selectedSubmission.rejection_reason && (
                                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                                    <p className="text-red-400 text-sm font-medium mb-1">Rejection Reason:</p>
                                    <p className="text-gray-300">{selectedSubmission.rejection_reason}</p>
                                </div>
                            )}

                            {/* Photo and Basic Info */}
                            <div className="flex gap-6">
                                {selectedSubmission.photo_base64 && (
                                    <img
                                        src={selectedSubmission.photo_base64}
                                        alt="Student"
                                        className="w-32 h-40 rounded-lg object-cover opacity-70"
                                    />
                                )}
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-bold text-gray-400">
                                        {selectedSubmission.student_name}
                                    </h3>
                                    <p className="text-gray-500 font-mono">{selectedSubmission.usn}</p>
                                    <p className="text-gray-500">
                                        {selectedSubmission.branch} - Semester {selectedSubmission.semester}
                                    </p>
                                    <p className="text-gray-500">{selectedSubmission.game_sport_competition}</p>
                                </div>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-2 gap-4 text-sm opacity-70">
                                <div>
                                    <span className="text-gray-500">Parent Name</span>
                                    <p className="text-gray-300">{selectedSubmission.parent_name}</p>
                                </div>
                                <div>
                                    <span className="text-gray-500">Phone</span>
                                    <p className="text-gray-300">{selectedSubmission.phone}</p>
                                </div>
                                <div className="col-span-2">
                                    <span className="text-gray-500">Address</span>
                                    <p className="text-gray-300">{selectedSubmission.contact_address}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
