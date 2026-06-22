// Shared empty-state component — icon + message, used consistently across every tab
// instead of each tab repeating plain gray text with no visual anchor.

export default function EmptyState({ icon: Icon, message, style }) {
  return (
    <div className="empty-state" style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10, ...style }}>
      {Icon && <Icon size={28} color="#cbd5c8" strokeWidth={1.5} />}
      <div>{message}</div>
    </div>
  );
}
