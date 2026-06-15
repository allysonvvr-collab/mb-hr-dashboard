// Shared Avatar component — shows photo if available, initials otherwise
// Used across all tabs so photos sync everywhere

const AVATAR_BG = ['#1B3A2D','#224d3a','#2d6349','#0d2d1a','#3a7a5c','#4d9973','#163025'];

export default function Avatar({ name, photoUrl, size = 38 }) {
  const initials = (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const bg = AVATAR_BG[initials.charCodeAt(0) % AVATAR_BG.length];

  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={name}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid #e5e7eb' }}
        onError={e => { e.target.style.display = 'none'; e.target.nextSibling && (e.target.nextSibling.style.display = 'flex'); }}
      />
    );
  }

  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: bg, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: size > 40 ? 14 : size > 30 ? 12 : 10, flexShrink: 0 }}>
      {initials}
    </div>
  );
}
