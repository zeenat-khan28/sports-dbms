import { useState, useEffect } from 'react';
import { submissionsAPI } from '../../api/axios';
import {
    Clock, CheckCircle, XCircle, Eye, Trash2,
    Search, ChevronLeft, ChevronRight, AlertCircle,
    Loader2, User, Edit
} from 'lucide-react';
import toast from 'react-hot-toast';
import EditSubmissionModal from '../../components/admin/EditSubmissionModal';

export default function PendingPage() {
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const [selectedSubmission, setSelectedSubmission] = useState(null);
    const [editingSubmission, setEditingSubmission] = useState(null);
    const perPage = 10;

    useEffect(() => {
        fetchSubmissions();
    }, [page]);

    const fetchSubmissions = async () => {
        setLoading(true);
        try {
            const response = await submissionsAPI.getAll({
                status: 'pending',
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

    const handleApprove = async (id) => {
        setActionLoading(id);
        try {
            await submissionsAPI.update(id, { status: 'approved' });
            toast.success('Submission approved!');
            fetchSubmissions();
            setSelectedSubmission(null);
        } catch (error) {
            toast.error('Failed to approve submission');
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (id) => {
        const reason = prompt('Enter rejection reason (optional):');
        setActionLoading(id);
        try {
            await submissionsAPI.update(id, {
                status: 'rejected',
                rejection_reason: reason || undefined
            });
            toast.success('Submission rejected');
            fetchSubmissions();
            setSelectedSubmission(null);
        } catch (error) {
            toast.error('Failed to reject submission');
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this submission?')) return;

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

    const handleSaveEdit = async (id, data) => {
        try {
            await submissionsAPI.update(id, data);
            toast.success('Details updated successfully');
            fetchSubmissions();
        } catch (error) {
            toast.error('Failed to update details');
            throw error;
        }
    };

    const filteredSubmissions = submissions.filter(sub =>
        sub.student_name.toLowerCase().includes(search.toLowerCase()) ||
        sub.usn.toLowerCase().includes(search.toLowerCase()) ||
        sub.game_sport_competition.toLowerCase().includes(search.toLowerCase())
    );

    const totalPages = Math.ceil(total / perPage);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="loader"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Clock className="w-8 h-8 text-amber-400" />
                        Pending Requests
                    </h1>
                    <p className="text-gray-500 mt-1">{total} submissions awaiting review</p>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by name, USN, or sport..."
                        className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg w-full md:w-80"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="card overflow-hidden">
                {filteredSubmissions.length > 0 ? (
                    <>
                        <div className="overflow-x-auto">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Student</th>
                                        <th>USN</th>
                                        <th>Sport/Game</th>
                                        <th>Branch</th>
                                        <th>Semester</th>
                                        <th>Submitted</th>
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
                                                            className="w-10 h-10 rounded-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                                                            <User className="w-5 h-5 text-gray-500" />
                                                        </div>
                                                    )}
                                                    <span className="font-medium text-white">{sub.student_name}</span>
                                                </div>
                                            </td>
                                            <td className="text-gray-400 font-mono">{sub.usn}</td>
                                            <td className="text-amber-400">{sub.game_sport_competition}</td>
                                            <td className="text-gray-400">{sub.branch}</td>
                                            <td className="text-gray-400">Sem {sub.semester}</td>
                                            <td className="text-gray-500 text-sm">
                                                {new Date(sub.submitted_at).toLocaleDateString()}
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
                                                        onClick={() => setEditingSubmission(sub)}
                                                        className="p-2 hover:bg-blue-500/20 rounded-lg transition-colors"
                                                        title="Edit Details"
                                                    >
                                                        <Edit className="w-4 h-4 text-blue-400" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleApprove(sub.id)}
                                                        disabled={actionLoading === sub.id}
                                                        className="p-2 hover:bg-emerald-500/20 rounded-lg transition-colors"
                                                        title="Approve"
                                                    >
                                                        {actionLoading === sub.id ? (
                                                            <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                                                        ) : (
                                                            <CheckCircle className="w-4 h-4 text-emerald-400" />
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={() => handleReject(sub.id)}
                                                        disabled={actionLoading === sub.id}
                                                        className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                                                        title="Reject"
                                                    >
                                                        <XCircle className="w-4 h-4 text-red-400" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(sub.id)}
                                                        disabled={actionLoading === sub.id}
                                                        className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4 text-red-400" />
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
                        <p className="text-gray-500">No pending submissions found</p>
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            <EditSubmissionModal
                submission={editingSubmission}
                onClose={() => setEditingSubmission(null)}
                onSave={handleSaveEdit}
            />

            {/* Detail Modal */}
            {selectedSubmission && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-fadeIn">
                        <div className="p-6 border-b border-gray-800 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-white">Submission Details</h2>
                                <button
                                    onClick={() => setEditingSubmission(selectedSubmission)}
                                    className="ml-4 text-sm text-blue-400 hover:text-blue-300 underline"
                                >
                                    Edit
                                </button>
                            </div>
                            <button
                                onClick={() => setSelectedSubmission(null)}
                                className="text-gray-500 hover:text-gray-300"
                            >
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            {/* Photo and Basic Info */}
                            <div className="flex gap-6">
                                {selectedSubmission.photo_base64 && (
                                    <img
                                        src={selectedSubmission.photo_base64}
                                        alt="Student"
                                        className="w-32 h-40 rounded-lg object-cover"
                                    />
                                )}
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-bold text-white">
                                        {selectedSubmission.student_name}
                                    </h3>
                                    <p className="text-amber-400 font-mono">{selectedSubmission.usn}</p>
                                    <p className="text-gray-400">
                                        {selectedSubmission.branch} - Semester {selectedSubmission.semester}
                                    </p>
                                    <p className="text-gray-500">{selectedSubmission.game_sport_competition}</p>
                                </div>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-gray-500">Parent Name</span>
                                    <p className="text-white">{selectedSubmission.parent_name}</p>
                                </div>
                                <div>
                                    <span className="text-gray-500">Mother's Name</span>
                                    <p className="text-white">{selectedSubmission.mother_name}</p>
                                </div>
                                <div>
                                    <span className="text-gray-500">Date of Birth</span>
                                    <p className="text-white">{selectedSubmission.date_of_birth}</p>
                                </div>
                                <div>
                                    <span className="text-gray-500">Blood Group</span>
                                    <p className="text-white">{selectedSubmission.blood_group}</p>
                                </div>
                                <div>
                                    <span className="text-gray-500">Phone</span>
                                    <p className="text-white">{selectedSubmission.phone}</p>
                                </div>
                                <div>
                                    <span className="text-gray-500">Course</span>
                                    <p className="text-white">{selectedSubmission.course_name}</p>
                                </div>
                                <div className="col-span-2">
                                    <span className="text-gray-500">Address</span>
                                    <p className="text-white">{selectedSubmission.contact_address}</p>
                                </div>
                            </div>

                            {/* Signature */}
                            {selectedSubmission.signature_base64 && (
                                <div>
                                    <span className="text-gray-500 text-sm">Signature</span>
                                    <img
                                        src={selectedSubmission.signature_base64}
                                        alt="Signature"
                                        className="h-16 mt-2 bg-white/10 rounded p-2"
                                    />
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-3 pt-4 border-t border-gray-800">
                                <button
                                    onClick={() => handleApprove(selectedSubmission.id)}
                                    disabled={actionLoading === selectedSubmission.id}
                                    className="btn btn-success flex-1 flex items-center justify-center gap-2"
                                >
                                    <CheckCircle className="w-4 h-4" />
                                    Approve
                                </button>
                                <button
                                    onClick={() => handleReject(selectedSubmission.id)}
                                    disabled={actionLoading === selectedSubmission.id}
                                    className="btn btn-danger flex-1 flex items-center justify-center gap-2"
                                >
                                    <XCircle className="w-4 h-4" />
                                    Reject
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
