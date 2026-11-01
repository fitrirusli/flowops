import {
  AlertCircle,
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  FileText,
  LoaderCircle,
  X,
} from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { initials, statusLabel } from '../lib/format';

export function Logo({ dark = false }) {
  return (
    <div className={`brand ${dark ? 'brand-dark' : ''}`}>
      <span className="brand-mark">
        <svg viewBox="0 0 28 28" aria-hidden="true">
          <path d="M7 5h15v4H11v5h9v4h-9v7H7z" fill="currentColor" />
        </svg>
      </span>
      <span>
        FlowOps<span className="brand-period">.</span>
      </span>
    </div>
  );
}

export function Status({ value }) {
  return (
    <span className={`status status-${value}`}>
      <span />
      {statusLabel(value)}
    </span>
  );
}
export function Avatar({ name, size = 'normal', color = '' }) {
  return (
    <span className={`avatar avatar-${size} ${color}`} aria-hidden="true">
      {initials(name)}
    </span>
  );
}
export function Spinner({ label = 'Loading workspace…' }) {
  return (
    <div className="loading-state" role="status">
      <LoaderCircle size={25} className="spin" />
      <span>{label}</span>
    </div>
  );
}
export function ErrorMessage({ error }) {
  return error ? (
    <div className="error-message" role="alert">
      <AlertCircle size={18} />
      <div>
        {error.message || error}
        {error.requestId && <small>Request ID: {error.requestId}</small>}
      </div>
    </div>
  ) : null;
}
export function EmptyState({
  title = 'Nothing here yet',
  description,
  action,
  icon: Icon = FileText,
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <Icon size={26} />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
export function PageHeading({ eyebrow, title, description, actions }) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="heading-actions">{actions}</div>}
    </div>
  );
}
export function BackLink({ to = '/requests', children = 'Back to requests' }) {
  return (
    <Link className="back-link" to={to}>
      <ArrowLeft size={16} />
      {children}
    </Link>
  );
}
export function Pagination({ meta, onChange }) {
  if (!meta || meta.last_page <= 1) return null;
  return (
    <div className="pagination">
      <span>
        Page {meta.current_page} of {meta.last_page} · {meta.total} records
      </span>
      <div>
        <button
          className="button button-secondary button-small"
          disabled={meta.current_page === 1}
          onClick={() => onChange(meta.current_page - 1)}
        >
          <ChevronLeft size={16} />
          Previous
        </button>
        <button
          className="button button-secondary button-small"
          disabled={meta.current_page === meta.last_page}
          onClick={() => onChange(meta.current_page + 1)}
        >
          Next
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

export function Modal({ title, children, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    const previouslyFocused = document.activeElement;
    dialog.showModal();
    return () => {
      dialog.close();
      previouslyFocused?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="modal"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className="modal-heading">
        <h2>{title}</h2>
        <button aria-label="Close dialog" className="icon-button" onClick={onClose}>
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}

export function SuccessNotice({ children }) {
  return children ? (
    <div className="success-notice" role="status">
      <Check size={18} />
      {children}
    </div>
  ) : null;
}
