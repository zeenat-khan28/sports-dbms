import { useState, useEffect } from 'react';
import { submissionsAPI } from '../../api/axios';
import {
    Trophy, Search, Eye, Trash2, User,
    ChevronLeft, ChevronRight, AlertCircle, XCircle, Loader2, Edit
} from 'lucide-react';
import toast from 'react-hot-toast';
import EditSubmissionModal from '../../components/admin/EditSubmissionModal';

export default function ApprovedPage() {
    const [submissions, setSubmissions] = useState([]);
    const [sports, setSports] = useState([]);
    const [selectedSport, setSelectedSport] = useState('');
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const [selectedSubmission, setSelectedSubmission] = useState(null);
    const [editingSubmission, setEditingSubmission] = useState(null);
    const perPage = 10;

    useEffect(() => {
        fetchSports();
    }, []);

    useEffect(() => {
        fetchSubmissions();
    }, [page, selectedSport]);

    const fetchSports = async () => {
        try {
            const response = await submissionsAPI.getSportsList();
            setSports(response.data);
        } catch (error) {
            console.error('Failed to load sports list');
        }
    };

    const fetchSubmissions = async () => {
        setLoading(true);
        try {
            const params = {
                status: 'approved',
                page,
                per_page: perPage
            };
            if (selectedSport) {
                params.sport = selectedSport;
            }
            const response = await submissionsAPI.getAll(params);
            setSubmissions(response.data.submissions);
            setTotal(response.data.total);
        } catch (error) {
            toast.error('Failed to load submissions');
        } finally {
            setLoading(false);
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
        sub.usn.toLowerCase().includes(search.toLowerCase())
    );

    const totalPages = Math.ceil(total / perPage);

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Trophy className="w-8 h-8 text-amber-400" />
                        Approved Players
                    </h1>
                    <p className="text-gray-500 mt-1">{total} approved submissions</p>
                </div>

                <div className="flex gap-3">
                    {/* Sport Filter */}
                    <select
                        value={selectedSport}
                        onChange={(e) => {
                            setSelectedSport(e.target.value);
                            setPage(1);
                        }}
                        className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200"
                    >
                        <option value="">All Sports</option>
                        {sports.map(sport => (
                            <option key={sport} value={sport}>{sport}</option>
                        ))}
                    </select>

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
            </div>

            {/* Sport Tabs */}
            {sports.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => {
                            setSelectedSport('');
                            setPage(1);
                        }}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${selectedSport === ''
                            ? 'bg-amber-500 text-gray-900'
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                            }`}
                    >
                        All
                    </button>
                    {sports.map(sport => (
                        <button
                            key={sport}
                            onClick={() => {
                                setSelectedSport(sport);
                                setPage(1);
                            }}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${selectedSport === sport
                                ? 'bg-amber-500 text-gray-900'
                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                }`}
                        >
                            {sport}
                        </button>
                    ))}
                </div>
            )}

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
                                        <th>SLN</th>
                                        <th>Student</th>
                                        <th>USN</th>
                                        <th>Sport</th>
                                        <th>Branch</th>
                                        <th>Semester</th>
                                        <th>Approved On</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredSubmissions.map((sub) => (
                                        <tr key={sub.id}>
                                            <td className="text-amber-400 font-bold">{sub.sln || '-'}</td>
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
                                            <td className="text-emerald-400">{sub.game_sport_competition}</td>
                                            <td className="text-gray-400">{sub.branch}</td>
                                            <td className="text-gray-400">Sem {sub.semester}</td>
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
                                                        onClick={() => setEditingSubmission(sub)}
                                                        className="p-2 hover:bg-blue-500/20 rounded-lg transition-colors"
                                                        title="Edit Details"
                                                    >
                                                        <Edit className="w-4 h-4 text-blue-400" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(sub.id)}
                                                        disabled={actionLoading === sub.id}
                                                        className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                                                        title="Delete"
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
                        <p className="text-gray-500">No approved submissions found</p>
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
                                <span className="badge badge-approved mb-2">Approved</span>
                                <h2 className="text-xl font-bold text-white">Player Details</h2>
                                <button
                                    onClick={() => setEditingSubmission(selectedSubmission)}
                                    className="text-sm text-blue-400 hover:text-blue-300 underline mt-1"
                                >
                                    Edit Details
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
                                    <div className="flex items-center gap-3">
                                        <span className="text-amber-400 font-bold text-2xl">
                                            #{selectedSubmission.sln}
                                        </span>
                                    </div>
                                    <h3 className="text-2xl font-bold text-white">
                                        {selectedSubmission.student_name}
                                    </h3>
                                    <p className="text-amber-400 font-mono">{selectedSubmission.usn}</p>
                                    <p className="text-gray-400">
                                        {selectedSubmission.branch} - Semester {selectedSubmission.semester}
                                    </p>
                                    <p className="text-emerald-400 font-medium">
                                        {selectedSubmission.game_sport_competition}
                                    </p>
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
                                    <p className="text-white">{selectedSubmission.course_name || 'BE'}</p>
                                </div>
                                <div className="col-span-2">
                                    <span className="text-gray-500">Address</span>
                                    <p className="text-white">{selectedSubmission.contact_address}</p>
                                </div>
                                <div>
                                    <span className="text-gray-500">Previous Game</span>
                                    <p className="text-white">{selectedSubmission.previous_game || '-'}</p>
                                </div>
                                <div>
                                    <span className="text-gray-500">Previous Years</span>
                                    <p className="text-white">{selectedSubmission.previous_years || '-'}</p>
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
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
