// Shared status-color semantics used across every tab.
// Keeps green/amber/red/blue/gray meaning consistent app-wide instead of
// each component hand-rolling its own color map.

export const STATUS_PALETTE = {
  green: '#16a34a',   // good / approved / active / closed / hired
  amber: '#f59e0b',   // caution / pending / needs attention
  red:   '#dc2626',   // bad / denied / expired / open issue / rejected
  blue:  '#3b82f6',   // in progress / informational
  purple:'#8b5cf6',   // advanced stage / offer extended
  gray:  '#6b7280',   // neutral / inactive / returned
};

// Maps a semantic status string to a palette color.
// Add new statuses here as they come up so every tab stays in sync.
const STATUS_MAP = {
  // Time Off / Raises / general approval flow
  Approved: 'green', Active: 'green', Good: 'green', Closed: 'green', Hired: 'green',
  Pending: 'amber', 'Pending Renewal': 'amber', 'Phone Screen': 'amber', 'Needs Replacement': 'amber', Open: 'amber',
  Denied: 'red', Expired: 'red', Lost: 'red', Rejected: 'red',
  'In Progress': 'blue', Interview: 'blue',
  Offer: 'purple',
  Returned: 'gray', Applied: 'gray',
};

/** Returns the hex color for a given status string, defaulting to gray if unknown. */
export function statusColor(status) {
  const key = STATUS_MAP[status] || 'gray';
  return STATUS_PALETTE[key];
}

/** Returns a ready-to-spread style object for a status pill/badge. */
export function statusBadgeStyle(status) {
  const c = statusColor(status);
  return {
    background: c + '18',
    color: c,
    border: `1px solid ${c}40`,
    fontSize: 11,
    fontWeight: 700,
    padding: '2px 8px',
    borderRadius: 20,
    whiteSpace: 'nowrap',
  };
}

/** Returns a color based on a 1-5 numeric rating (used by Reviews, Performance, etc). */
export function ratingColor(rating) {
  if (rating >= 4) return STATUS_PALETTE.green;
  if (rating === 3) return STATUS_PALETTE.amber;
  return STATUS_PALETTE.red;
}
