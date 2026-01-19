import { useState, useEffect } from 'react';
import { submissionsAPI } from '../../api/axios';
import { Download, FileSpreadsheet, FileText, Loader2, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Import Assets
import collegeLogo from '../../assets/college_logo.jpg';

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
            let allSubmissions = [];
            let page = 1;
            let hasMore = true;

            while (hasMore) {
                const params = { status, page, per_page: 100 };
                const res = await submissionsAPI.getAll(params);
                const subs = res.data.submissions || [];
                allSubmissions = [...allSubmissions, ...subs];
                if (subs.length < 100) hasMore = false;
                else page++;
                if (page > 50) hasMore = false;
            }

            if (selectedSport) {
                allSubmissions = allSubmissions.filter(sub => sub.game_sport_competition === selectedSport);
            }

            setSubmissions(allSubmissions);

            try {
                const sportsRes = await submissionsAPI.getSports();
                setSports(sportsRes.data || []);
            } catch {
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

    const base64ToArrayBuffer = (base64) => {
        try {
            const base64Clean = base64.split(',')[1] || base64;
            const binaryString = window.atob(base64Clean);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            return bytes.buffer;
        } catch (e) {
            console.error("Error converting base64 to buffer", e);
            return null;
        }
    };

    const fetchImageBuffer = async (url) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            return await blob.arrayBuffer();
        } catch (error) {
            console.error("Error fetching image", error);
            return null;
        }
    };

    const getCurrentYear = () => {
        const now = new Date();
        const year = now.getFullYear();
        return `${year}-${(year + 1).toString().slice(2)}`;
    };

    // --- PROFORMA EXPORT ---
    const exportToExcel = async () => {
        if (submissions.length === 0) {
            toast.error('No data to export');
            return;
        }

        setDownloading('excel');
        try {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Students');

            // --- 1. SETUP COLUMNS (9 Columns) ---
            // Widths matched loosely to screenshot
            worksheet.columns = [
                { key: 'sl', width: 5 },    // Sl.No
                { key: 'col2', width: 30 }, // Name/Details
                { key: 'col3', width: 15 }, // DOB
                { key: 'col4', width: 30 }, // Personal/Contact
                { key: 'col5', width: 10 }, // Course (BE)
                { key: 'col6', width: 25 }, // Admission/Passing
                { key: 'col7', width: 20 }, // Previous Participation
                { key: 'col8', width: 15 }, // Photo
                { key: 'col9', width: 15 }  // Signature
            ];

            // --- 2. HEADER BLOCK (Rows 1-4) ---
            // Split Header: Logo (left) and Text (center/right)
            // Logo Area: A1:B3
            worksheet.mergeCells('A1:B3');

            // Text Area: C1:I1, C2:I2, C3:I3
            worksheet.mergeCells('C1:I1');
            worksheet.mergeCells('C2:I2');
            worksheet.mergeCells('C3:I3');

            // Set Text Values
            const row1 = worksheet.getRow(1);
            row1.height = 30;
            // Note: Assigning to C1 because A1 is merged with B1...B3
            const titleCell = worksheet.getCell('C1');
            titleCell.value = COLLEGE_INFO.name;
            titleCell.font = { bold: true, size: 16, name: 'Times New Roman' };
            titleCell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

            const row2 = worksheet.getRow(2);
            row2.height = 30;
            const addressCell = worksheet.getCell('C2');
            addressCell.value = COLLEGE_INFO.address;
            addressCell.font = { size: 10, name: 'Times New Roman' };
            addressCell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

            const row3 = worksheet.getRow(3);
            row3.height = 30;
            const proformaCell = worksheet.getCell('C3');
            proformaCell.value = COLLEGE_INFO.title + ' ' + getCurrentYear();
            proformaCell.font = { bold: true, size: 11, name: 'Times New Roman' };
            proformaCell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

            // Row 4: Event Details
            const row4 = worksheet.getRow(4);
            row4.values = [`Game/Sport/Competition: ${selectedSport || 'All'}`, '', '', `Organizing Institution: RVCE`, '', '', '', `Date: ${new Date().toLocaleDateString()}`, ''];
            worksheet.mergeCells('A4:B4'); // Game label
            worksheet.mergeCells('D4:F4'); // Org Inst
            worksheet.mergeCells('H4:I4'); // Date
            row4.font = { bold: true, name: 'Times New Roman' };
            row4.alignment = { vertical: 'middle' };

            // Embed Logo
            try {
                const logoBuffer = await fetchImageBuffer(collegeLogo);
                if (logoBuffer) {
                    const logoId = workbook.addImage({ buffer: logoBuffer, extension: 'jpeg' });
                    worksheet.addImage(logoId, {
                        tl: { col: 0, row: 0 },
                        ext: { width: 120, height: 90 }, // Fixed size ~ 3cm x 2cm
                        editAs: 'oneCell'
                    });
                }
            } catch (e) { console.log("Logo error", e); }

            // --- 3. TABLE HEADER (Row 5) ---
            const headerRow = worksheet.getRow(5);
            headerRow.height = 80;
            headerRow.values = [
                'Sl.No',
                'a) Name of the Student\nb) S/o, D/o\nc) Sem\nd) Branch\ne) USN No.',
                'Date of Birth',
                'a) Blood Group\nb) Contact address\nc) Phone/cell no.\nd) Mother Name',
                'Name of\nthe Course',
                'a) Passing year of 10+2\n(PUC) Diploma / Degree\nb) Date of first admission to\npresent course\nc) Date of first admission to\npresent class/Sem',
                'Previous\nParticipation\na) Game\nb) Years',
                'Photo',
                'Signature'
            ];

            headerRow.eachCell((cell) => {
                cell.font = { bold: true, name: 'Times New Roman', size: 10 };
                cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
                cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            });

            // --- 4. DATA LOOPS ---
            let currentRow = 6;

            for (let i = 0; i < submissions.length; i++) {
                const sub = submissions[i];

                // Define 5 rows for this student
                const r1 = currentRow;
                const r2 = currentRow + 1;
                const r3 = currentRow + 2;
                const r4 = currentRow + 3;
                const r5 = currentRow + 4;

                // --- MERGES ---
                worksheet.mergeCells(`A${r1}:A${r5}`); // Sl.No
                worksheet.mergeCells(`C${r1}:C${r5}`); // DOB
                worksheet.mergeCells(`E${r1}:E${r5}`); // Course
                worksheet.mergeCells(`H${r1}:H${r5}`); // Photo
                worksheet.mergeCells(`I${r1}:I${r5}`); // Signature

                // --- VALUES ---

                // Sl.No
                worksheet.getCell(`A${r1}`).value = i + 1;

                // DOB
                worksheet.getCell(`C${r1}`).value = sub.date_of_birth || '-';

                // Course
                worksheet.getCell(`E${r1}`).value = 'BE';

                // -- Col 2 (Details) --
                worksheet.getCell(`B${r1}`).value = `a) ${sub.student_name}`;
                worksheet.getCell(`B${r2}`).value = `b) ${sub.parent_name || '-'}`;
                worksheet.getCell(`B${r3}`).value = `c) ${sub.semester}`;
                worksheet.getCell(`B${r4}`).value = `d) ${sub.branch}`;
                worksheet.getCell(`B${r5}`).value = `e) ${sub.usn}`;

                // -- Col 4 (Contact) --
                worksheet.getCell(`D${r1}`).value = `a) ${sub.blood_group || '-'}`;
                worksheet.getCell(`D${r2}`).value = `b) ${sub.contact_address || '-'}`;
                worksheet.getCell(`D${r3}`).value = `c) ${sub.phone || '-'}`;
                worksheet.getCell(`D${r4}`).value = `d) ${sub.mother_name || '-'}`;
                worksheet.getCell(`D${r5}`).value = ''; // Spacer

                // -- Col 6 (Academic - Placeholders) --
                worksheet.getCell(`F${r1}`).value = 'a) -';
                worksheet.getCell(`F${r2}`).value = 'b) -';
                worksheet.getCell(`F${r3}`).value = 'c) -';
                worksheet.getCell(`F${r4}`).value = '';
                worksheet.getCell(`F${r5}`).value = '';

                // -- Col 7 (Participation - Placeholders) --
                worksheet.getCell(`G${r1}`).value = 'a) -';
                worksheet.getCell(`G${r2}`).value = 'b) -';
                worksheet.getCell(`G${r3}`).value = '';
                worksheet.getCell(`G${r4}`).value = '';
                worksheet.getCell(`G${r5}`).value = '';

                // --- STYLING ---
                // Apply borders and alignment to the 5x9 block
                for (let r = r1; r <= r5; r++) {
                    const row = worksheet.getRow(r);
                    row.height = 25; // Good height for text
                    for (let c = 1; c <= 9; c++) {
                        const cell = row.getCell(c);
                        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                        // Center align merged/short cells, left align detailed text
                        if ([1, 3, 5, 8, 9].includes(c)) {
                            cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
                        } else {
                            cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true, indent: 1 };
                        }
                    }
                }

                // --- IMAGES ---
                // Photo (Col 8, Row r1-r5)
                if (sub.photo_base64) {
                    const imgBuffer = base64ToArrayBuffer(sub.photo_base64);
                    if (imgBuffer) {
                        const imgId = workbook.addImage({ buffer: imgBuffer, extension: 'png' });
                        worksheet.addImage(imgId, {
                            tl: { col: 7, row: r1 - 1 }, // 7 = Col H
                            br: { col: 8, row: r5 },     // 8 = End of Col H
                            editAs: 'oneCell'
                        });
                    }
                }

                // Signature (Col 9, Row r1-r5)
                if (sub.signature_base64) {
                    const imgBuffer = base64ToArrayBuffer(sub.signature_base64);
                    if (imgBuffer) {
                        const imgId = workbook.addImage({ buffer: imgBuffer, extension: 'png' });
                        worksheet.addImage(imgId, {
                            tl: { col: 8, row: r1 - 1 }, // 8 = Col I
                            br: { col: 9, row: r5 },     // 9 = End of Col I
                            editAs: 'oneCell'
                        });
                    }
                }

                currentRow += 5;
            }

            // --- FOOTER ---
            worksheet.mergeCells(`A${currentRow}:I${currentRow}`);
            const footerRow = worksheet.getRow(currentRow);
            footerRow.height = 30;
            footerRow.getCell(1).value = COLLEGE_INFO.footer;
            footerRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
            footerRow.getCell(1).font = { italic: true, size: 10 };
            footerRow.getCell(1).border = { top: { style: 'thin' } };

            // Write File
            const buffer = await workbook.xlsx.writeBuffer();
            const fileName = `RVCE_Proforma_${new Date().toISOString().split('T')[0]}.xlsx`;
            saveAs(new Blob([buffer]), fileName);
            toast.success('Proforma Excel downloaded!');

        } catch (error) {
            console.error('Excel export error:', error);
            toast.error('Failed to generate Excel');
        } finally {
            setDownloading(null);
        }
    };

    const exportToPDF = async () => {
        if (submissions.length === 0) {
            toast.error('No data to export');
            return;
        }
        setDownloading('pdf');
        try {
            const doc = new jsPDF('l', 'mm', 'a4');
            const pageWidth = doc.internal.pageSize.getWidth();

            // --- 1. HEADER (Text) ---
            doc.setFontSize(12);
            doc.setFont('times', 'bold');
            doc.text(COLLEGE_INFO.name, pageWidth / 2, 10, { align: 'center' });

            doc.setFontSize(9);
            doc.setFont('times', 'normal');
            doc.text(COLLEGE_INFO.address, pageWidth / 2, 16, { align: 'center' });

            doc.setFontSize(10);
            doc.setFont('times', 'bold');
            doc.text(COLLEGE_INFO.title + ' ' + getCurrentYear(), pageWidth / 2, 22, { align: 'center' });

            // Row 4 info (Game, Date etc)
            doc.setFontSize(10);
            doc.text(`Game/Sport: ${selectedSport || 'All'}`, 14, 28);
            doc.text(`Organizing Institution: RVCE`, pageWidth / 2, 28, { align: 'center' });
            doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - 14, 28, { align: 'right' });

            // --- 2. TABLE DATA PREPARATION ---
            // Columns: Sl(A), Name(B), DOB(C), Contact(D), Course(E), Academics(F), Previous(G), Photo(H), Sign(I)

            const body = [];

            submissions.forEach((sub, index) => {
                // 5 Rows per student

                // Row 1
                body.push([
                    { content: (index + 1).toString(), rowSpan: 5, styles: { valign: 'middle', halign: 'center' } },
                    { content: `a) ${sub.student_name}`, styles: { halign: 'left' } },
                    { content: sub.date_of_birth || '-', rowSpan: 5, styles: { valign: 'middle', halign: 'center' } },
                    { content: `a) ${sub.blood_group || '-'}`, styles: { halign: 'left' } },
                    { content: 'BE', rowSpan: 5, styles: { valign: 'middle', halign: 'center' } },
                    { content: 'a) -', styles: { halign: 'left' } },
                    { content: 'a) -', styles: { halign: 'left' } },
                    { content: '', rowSpan: 5, styles: { minCellHeight: 30, valign: 'middle' }, data: { image: sub.photo_base64 } }, // Photo container
                    { content: '', rowSpan: 5, styles: { minCellHeight: 30, valign: 'middle' }, data: { image: sub.signature_base64 } } // Signature container
                ]);

                // Row 2
                body.push([
                    { content: `b) ${sub.parent_name || '-'}`, styles: { halign: 'left' } },
                    { content: `b) ${sub.contact_address || '-'}`, styles: { halign: 'left' } },
                    { content: 'b) -', styles: { halign: 'left' } },
                    { content: 'b) -', styles: { halign: 'left' } },
                ]);

                // Row 3
                body.push([
                    { content: `c) ${sub.semester}`, styles: { halign: 'left' } },
                    { content: `c) ${sub.phone || '-'}`, styles: { halign: 'left' } },
                    { content: 'c) -', styles: { halign: 'left' } },
                    { content: '', styles: { halign: 'left' } }, // Prev G empty
                ]);

                // Row 4
                body.push([
                    { content: `d) ${sub.branch}`, styles: { halign: 'left' } },
                    { content: `d) ${sub.mother_name || '-'}`, styles: { halign: 'left' } },
                    { content: '', styles: { halign: 'left' } },
                    { content: '', styles: { halign: 'left' } },
                ]);

                // Row 5
                body.push([
                    { content: `e) ${sub.usn}`, styles: { halign: 'left' } },
                    { content: '', styles: { halign: 'left' } }, // Contact spacer
                    { content: '', styles: { halign: 'left' } }, // Acad spacer
                    { content: '', styles: { halign: 'left' } }, // Prev spacer
                ]);
            });

            // Footer Row
            body.push([
                { content: COLLEGE_INFO.footer, colSpan: 9, styles: { halign: 'center', fontStyle: 'italic' } }
            ]);

            // --- 3. GENERATE TABLE ---
            autoTable(doc, {
                startY: 32,
                theme: 'grid',
                head: [[
                    'Sl.No',
                    'a) Name\nb) Father\nc) Sem\nd) Branch\ne) USN',
                    'DOB',
                    'a) Blood Grp\nb) Address\nc) Phone\nd) Mother',
                    'Course',
                    'Academic\nDetails',
                    'Previous\nParticipation',
                    'Photo',
                    'Signature'
                ]],
                body: body,
                styles: {
                    font: 'times',
                    fontSize: 8,
                    lineColor: [0, 0, 0],
                    lineWidth: 0.1,
                    textColor: [0, 0, 0]
                },
                headStyles: {
                    fillColor: [255, 255, 255],
                    textColor: [0, 0, 0],
                    fontStyle: 'bold',
                    valign: 'middle',
                    halign: 'center',
                    lineWidth: 0.1,
                    lineColor: [0, 0, 0]
                },
                columnStyles: {
                    0: { cellWidth: 10 }, // Sl
                    1: { cellWidth: 50 }, // Name
                    2: { cellWidth: 20 }, // DOB
                    3: { cellWidth: 50 }, // Contact
                    4: { cellWidth: 15 }, // Course
                    5: { cellWidth: 35 }, // Academic
                    6: { cellWidth: 35 }, // Previous
                    7: { cellWidth: 25 }, // Photo
                    8: { cellWidth: 25 }  // Sign
                },
                didDrawCell: (data) => {
                    // Draw Images in RowSpan cells
                    if (data.column.index === 7 || data.column.index === 8) {
                        const cellData = data.cell.raw && data.cell.raw.data;
                        if (cellData && cellData.image && data.cell.section === 'body') {
                            // Only draw on the first row of the span to avoid repetition/clipping issues?
                            // Actually autoTable handles rowSpan cells by drawing them once.
                            try {
                                const imgProps = doc.getImageProperties(cellData.image);
                                const cellWidth = data.cell.width;
                                const cellHeight = data.cell.height;
                                // Fit image
                                const padding = 2;
                                const availW = cellWidth - (padding * 2);
                                const availH = cellHeight - (padding * 2);

                                doc.addImage(cellData.image, 'PNG',
                                    data.cell.x + padding,
                                    data.cell.y + padding,
                                    availW,
                                    availH,
                                    undefined,
                                    'FAST'
                                );
                            } catch (e) {
                                // console.error('Error drawing image', e);
                            }
                        }
                    }
                }
            });

            doc.save(`RVCE_Proforma_${selectedSport || 'All'}.pdf`);
            toast.success('PDF Proforma downloaded!');
        } catch (error) {
            console.error("PDF Export Error:", error);
            toast.error(`PDF export failed: ${error.message}`);
        } finally {
            setDownloading(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-end justify-between border-b border-slate-700 pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Download className="w-7 h-7 text-blue-500" />
                        Export Data (Proforma)
                    </h1>
                    <p className="text-slate-400 mt-1">Download official eligibility proforma with images</p>
                </div>
            </div>

            <div className="card p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Filter className="w-5 h-5 text-slate-400" />
                    <h2 className="text-lg font-semibold text-white">Filter Options</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Sport/Game</label>
                        <select value={selectedSport} onChange={e => setSelectedSport(e.target.value)} className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white">
                            <option value="">All Sports</option>
                            {sports.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* Export Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button
                    onClick={exportToExcel}
                    disabled={!!downloading || loading || submissions.length === 0}
                    className="card p-8 border-2 border-slate-700 hover:border-green-500 transition-all group text-left relative overflow-hidden"
                >
                    <div className="flex items-center gap-6 relative z-10">
                        <div className="w-20 h-20 bg-green-500/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            {downloading === 'excel' ? (
                                <Loader2 className="w-10 h-10 text-green-400 animate-spin" />
                            ) : (
                                <FileSpreadsheet className="w-10 h-10 text-green-400" />
                            )}
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-white">Download Proforma Excel</h3>
                            <p className="text-slate-400 mt-2 text-sm">
                                Official "Identity/Eligibility Proforma" with merged rows, photos, and college header.
                            </p>
                        </div>
                    </div>
                </button>

                <button
                    onClick={exportToPDF}
                    disabled={!!downloading || loading || submissions.length === 0}
                    className="card p-8 border-2 border-slate-700 hover:border-red-500 transition-all group text-left relative overflow-hidden"
                >
                    <div className="flex items-center gap-6 relative z-10">
                        <div className="w-20 h-20 bg-red-500/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            {downloading === 'pdf' ? (
                                <Loader2 className="w-10 h-10 text-red-400 animate-spin" />
                            ) : (
                                <FileText className="w-10 h-10 text-red-400" />
                            )}
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-white">Download Student List PDF</h3>
                            <p className="text-slate-400 mt-2 text-sm">
                                Simple printable list of selected students for quick reference.
                            </p>
                        </div>
                    </div>
                </button>
            </div>
        </div>
    );
}
