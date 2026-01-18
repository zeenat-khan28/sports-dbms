import { useState, useEffect } from 'react';
import { submissionsAPI } from '../../api/axios';
import { Download, FileSpreadsheet, FileText, Loader2, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// College Header Info
const COLLEGE_INFO = {
    name: 'R.V. COLLEGE OF ENGINEERING, R.V Vidyaniketan Post, Bangalore - 59',
    address: 'R.V Vidyaniketan post, Mysore Road, Bangalore - 560059. Ph: 080-67178055, 67178021 Fax: 08067178011',
    title: 'IDENTITY/ELIGIBILITY PROFORMA OF PLAYERS REPRESENTING INTER-COLLEGIATE SPORTS ACTIVITIES',
    footer: 'Certified that these persons are bonafide students of RVCE, B\'lore and the information provided in this format is correct'
};

export default function ExportPage() {
    const [submissions, setSubmissions] = useState([]);
    const [sports, setSports] = useState([]);
    const [selectedSport, setSelectedSport] = useState('');
    const [status, setStatus] = useState('approved');
    const [downloading, setDownloading] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [status, selectedSport]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch all data by paginating (backend max per_page is 100)
            let allSubmissions = [];
            let page = 1;
            let hasMore = true;

            while (hasMore) {
                const params = { status, page, per_page: 100 };
                const res = await submissionsAPI.getAll(params);
                const subs = res.data.submissions || [];
                allSubmissions = [...allSubmissions, ...subs];

                // Check if there are more pages
                if (subs.length < 100) {
                    hasMore = false;
                } else {
                    page++;
                }

                // Safety limit
                if (page > 50) hasMore = false;
            }

            // Filter by sport if selected (client-side since backend doesn't support it)
            if (selectedSport) {
                allSubmissions = allSubmissions.filter(
                    sub => sub.game_sport_competition === selectedSport
                );
            }

            setSubmissions(allSubmissions);

            // Get sports list
            try {
                const sportsRes = await submissionsAPI.getSports();
                setSports(sportsRes.data || []);
            } catch {
                // Extract sports from submissions if API fails
                const sportSet = new Set(allSubmissions.map(s => s.game_sport_competition).filter(Boolean));
                setSports([...sportSet]);
            }
        } catch (error) {
            console.error('Fetch error:', error);
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    // Get current year for documents
    const getCurrentYear = () => {
        const now = new Date();
        const year = now.getFullYear();
        return `${year}-${(year + 1).toString().slice(2)}`;
    };

    // Export to Excel with college header/footer
    const exportToExcel = async () => {
        if (submissions.length === 0) {
            toast.error('No data to export');
            return;
        }

        setDownloading('excel');
        try {
            // Create workbook
            const wb = XLSX.utils.book_new();

            // Prepare header rows
            const headerRows = [
                [COLLEGE_INFO.name],
                [COLLEGE_INFO.address],
                [COLLEGE_INFO.title + ' ' + getCurrentYear()],
                [''],
                [`Game/Sport/Competition: ${selectedSport || 'All Sports'}`, '', '', `Date: ${new Date().toLocaleDateString()}`],
                ['']
            ];

            // Column headers matching the screenshot
            const columnHeaders = [
                'Sl.No',
                'Name of Student',
                'S/o, D/o',
                'Semester',
                'Branch',
                'USN No.',
                'Date of Birth',
                'Blood Group',
                'Contact Address',
                'Phone/Cell No.',
                'Mother Name',
                'Course Name',
                'Game/Sport',
                'Status'
            ];

            // Prepare data rows
            const dataRows = submissions.map((sub, index) => [
                index + 1,
                sub.student_name || '',
                sub.parent_name || '',
                sub.semester || '',
                sub.branch || '',
                sub.usn || '',
                sub.date_of_birth || '',
                sub.blood_group || '',
                sub.contact_address || '',
                sub.phone || '',
                sub.mother_name || '',
                sub.course_name || '',
                sub.game_sport_competition || '',
                sub.status || ''
            ]);

            // Footer row
            const footerRows = [
                [''],
                [COLLEGE_INFO.footer]
            ];

            // Combine all rows
            const allRows = [
                ...headerRows,
                columnHeaders,
                ...dataRows,
                ...footerRows
            ];

            // Create worksheet
            const ws = XLSX.utils.aoa_to_sheet(allRows);

            // Set column widths
            ws['!cols'] = [
                { wch: 6 },   // Sl.No
                { wch: 20 },  // Name
                { wch: 15 },  // S/o
                { wch: 8 },   // Semester
                { wch: 10 },  // Branch
                { wch: 15 },  // USN
                { wch: 12 },  // DOB
                { wch: 8 },   // Blood
                { wch: 25 },  // Address
                { wch: 12 },  // Phone
                { wch: 15 },  // Mother
                { wch: 12 },  // Course
                { wch: 15 },  // Sport
                { wch: 10 }   // Status
            ];

            // Merge header cells
            ws['!merges'] = [
                { s: { r: 0, c: 0 }, e: { r: 0, c: 13 } },  // College name
                { s: { r: 1, c: 0 }, e: { r: 1, c: 13 } },  // Address
                { s: { r: 2, c: 0 }, e: { r: 2, c: 13 } },  // Title
                { s: { r: headerRows.length + dataRows.length + 1, c: 0 }, e: { r: headerRows.length + dataRows.length + 1, c: 13 } }  // Footer
            ];

            // Add worksheet to workbook
            XLSX.utils.book_append_sheet(wb, ws, 'Students');

            // Generate and download
            const fileName = `RVCE_Sports_${selectedSport || 'All'}_${status}_${new Date().toISOString().split('T')[0]}.xlsx`;
            XLSX.writeFile(wb, fileName);

            toast.success('Excel file downloaded!');
        } catch (error) {
            console.error(error);
            toast.error('Failed to generate Excel');
        } finally {
            setDownloading(null);
        }
    };

    // Export to PDF with college header/footer
    const exportToPDF = async () => {
        if (submissions.length === 0) {
            toast.error('No data to export');
            return;
        }

        setDownloading('pdf');
        try {
            // Create PDF (landscape for more columns)
            const doc = new jsPDF('l', 'mm', 'a4');
            const pageWidth = doc.internal.pageSize.getWidth();

            // Add header
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text(COLLEGE_INFO.name, pageWidth / 2, 15, { align: 'center' });

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(COLLEGE_INFO.address, pageWidth / 2, 22, { align: 'center' });

            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text(COLLEGE_INFO.title + ' ' + getCurrentYear(), pageWidth / 2, 30, { align: 'center' });

            // Add sport and date info
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`Game/Sport/Competition: ${selectedSport || 'All Sports'}`, 14, 38);
            doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - 50, 38);

            // Prepare table data
            const tableData = submissions.map((sub, index) => [
                index + 1,
                sub.student_name || '',
                sub.parent_name || '',
                sub.semester || '',
                sub.branch || '',
                sub.usn || '',
                sub.date_of_birth || '',
                sub.blood_group || '',
                sub.phone || '',
                sub.game_sport_competition || '',
                sub.status?.toUpperCase() || ''
            ]);

            // Add table
            doc.autoTable({
                startY: 42,
                head: [[
                    'Sl.No', 'Name of Student', 'S/o, D/o', 'Sem', 'Branch',
                    'USN No.', 'DOB', 'Blood', 'Phone', 'Sport', 'Status'
                ]],
                body: tableData,
                styles: {
                    fontSize: 8,
                    cellPadding: 2
                },
                headStyles: {
                    fillColor: [100, 100, 100],
                    textColor: 255,
                    fontStyle: 'bold'
                },
                alternateRowStyles: {
                    fillColor: [245, 245, 245]
                },
                margin: { left: 14, right: 14 },
                didDrawPage: (data) => {
                    // Add footer on each page
                    const pageHeight = doc.internal.pageSize.getHeight();
                    doc.setFontSize(9);
                    doc.setTextColor(150, 0, 0);
                    doc.text(COLLEGE_INFO.footer, pageWidth / 2, pageHeight - 10, { align: 'center' });

                    // Page number
                    doc.setTextColor(100);
                    doc.text(`Page ${data.pageNumber}`, pageWidth - 20, pageHeight - 10);
                }
            });

            // Save PDF
            const fileName = `RVCE_Sports_${selectedSport || 'All'}_${status}_${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(fileName);

            toast.success('PDF file downloaded!');
        } catch (error) {
            console.error(error);
            toast.error('Failed to generate PDF');
        } finally {
            setDownloading(null);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-end justify-between border-b border-slate-700 pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Download className="w-7 h-7 text-blue-500" />
                        Export Data
                    </h1>
                    <p className="text-slate-400 mt-1">Download student data with college letterhead</p>
                </div>
                <div className="text-right">
                    <p className="text-sm text-slate-500">{submissions.length} records found</p>
                </div>
            </div>

            {/* Filters */}
            <div className="card p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Filter className="w-5 h-5 text-slate-400" />
                    <h2 className="text-lg font-semibold text-white">Filter Options</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Sport/Game</label>
                        <select
                            value={selectedSport}
                            onChange={e => setSelectedSport(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">All Sports</option>
                            {sports.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Status</label>
                        <select
                            value={status}
                            onChange={e => setStatus(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="approved">Approved Only</option>
                            <option value="pending">Pending Only</option>
                            <option value="rejected">Rejected Only</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Export Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Excel Export */}
                <button
                    onClick={exportToExcel}
                    disabled={!!downloading || loading || submissions.length === 0}
                    className="card p-6 border-2 border-slate-700 hover:border-green-500/50 transition-all duration-300 text-left disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-green-500/20 rounded-xl flex items-center justify-center">
                            {downloading === 'excel'
                                ? <Loader2 className="w-8 h-8 text-green-400 animate-spin" />
                                : <FileSpreadsheet className="w-8 h-8 text-green-400" />
                            }
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">Export Excel</h3>
                            <p className="text-slate-400 text-sm mt-1">
                                Download as .xlsx with college header/footer
                            </p>
                        </div>
                    </div>
                </button>

                {/* PDF Export */}
                <button
                    onClick={exportToPDF}
                    disabled={!!downloading || loading || submissions.length === 0}
                    className="card p-6 border-2 border-slate-700 hover:border-red-500/50 transition-all duration-300 text-left disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-red-500/20 rounded-xl flex items-center justify-center">
                            {downloading === 'pdf'
                                ? <Loader2 className="w-8 h-8 text-red-400 animate-spin" />
                                : <FileText className="w-8 h-8 text-red-400" />
                            }
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">Export PDF</h3>
                            <p className="text-slate-400 text-sm mt-1">
                                Download as .pdf with college header/footer
                            </p>
                        </div>
                    </div>
                </button>
            </div>

            {/* Preview Section */}
            {submissions.length > 0 && (
                <div className="card overflow-hidden">
                    <div className="p-4 border-b border-slate-700 bg-slate-800/50">
                        <h3 className="text-lg font-semibold text-white">Data Preview</h3>
                        <p className="text-sm text-slate-400">Showing first 5 records</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-800">
                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase">Sl.No</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase">Name</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase">USN</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase">Branch</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase">Sport</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {submissions.slice(0, 5).map((sub, index) => (
                                    <tr key={sub.id} className="hover:bg-slate-800/50">
                                        <td className="px-4 py-3 text-slate-300">{index + 1}</td>
                                        <td className="px-4 py-3 text-white font-medium">{sub.student_name}</td>
                                        <td className="px-4 py-3 text-slate-400 font-mono text-sm">{sub.usn}</td>
                                        <td className="px-4 py-3 text-slate-400">{sub.branch}</td>
                                        <td className="px-4 py-3 text-blue-400">{sub.game_sport_competition}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium
                                                ${sub.status === 'approved' ? 'bg-green-500/20 text-green-400' : ''}
                                                ${sub.status === 'pending' ? 'bg-amber-500/20 text-amber-400' : ''}
                                                ${sub.status === 'rejected' ? 'bg-red-500/20 text-red-400' : ''}
                                            `}>
                                                {sub.status?.toUpperCase()}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {loading && (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                </div>
            )}

            {!loading && submissions.length === 0 && (
                <div className="card p-12 text-center">
                    <FileSpreadsheet className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400">No records found for the selected filters</p>
                </div>
            )}
        </div>
    );
}
