export default function StatusBadge({ status, label }) {
  return (
    <span
      className={`status-${status} inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium`}
    >
      {label}
    </span>
  );
}
