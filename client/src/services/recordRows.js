// List routes return either rows directly or a paginated { data, pagination } envelope.
// Reject unexpected payloads so callers show their existing load error instead of
// rendering a blank list or throwing later in map/reduce.
export function recordRows(payload) {
  const rows = Array.isArray(payload) ? payload : payload?.data;
  if (!Array.isArray(rows)) throw new TypeError('Record list response must contain an array of rows.');
  return rows;
}
