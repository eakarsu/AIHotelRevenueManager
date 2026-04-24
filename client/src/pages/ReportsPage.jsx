import { useState, useEffect } from 'react';
import { FileText, Download, Filter } from 'lucide-react';
import * as api from '../services/api';

const REPORT_TYPES = [
  { key: 'revenue', label: 'Revenue Report' },
  { key: 'reservations', label: 'Reservations Report' },
  { key: 'rooms', label: 'Room Occupancy Report' },
  { key: 'billing', label: 'Billing Report' },
];

const EXPORT_TYPES = [
  { key: 'reservations', label: 'Reservations' },
  { key: 'rooms', label: 'Rooms' },
  { key: 'revenue', label: 'Revenue/Analytics' },
  { key: 'billing', label: 'Billing/Invoices' },
  { key: 'guests', label: 'Guests' },
  { key: 'staff', label: 'Staff' },
];

export default function ReportsPage() {
  const [activeReport, setActiveReport] = useState('revenue');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [exporting, setExporting] = useState('');

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      const data = await api.getReport(activeReport, params.toString());
      setReportData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReport(); }, [activeReport]);

  const handleExport = async (type) => {
    try {
      setExporting(type);
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/reports/export/${type}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}_export.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
    } finally {
      setExporting('');
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString() : '-';

  const renderSummary = () => {
    if (!reportData?.summary) return null;
    const s = reportData.summary;
    const cards = [];

    if (activeReport === 'revenue') {
      cards.push({ label: 'Total Revenue', value: `$${Number(s.totalRevenue).toFixed(2)}` });
      cards.push({ label: 'Avg Occupancy', value: `${Number(s.avgOccupancy).toFixed(1)}%` });
      cards.push({ label: 'Avg ADR', value: `$${Number(s.avgAdr).toFixed(2)}` });
      cards.push({ label: 'Total Bookings', value: s.totalBookings });
      cards.push({ label: 'Cancellations', value: s.totalCancellations });
      cards.push({ label: 'Records', value: s.records });
    } else if (activeReport === 'reservations') {
      cards.push({ label: 'Total Reservations', value: s.totalReservations });
      cards.push({ label: 'Total Revenue', value: `$${Number(s.totalRevenue).toFixed(2)}` });
      cards.push({ label: 'Total Nights', value: s.totalNights });
    } else if (activeReport === 'rooms') {
      cards.push({ label: 'Total Rooms', value: s.totalRooms });
      if (s.statusCounts) {
        Object.entries(s.statusCounts).forEach(([status, count]) => {
          cards.push({ label: status.charAt(0).toUpperCase() + status.slice(1), value: count });
        });
      }
    } else if (activeReport === 'billing') {
      cards.push({ label: 'Total Invoices', value: s.totalInvoices });
      cards.push({ label: 'Total Billed', value: `$${Number(s.totalBilled).toFixed(2)}` });
      cards.push({ label: 'Paid', value: `$${Number(s.paidAmount).toFixed(2)}` });
      cards.push({ label: 'Pending', value: `$${Number(s.pendingAmount).toFixed(2)}` });
    }

    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
        {cards.map((c, i) => (
          <div key={i} style={{ background: 'var(--card-bg)', padding: 16, borderRadius: 10, border: '1px solid var(--border)', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 4 }}>{c.label}</p>
            <h3 style={{ fontSize: 20, margin: 0 }}>{c.value}</h3>
          </div>
        ))}
      </div>
    );
  };

  const renderTable = () => {
    if (!reportData?.data || reportData.data.length === 0) {
      return <p style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>No data available for this report.</p>;
    }

    const columns = Object.keys(reportData.data[0]).filter(k => k !== 'id' && k !== '_id');

    return (
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col}>{col.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {reportData.data.map((row, i) => (
              <tr key={i}>
                {columns.map((col) => (
                  <td key={col}>
                    {col.includes('date') || col.includes('check_in') || col.includes('check_out') || col.includes('created_at')
                      ? formatDate(row[col])
                      : col.includes('price') || col.includes('revenue') || col.includes('amount') || col.includes('charges') || col.includes('rate') || col.includes('adr') || col.includes('revpar') || col.includes('salary') || col.includes('cost')
                        ? (row[col] !== null ? `$${Number(row[col]).toFixed(2)}` : '-')
                        : (row[col] !== null && row[col] !== undefined ? String(row[col]) : '-')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-row">
          <h1 className="page-title"><FileText size={28} style={{ verticalAlign: 'middle', marginRight: 8 }} />Reports & Export</h1>
        </div>
        <p>Generate reports and export data to CSV</p>
      </div>

      {/* Report Type Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {REPORT_TYPES.map((r) => (
          <button
            key={r.key}
            className={`btn ${activeReport === r.key ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveReport(r.key)}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Date Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">Start Date</label>
          <input className="form-input" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">End Date</label>
          <input className="form-input" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <button className="btn btn-primary" onClick={fetchReport}><Filter size={16} /> Apply Filters</button>
      </div>

      {error && <div className="error-message" style={{ color: 'var(--danger)', marginBottom: 16 }}>{error}</div>}

      {loading ? (
        <div className="spinner-container"><div className="spinner loading-spinner" /></div>
      ) : (
        <>
          {renderSummary()}
          {renderTable()}
        </>
      )}

      {/* CSV Export Section */}
      <div style={{ marginTop: 40 }}>
        <h2 style={{ fontSize: 20, marginBottom: 16 }}><Download size={20} style={{ verticalAlign: 'middle', marginRight: 8 }} />CSV Export</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          {EXPORT_TYPES.map((t) => (
            <button
              key={t.key}
              className="btn btn-secondary"
              onClick={() => handleExport(t.key)}
              disabled={exporting === t.key}
              style={{ padding: '12px 16px', justifyContent: 'center' }}
            >
              <Download size={16} />
              {exporting === t.key ? 'Exporting...' : `Export ${t.label}`}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
