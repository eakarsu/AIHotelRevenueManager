import { useState, useEffect, useCallback } from 'react';
import { Receipt, Plus, Edit, Trash2, Printer } from 'lucide-react';
import Modal from '../components/Modal';
import * as api from '../services/api';

const PAYMENT_METHODS = ['Credit Card', 'Debit Card', 'Cash', 'Bank Transfer', 'Online Payment'];
const PAYMENT_STATUSES = ['Pending', 'Paid', 'Partially Paid', 'Overdue', 'Refunded'];

const statusBadge = {
  Pending: 'badge-warning',
  Paid: 'badge-success',
  'Partially Paid': 'badge-info',
  Overdue: 'badge-danger',
  Refunded: 'badge-purple',
};

const emptyForm = {
  reservation_id: '',
  guest_name: '',
  guest_email: '',
  room_number: '',
  check_in: '',
  check_out: '',
  nights: '',
  room_charges: '',
  tax_rate: '10',
  tax_amount: '',
  additional_charges: '0',
  discounts: '0',
  total_amount: '',
  payment_method: 'Credit Card',
  payment_status: 'Pending',
  notes: '',
};

export default function BillingPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getInvoices();
      setInvoices(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => {
      const updated = { ...f, [name]: value };
      if (['room_charges', 'tax_rate', 'additional_charges', 'discounts'].includes(name)) {
        const roomCharges = Number(updated.room_charges) || 0;
        const taxRate = Number(updated.tax_rate) || 0;
        const additional = Number(updated.additional_charges) || 0;
        const discounts = Number(updated.discounts) || 0;
        const taxAmount = (roomCharges * taxRate / 100);
        updated.tax_amount = taxAmount.toFixed(2);
        updated.total_amount = (roomCharges + taxAmount + additional - discounts).toFixed(2);
      }
      return updated;
    });
  };

  const openCreate = () => { setForm(emptyForm); setShowCreate(true); };

  const openDetail = async (invoice) => {
    try {
      const data = await api.getInvoice(invoice._id || invoice.id);
      const detail = data.data || data;
      setSelected(detail);
      setForm({
        reservation_id: detail.reservation_id || '',
        guest_name: detail.guest_name || '',
        guest_email: detail.guest_email || '',
        room_number: detail.room_number || '',
        check_in: detail.check_in ? detail.check_in.substring(0, 10) : '',
        check_out: detail.check_out ? detail.check_out.substring(0, 10) : '',
        nights: detail.nights || '',
        room_charges: detail.room_charges || '',
        tax_rate: detail.tax_rate || '10',
        tax_amount: detail.tax_amount || '',
        additional_charges: detail.additional_charges || '0',
        discounts: detail.discounts || '0',
        total_amount: detail.total_amount || '',
        payment_method: detail.payment_method || 'Credit Card',
        payment_status: detail.payment_status || 'Pending',
        notes: detail.notes || '',
      });
      setEditing(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = { ...form, nights: Number(form.nights), room_charges: Number(form.room_charges), tax_rate: Number(form.tax_rate), tax_amount: Number(form.tax_amount), additional_charges: Number(form.additional_charges), discounts: Number(form.discounts), total_amount: Number(form.total_amount) };
      await api.createInvoice(payload);
      setShowCreate(false);
      fetchInvoices();
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = { ...form, nights: Number(form.nights), room_charges: Number(form.room_charges), tax_rate: Number(form.tax_rate), tax_amount: Number(form.tax_amount), additional_charges: Number(form.additional_charges), discounts: Number(form.discounts), total_amount: Number(form.total_amount) };
      await api.updateInvoice(selected._id || selected.id, payload);
      setSelected(null);
      setEditing(false);
      fetchInvoices();
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this invoice?')) return;
    try {
      setSaving(true);
      await api.deleteInvoice(selected._id || selected.id);
      setSelected(null);
      fetchInvoices();
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html><head><title>Invoice ${selected.invoice_number}</title>
      <style>body{font-family:Arial,sans-serif;padding:40px;max-width:800px;margin:auto}
      h1{color:#1a1a2e;border-bottom:2px solid #1a1a2e;padding-bottom:10px}
      table{width:100%;border-collapse:collapse;margin:20px 0}
      th,td{border:1px solid #ddd;padding:10px;text-align:left}
      th{background:#f5f5f5}
      .total{font-size:18px;font-weight:bold;text-align:right;margin-top:20px}
      .header{display:flex;justify-content:space-between;align-items:center}
      </style></head><body>
      <div class="header"><h1>INVOICE</h1><div><strong>${selected.invoice_number}</strong><br/>Date: ${new Date(selected.created_at).toLocaleDateString()}</div></div>
      <table><tr><th>Guest</th><td>${selected.guest_name}</td><th>Email</th><td>${selected.guest_email || '-'}</td></tr>
      <tr><th>Room</th><td>${selected.room_number}</td><th>Nights</th><td>${selected.nights}</td></tr>
      <tr><th>Check-in</th><td>${selected.check_in ? new Date(selected.check_in).toLocaleDateString() : '-'}</td><th>Check-out</th><td>${selected.check_out ? new Date(selected.check_out).toLocaleDateString() : '-'}</td></tr></table>
      <table><tr><th>Description</th><th>Amount</th></tr>
      <tr><td>Room Charges</td><td>$${Number(selected.room_charges).toFixed(2)}</td></tr>
      <tr><td>Tax (${selected.tax_rate}%)</td><td>$${Number(selected.tax_amount).toFixed(2)}</td></tr>
      <tr><td>Additional Charges</td><td>$${Number(selected.additional_charges).toFixed(2)}</td></tr>
      <tr><td>Discounts</td><td>-$${Number(selected.discounts).toFixed(2)}</td></tr></table>
      <p class="total">Total: $${Number(selected.total_amount).toFixed(2)}</p>
      <p><strong>Payment Method:</strong> ${selected.payment_method} | <strong>Status:</strong> ${selected.payment_status}</p>
      ${selected.notes ? `<p><strong>Notes:</strong> ${selected.notes}</p>` : ''}
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString() : '-';

  const totalRevenue = invoices.reduce((sum, i) => sum + Number(i.total_amount || 0), 0);
  const paidCount = invoices.filter(i => i.payment_status === 'Paid').length;
  const pendingCount = invoices.filter(i => i.payment_status === 'Pending').length;

  const renderForm = (onSubmit, submitLabel) => (
    <form onSubmit={onSubmit}>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Guest Name</label>
          <input className="form-input" name="guest_name" value={form.guest_name} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label className="form-label">Guest Email</label>
          <input className="form-input" name="guest_email" type="email" value={form.guest_email} onChange={handleChange} />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Room Number</label>
          <input className="form-input" name="room_number" value={form.room_number} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label className="form-label">Nights</label>
          <input className="form-input" name="nights" type="number" value={form.nights} onChange={handleChange} required />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Check-in</label>
          <input className="form-input" name="check_in" type="date" value={form.check_in} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label className="form-label">Check-out</label>
          <input className="form-input" name="check_out" type="date" value={form.check_out} onChange={handleChange} />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Room Charges ($)</label>
          <input className="form-input" name="room_charges" type="number" step="0.01" value={form.room_charges} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label className="form-label">Tax Rate (%)</label>
          <input className="form-input" name="tax_rate" type="number" step="0.01" value={form.tax_rate} onChange={handleChange} />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Additional Charges ($)</label>
          <input className="form-input" name="additional_charges" type="number" step="0.01" value={form.additional_charges} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label className="form-label">Discounts ($)</label>
          <input className="form-input" name="discounts" type="number" step="0.01" value={form.discounts} onChange={handleChange} />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Tax Amount ($)</label>
          <input className="form-input" name="tax_amount" type="number" step="0.01" value={form.tax_amount} readOnly style={{ background: '#f0f0f0' }} />
        </div>
        <div className="form-group">
          <label className="form-label">Total Amount ($)</label>
          <input className="form-input" name="total_amount" type="number" step="0.01" value={form.total_amount} readOnly style={{ background: '#f0f0f0', fontWeight: 'bold' }} />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Payment Method</label>
          <select className="form-select" name="payment_method" value={form.payment_method} onChange={handleChange}>
            {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Payment Status</label>
          <select className="form-select" name="payment_status" value={form.payment_status} onChange={handleChange}>
            {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Notes</label>
        <textarea className="form-textarea" name="notes" value={form.notes} onChange={handleChange} />
      </div>
      <div className="modal-actions" style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn-secondary" onClick={() => { setShowCreate(false); setSelected(null); setEditing(false); }}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : submitLabel}</button>
      </div>
    </form>
  );

  return (
    <div>
      <div className="page-header">
        <div className="page-header-row">
          <h1 className="page-title"><Receipt size={28} style={{ verticalAlign: 'middle', marginRight: 8 }} />Billing & Invoicing</h1>
          <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> New Invoice</button>
        </div>
        <p>Manage guest invoices, payments, and billing</p>
      </div>

      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="stat-card" style={{ background: 'var(--card-bg)', padding: 20, borderRadius: 12, border: '1px solid var(--border)' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Total Invoices</p>
          <h3 style={{ fontSize: 24, margin: '4px 0' }}>{invoices.length}</h3>
        </div>
        <div className="stat-card" style={{ background: 'var(--card-bg)', padding: 20, borderRadius: 12, border: '1px solid var(--border)' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Total Billed</p>
          <h3 style={{ fontSize: 24, margin: '4px 0' }}>${totalRevenue.toFixed(2)}</h3>
        </div>
        <div className="stat-card" style={{ background: 'var(--card-bg)', padding: 20, borderRadius: 12, border: '1px solid var(--border)' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Paid</p>
          <h3 style={{ fontSize: 24, margin: '4px 0', color: 'var(--success)' }}>{paidCount}</h3>
        </div>
        <div className="stat-card" style={{ background: 'var(--card-bg)', padding: 20, borderRadius: 12, border: '1px solid var(--border)' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Pending</p>
          <h3 style={{ fontSize: 24, margin: '4px 0', color: 'var(--warning)' }}>{pendingCount}</h3>
        </div>
      </div>

      {error && <div className="error-message" style={{ color: 'var(--danger)', marginBottom: 16 }}>{error}</div>}

      {loading ? (
        <div className="spinner-container"><div className="spinner loading-spinner" /></div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Guest Name</th>
                <th>Room</th>
                <th>Nights</th>
                <th>Total Amount</th>
                <th>Payment Method</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40 }}>No invoices found. Create your first invoice.</td></tr>
              ) : invoices.map((inv) => (
                <tr key={inv._id || inv.id} onClick={() => openDetail(inv)} style={{ cursor: 'pointer' }}>
                  <td><strong>{inv.invoice_number}</strong></td>
                  <td>{inv.guest_name}</td>
                  <td>{inv.room_number}</td>
                  <td>{inv.nights}</td>
                  <td>${Number(inv.total_amount).toFixed(2)}</td>
                  <td>{inv.payment_method}</td>
                  <td><span className={`badge ${statusBadge[inv.payment_status] || 'badge-neutral'}`}>{inv.payment_status}</span></td>
                  <td>{formatDate(inv.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <Modal title="New Invoice" onClose={() => setShowCreate(false)}>
          {renderForm(handleCreate, 'Create Invoice')}
        </Modal>
      )}

      {selected && (
        <Modal title={editing ? 'Edit Invoice' : `Invoice - ${selected.invoice_number}`} onClose={() => { setSelected(null); setEditing(false); }}>
          {editing ? renderForm(handleUpdate, 'Update Invoice') : (
            <div>
              <div className="form-row" style={{ marginBottom: 16 }}>
                <div><span className="form-label">Invoice #</span><p>{selected.invoice_number}</p></div>
                <div><span className="form-label">Date</span><p>{formatDate(selected.created_at)}</p></div>
              </div>
              <div className="form-row" style={{ marginBottom: 16 }}>
                <div><span className="form-label">Guest Name</span><p>{selected.guest_name}</p></div>
                <div><span className="form-label">Guest Email</span><p>{selected.guest_email || '-'}</p></div>
              </div>
              <div className="form-row" style={{ marginBottom: 16 }}>
                <div><span className="form-label">Room</span><p>{selected.room_number}</p></div>
                <div><span className="form-label">Nights</span><p>{selected.nights}</p></div>
              </div>
              <div className="form-row" style={{ marginBottom: 16 }}>
                <div><span className="form-label">Check-in</span><p>{formatDate(selected.check_in)}</p></div>
                <div><span className="form-label">Check-out</span><p>{formatDate(selected.check_out)}</p></div>
              </div>
              <hr style={{ margin: '16px 0', borderColor: 'var(--border)' }} />
              <div className="form-row" style={{ marginBottom: 12 }}>
                <div><span className="form-label">Room Charges</span><p>${Number(selected.room_charges).toFixed(2)}</p></div>
                <div><span className="form-label">Tax ({selected.tax_rate}%)</span><p>${Number(selected.tax_amount).toFixed(2)}</p></div>
              </div>
              <div className="form-row" style={{ marginBottom: 12 }}>
                <div><span className="form-label">Additional Charges</span><p>${Number(selected.additional_charges).toFixed(2)}</p></div>
                <div><span className="form-label">Discounts</span><p>-${Number(selected.discounts).toFixed(2)}</p></div>
              </div>
              <div style={{ textAlign: 'right', fontSize: 20, fontWeight: 'bold', margin: '16px 0' }}>
                Total: ${Number(selected.total_amount).toFixed(2)}
              </div>
              <div className="form-row" style={{ marginBottom: 16 }}>
                <div><span className="form-label">Payment Method</span><p>{selected.payment_method}</p></div>
                <div><span className="form-label">Status</span><p><span className={`badge ${statusBadge[selected.payment_status] || 'badge-neutral'}`}>{selected.payment_status}</span></p></div>
              </div>
              {selected.notes && <div style={{ marginBottom: 16 }}><span className="form-label">Notes</span><p>{selected.notes}</p></div>}
              <div className="modal-actions" style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button className="btn btn-danger" onClick={handleDelete} disabled={saving}><Trash2 size={16} /> Delete</button>
                <button className="btn btn-secondary" onClick={handlePrint}><Printer size={16} /> Print</button>
                <button className="btn btn-primary" onClick={() => setEditing(true)}><Edit size={16} /> Edit</button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
