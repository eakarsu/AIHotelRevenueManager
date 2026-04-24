import { useState, useEffect, useCallback } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import * as api from '../services/api';

const statusColors = {
  Confirmed: '#22c55e',
  Pending: '#f59e0b',
  'Checked In': '#3b82f6',
  'Checked Out': '#8b5cf6',
  Cancelled: '#ef4444',
};

export default function CalendarPage() {
  const [reservations, setReservations] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedRes, setSelectedRes] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [resData, roomData] = await Promise.all([api.getReservations(), api.getRooms()]);
      setReservations(Array.isArray(resData) ? resData : resData.data || []);
      setRooms(Array.isArray(roomData) ? roomData : roomData.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToday = () => setCurrentDate(new Date());

  const getReservationsForDay = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return reservations.filter((r) => {
      const checkIn = r.check_in?.substring(0, 10);
      const checkOut = r.check_out?.substring(0, 10);
      return checkIn <= dateStr && checkOut >= dateStr;
    });
  };

  const isToday = (day) => {
    const today = new Date();
    return day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString() : '-';

  // Room availability grid data
  const dates = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const roomNumbers = [...new Set(rooms.map(r => r.room_number))].sort();

  const getRoomStatusForDay = (roomNum, day) => {
    const dayRes = getReservationsForDay(day).filter(r => r.room_number === roomNum);
    if (dayRes.length === 0) return null;
    return dayRes[0];
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-row">
          <h1 className="page-title"><CalendarDays size={28} style={{ verticalAlign: 'middle', marginRight: 8 }} />Reservation Calendar</h1>
        </div>
        <p>Visual overview of reservations and room availability</p>
      </div>

      {error && <div className="error-message" style={{ color: 'var(--danger)', marginBottom: 16 }}>{error}</div>}

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        {Object.entries(statusColors).map(([status, color]) => (
          <div key={status} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: color }} />
            {status}
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
          <div style={{ width: 12, height: 12, borderRadius: 3, background: '#e5e7eb' }} />
          Available
        </div>
      </div>

      {loading ? (
        <div className="spinner-container"><div className="spinner loading-spinner" /></div>
      ) : (
        <>
          {/* Monthly Calendar View */}
          <div style={{ background: 'var(--card-bg)', borderRadius: 12, border: '1px solid var(--border)', padding: 20, marginBottom: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <button className="btn btn-secondary" onClick={prevMonth}><ChevronLeft size={16} /></button>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <h2 style={{ fontSize: 20, margin: 0 }}>{monthName}</h2>
                <button className="btn btn-secondary" onClick={goToday} style={{ fontSize: 12 }}>Today</button>
              </div>
              <button className="btn btn-secondary" onClick={nextMonth}><ChevronRight size={16} /></button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <div key={d} style={{ textAlign: 'center', fontWeight: 600, padding: 8, fontSize: 13, color: 'var(--text-secondary)' }}>{d}</div>
              ))}
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {dates.map((day) => {
                const dayReservations = getReservationsForDay(day);
                return (
                  <div
                    key={day}
                    style={{
                      minHeight: 80,
                      border: `1px solid ${isToday(day) ? 'var(--primary)' : 'var(--border)'}`,
                      borderRadius: 8,
                      padding: 6,
                      background: isToday(day) ? 'rgba(99, 102, 241, 0.05)' : 'transparent',
                      cursor: dayReservations.length > 0 ? 'pointer' : 'default',
                    }}
                  >
                    <div style={{ fontWeight: isToday(day) ? 700 : 400, fontSize: 13, marginBottom: 4, color: isToday(day) ? 'var(--primary)' : 'inherit' }}>
                      {day}
                    </div>
                    {dayReservations.slice(0, 3).map((r, i) => (
                      <div
                        key={i}
                        onClick={() => setSelectedRes(r)}
                        style={{
                          background: statusColors[r.status] || '#6b7280',
                          color: '#fff',
                          fontSize: 10,
                          padding: '2px 4px',
                          borderRadius: 3,
                          marginBottom: 2,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          cursor: 'pointer',
                        }}
                      >
                        {r.room_number} - {r.guest_name}
                      </div>
                    ))}
                    {dayReservations.length > 3 && (
                      <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>+{dayReservations.length - 3} more</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Room Availability Grid */}
          {roomNumbers.length > 0 && (
            <div style={{ background: 'var(--card-bg)', borderRadius: 12, border: '1px solid var(--border)', padding: 20 }}>
              <h2 style={{ fontSize: 18, marginBottom: 16 }}>Room Availability Grid</h2>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 12 }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '8px 12px', borderBottom: '2px solid var(--border)', position: 'sticky', left: 0, background: 'var(--card-bg)', zIndex: 1 }}>Room</th>
                      {dates.map((d) => (
                        <th key={d} style={{ padding: '4px 2px', borderBottom: '2px solid var(--border)', textAlign: 'center', minWidth: 28, color: isToday(d) ? 'var(--primary)' : 'inherit', fontWeight: isToday(d) ? 700 : 400 }}>
                          {d}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {roomNumbers.map((roomNum) => (
                      <tr key={roomNum}>
                        <td style={{ padding: '6px 12px', borderBottom: '1px solid var(--border)', fontWeight: 600, position: 'sticky', left: 0, background: 'var(--card-bg)', zIndex: 1 }}>{roomNum}</td>
                        {dates.map((d) => {
                          const res = getRoomStatusForDay(roomNum, d);
                          return (
                            <td
                              key={d}
                              onClick={() => res && setSelectedRes(res)}
                              style={{
                                padding: 2,
                                borderBottom: '1px solid var(--border)',
                                textAlign: 'center',
                                cursor: res ? 'pointer' : 'default',
                              }}
                            >
                              <div style={{
                                width: 24,
                                height: 20,
                                borderRadius: 3,
                                margin: '0 auto',
                                background: res ? (statusColors[res.status] || '#6b7280') : '#e5e7eb',
                              }} />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Reservation Detail Popup */}
      {selectedRes && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => setSelectedRes(null)}>
          <div style={{ background: 'var(--card-bg)', borderRadius: 12, padding: 24, maxWidth: 400, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}
            onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: 16 }}>Reservation Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div><span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Guest</span><p style={{ fontWeight: 600 }}>{selectedRes.guest_name}</p></div>
              <div><span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Room</span><p style={{ fontWeight: 600 }}>{selectedRes.room_number}</p></div>
              <div><span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Check-in</span><p>{formatDate(selectedRes.check_in)}</p></div>
              <div><span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Check-out</span><p>{formatDate(selectedRes.check_out)}</p></div>
              <div><span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Nights</span><p>{selectedRes.nights}</p></div>
              <div><span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Total</span><p>${Number(selectedRes.total_price).toFixed(2)}</p></div>
              <div><span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Channel</span><p>{selectedRes.channel}</p></div>
              <div><span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Status</span><p><span style={{ background: statusColors[selectedRes.status] || '#6b7280', color: '#fff', padding: '2px 8px', borderRadius: 4, fontSize: 12 }}>{selectedRes.status}</span></p></div>
            </div>
            <button className="btn btn-secondary" onClick={() => setSelectedRes(null)} style={{ width: '100%' }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
