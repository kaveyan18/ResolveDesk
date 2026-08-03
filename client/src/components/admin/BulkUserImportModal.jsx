import { useState, useRef } from 'react';
import { api } from '../../services/api';
import {
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  Users,
  AlertTriangle,
} from 'lucide-react';

export default function BulkUserImportModal({ onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [parsedRows, setParsedRows] = useState([]);
  const [parseError, setParseError] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [resultSummary, setResultSummary] = useState(null);
  const fileInputRef = useRef(null);

  // 1. Generate & Download Sample CSV Template
  const handleDownloadTemplate = () => {
    const csvContent =
      'Name,Email,Role,Password,Phone,Department,Skills\n' +
      'Rahul Sharma,rahul.student@college.edu,Student,Student123!,9876543210,CS,\n' +
      'Anita Roy,anita.tech@college.edu,Technician,TechPass123,9876543211,Electrical,"Wiring, AC Repair"\n' +
      'Suresh Head,suresh.head@college.edu,DepartmentHead,HeadPass123,9876543212,CS,\n' +
      'Admin User,new.admin@college.edu,Admin,AdminPass123,9876543213,,\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'resolvedesk_users_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 2. CSV Parser supporting quoted fields & commas
  const parseCSVText = (text) => {
    const lines = [];
    let currentRow = [];
    let currentField = '';
    let insideQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"') {
        if (insideQuotes && nextChar === '"') {
          currentField += '"';
          i++; // skip escaped quote
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === ',' && !insideQuotes) {
        currentRow.push(currentField.trim());
        currentField = '';
      } else if ((char === '\r' || char === '\n') && !insideQuotes) {
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
        currentRow.push(currentField.trim());
        if (currentRow.some((field) => field.length > 0)) {
          lines.push(currentRow);
        }
        currentRow = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }

    if (currentField || currentRow.length > 0) {
      currentRow.push(currentField.trim());
      if (currentRow.some((field) => field.length > 0)) {
        lines.push(currentRow);
      }
    }

    if (lines.length < 2) {
      throw new Error('CSV file must contain a header row and at least one data row.');
    }

    const headers = lines[0].map((h) => h.toLowerCase().trim());
    const dataRows = lines.slice(1);

    const nameIdx = headers.findIndex((h) => h.includes('name'));
    const emailIdx = headers.findIndex((h) => h.includes('email'));
    const roleIdx = headers.findIndex((h) => h.includes('role'));
    const passwordIdx = headers.findIndex((h) => h.includes('pass'));
    const phoneIdx = headers.findIndex((h) => h.includes('phone') || h.includes('mobile'));
    const deptIdx = headers.findIndex((h) => h.includes('dept') || h.includes('department'));
    const skillsIdx = headers.findIndex((h) => h.includes('skill'));

    if (nameIdx === -1 || emailIdx === -1) {
      throw new Error('CSV headers must include at least "Name" and "Email" columns.');
    }

    return dataRows.map((row, idx) => {
      const name = row[nameIdx] || '';
      const email = row[emailIdx] || '';
      const role = roleIdx !== -1 && row[roleIdx] ? row[roleIdx] : 'Student';
      const password = passwordIdx !== -1 && row[passwordIdx] ? row[passwordIdx] : '';
      const phone = phoneIdx !== -1 && row[phoneIdx] ? row[phoneIdx] : '';
      const department = deptIdx !== -1 && row[deptIdx] ? row[deptIdx] : '';
      const skills = skillsIdx !== -1 && row[skillsIdx] ? row[skillsIdx] : '';

      return {
        id: idx + 1,
        name,
        email,
        role,
        password,
        phone,
        department,
        skills,
        isValid: Boolean(name && email),
      };
    });
  };

  // 3. Handle File Selection
  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setParseError(null);
    setResultSummary(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result;
        const rows = parseCSVText(text);
        setParsedRows(rows);
      } catch (err) {
        setParseError(err.message || 'Failed to parse CSV file format.');
        setParsedRows([]);
      }
    };
    reader.onerror = () => {
      setParseError('Error reading file content.');
    };
    reader.readAsText(selectedFile);
  };

  // 4. Submit to Backend API
  const handleImportSubmit = async () => {
    if (parsedRows.length === 0) return;

    try {
      setIsImporting(true);
      setParseError(null);

      const payload = parsedRows.map((r) => ({
        name: r.name,
        email: r.email,
        role: r.role,
        password: r.password || undefined,
        phone: r.phone,
        department: r.department,
        skills: r.skills,
      }));

      const res = await api.bulkImportAdminUsers(payload);
      if (res.status === 'success' && res.data) {
        setResultSummary(res.data);
      } else {
        setParseError(res.message || 'Bulk import failed.');
      }
    } catch (err) {
      console.error('Bulk import error:', err);
      setErrorMessage?.(err.message || 'Server error occurred during bulk import.');
      setParseError(err.message || 'Server error occurred during bulk import.');
    } finally {
      setIsImporting(false);
    }
  };

  const validCount = parsedRows.filter((r) => r.isValid).length;
  const invalidCount = parsedRows.filter((r) => !r.isValid).length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-surface-border animate-in fade-in zoom-in duration-200">
        {/* MODAL HEADER */}
        <div className="p-5 border-b border-surface-border flex items-center justify-between bg-surface-bg/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-soft text-brand flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-ink">Bulk User CSV Import</h2>
              <p className="text-xs text-ink-muted">
                Add multiple Students, Technicians, Department Heads, or Admins at once
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-ink-muted hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* STEP 1: Download Template Banner */}
          <div className="p-4 rounded-xl bg-brand-soft/60 border border-brand/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <Download className="w-5 h-5 text-brand flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-ink">Need the CSV Template?</p>
                <p className="text-[11px] text-ink-muted mt-0.5">
                  Download our sample CSV file pre-formatted with all required user role headers.
                </p>
              </div>
            </div>

            <button
              onClick={handleDownloadTemplate}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-brand/30 text-brand hover:bg-brand hover:text-white text-xs font-semibold shadow-xs transition cursor-pointer flex-shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download CSV Template</span>
            </button>
          </div>

          {/* PARSE ERROR ALERT */}
          {parseError && (
            <div className="p-4 rounded-xl bg-status-danger/10 border border-status-danger/20 text-status-danger flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-xs font-medium">{parseError}</p>
            </div>
          )}

          {/* IMPORT SUMMARY RESULTS SCREEN */}
          {resultSummary ? (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-sm font-bold">Import Batch Processing Complete</h3>
                </div>
                <div className="grid grid-cols-3 gap-3 pt-2 text-center">
                  <div className="bg-white p-3 rounded-xl border border-emerald-200">
                    <p className="text-xs text-slate-500 font-medium">Total Rows</p>
                    <p className="text-lg font-bold text-slate-900">{resultSummary.total}</p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-emerald-200">
                    <p className="text-xs text-emerald-600 font-medium">Created</p>
                    <p className="text-lg font-bold text-emerald-700">{resultSummary.createdCount}</p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-emerald-200">
                    <p className="text-xs text-rose-500 font-medium">Skipped / Failed</p>
                    <p className="text-lg font-bold text-rose-700">{resultSummary.failedCount}</p>
                  </div>
                </div>
              </div>

              {/* ERROR LIST TABLE IF ANY SKIPPED */}
              {resultSummary.errors && resultSummary.errors.length > 0 && (
                <div className="border border-surface-border rounded-xl overflow-hidden">
                  <div className="bg-slate-50 px-4 py-2 border-b border-surface-border flex items-center justify-between">
                    <span className="text-xs font-bold text-ink flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-status-warning" />
                      Row Processing Details & Skipped Records
                    </span>
                    <span className="text-[11px] text-ink-muted">
                      {resultSummary.errors.length} issue(s) found
                    </span>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-slate-100/70 text-ink-muted text-[11px] uppercase tracking-wider sticky top-0">
                        <tr>
                          <th className="py-2 px-3">Row</th>
                          <th className="py-2 px-3">Email</th>
                          <th className="py-2 px-3">Reason</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-border">
                        {resultSummary.errors.map((err, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-2 px-3 font-mono text-[11px]">{err.row}</td>
                            <td className="py-2 px-3 text-ink font-medium">{err.email || '—'}</td>
                            <td className="py-2 px-3 text-status-danger">{err.error}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* STEP 2: File Upload Dropzone */}
              {!file ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-brand rounded-2xl p-8 text-center bg-slate-50/50 hover:bg-brand-soft/20 transition cursor-pointer group"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".csv,text/csv"
                    className="hidden"
                  />
                  <div className="w-12 h-12 rounded-full bg-white shadow-sm border border-slate-200 text-slate-400 group-hover:text-brand group-hover:scale-110 flex items-center justify-center mx-auto transition">
                    <Upload className="w-6 h-6 stroke-[1.8]" />
                  </div>
                  <p className="text-xs font-bold text-ink mt-3">
                    Click to select CSV file or drag and drop
                  </p>
                  <p className="text-[11px] text-ink-muted mt-1">
                    Supports .csv files with student, technician, head & admin user records
                  </p>
                </div>
              ) : (
                /* STEP 3: Preview Table of Parsed CSV Rows */
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-ink">
                        Parsed File Records ({parsedRows.length})
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                        {validCount} Ready
                      </span>
                      {invalidCount > 0 && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold">
                          {invalidCount} Invalid
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        setFile(null);
                        setParsedRows([]);
                      }}
                      className="text-xs text-brand hover:underline font-semibold cursor-pointer"
                    >
                      Choose Different File
                    </button>
                  </div>

                  <div className="border border-surface-border rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-ink-muted text-[11px] uppercase tracking-wider sticky top-0">
                        <tr>
                          <th className="py-2.5 px-3">#</th>
                          <th className="py-2.5 px-3">Name</th>
                          <th className="py-2.5 px-3">Email</th>
                          <th className="py-2.5 px-3">Role</th>
                          <th className="py-2.5 px-3">Dept</th>
                          <th className="py-2.5 px-3">Password</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-border bg-white">
                        {parsedRows.map((row) => (
                          <tr
                            key={row.id}
                            className={row.isValid ? 'hover:bg-slate-50' : 'bg-rose-50/50'}
                          >
                            <td className="py-2 px-3 font-mono text-[11px] text-ink-muted">
                              {row.id}
                            </td>
                            <td className="py-2 px-3 font-semibold text-ink">{row.name || '—'}</td>
                            <td className="py-2 px-3 text-ink-muted">{row.email || '—'}</td>
                            <td className="py-2 px-3">
                              <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                                {row.role}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-ink-muted">{row.department || '—'}</td>
                            <td className="py-2 px-3 text-ink-muted font-mono text-[11px]">
                              {row.password ? '••••••' : '(Default)'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 border-t border-surface-border bg-surface-bg/50 flex items-center justify-end gap-3">
          {resultSummary ? (
            <button
              onClick={() => {
                onSuccess();
                onClose();
              }}
              className="px-5 py-2.5 rounded-xl bg-brand text-white font-semibold text-xs hover:bg-brand-dark transition cursor-pointer shadow-sm"
            >
              Done & Refresh Users List
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                disabled={isImporting}
                className="px-4 py-2 rounded-xl text-ink-muted hover:bg-slate-200 text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              {file && (
                <button
                  type="button"
                  onClick={handleImportSubmit}
                  disabled={isImporting || parsedRows.length === 0 || validCount === 0}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-brand text-white font-semibold text-xs hover:bg-brand-dark disabled:opacity-50 transition cursor-pointer shadow-sm"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Importing Batch...</span>
                    </>
                  ) : (
                    <>
                      <Users className="w-4 h-4" />
                      <span>Import {validCount} Users</span>
                    </>
                  )}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
