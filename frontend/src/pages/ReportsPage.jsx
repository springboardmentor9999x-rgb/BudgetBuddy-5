import React, { useState } from 'react';
import Layout from '../components/Layout/Layout';
import api from '../services/api';
import { 
  FileText, 
  Download, 
  FileSpreadsheet, 
  FileType, 
  Calendar
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

const ReportsPage = () => {
  const { showToast } = useToast();
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [downloading, setDownloading] = useState('');

  const handleExport = async (type) => {
    setDownloading(type);
    try {
      let endpoint = `/reports/${type}?month=${selectedMonth}`;
      const response = await api.get(endpoint, { responseType: 'blob' });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;

      const extMap = { excel: 'xlsx', pdf: 'pdf' };
      link.setAttribute('download', `budgetbuddy_report_${selectedMonth}.${extMap[type]}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      showToast(`${type.toUpperCase()} report downloaded successfully`, 'success');
    } catch (err) {
      showToast(`Failed to export ${type.toUpperCase()} report.`, 'error');
    } finally {
      setDownloading('');
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 mb-1">
              <FileText className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Reports & Exports</span>
            </div>
            <h2 className="text-2xl font-extrabold text-white">Generate Financial Reports</h2>
            <p className="text-xs text-slate-400 mt-1">Export transaction history and monthly statements in PDF or Excel format.</p>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Export Cards Grid (PDF and Excel Only) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
          {/* PDF Report Card */}
          <div className="glass-card glass-card-hover p-6 rounded-3xl border border-slate-800 flex flex-col justify-between space-y-4">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-3">
                <FileType className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-100">PDF Financial Summary</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Formatted print-ready document containing financial metrics, income vs expense totals, and itemized transaction tables.
              </p>
            </div>
            <button
              onClick={() => handleExport('pdf')}
              disabled={!!downloading}
              className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {downloading === 'pdf' ? 'Generating PDF...' : 'Download PDF Statement'}
            </button>
          </div>

          {/* Excel Report Card */}
          <div className="glass-card glass-card-hover p-6 rounded-3xl border border-slate-800 flex flex-col justify-between space-y-4">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-100">Excel Workbook (.XLSX)</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Multi-sheet Excel workbook separating Expenses and Income records into structured tabular sheets for financial analysis.
              </p>
            </div>
            <button
              onClick={() => handleExport('excel')}
              disabled={!!downloading}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {downloading === 'excel' ? 'Generating Excel...' : 'Download Excel File'}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ReportsPage;
