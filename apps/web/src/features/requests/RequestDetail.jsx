import { useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Check,
  CheckCircle2,
  Clock3,
  Copy,
  Edit3,
  FileText,
  GitBranch,
  Send,
  ShieldCheck,
  X,
  XCircle,
} from 'lucide-react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useSession } from '../../app/SessionContext';
import {
  Avatar,
  BackLink,
  ErrorMessage,
  Modal,
  PageHeading,
  Spinner,
  Status,
  SuccessNotice,
} from '../../components/ui';
import { api, orgPath } from '../../lib/api';
import { dateTime, money } from '../../lib/format';

export default function RequestDetail() {
  const { id } = useParams();
  const { organization } = useSession();
  const client = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const [notice, setNotice] = useState(location.state?.notice || '');
  const [action, setAction] = useState(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const key = useRef('');
  const queryKey = ['request', organization.id, id];
  const query = useQuery({
    queryKey,
    queryFn: ({ signal }) => api(orgPath(organization.id, `/requests/${id}`), { signal }),
  });
  const policy = useQuery({
    queryKey: ['policy', organization.id],
    queryFn: ({ signal }) => api(orgPath(organization.id, '/policy'), { signal }),
  });
  if (query.isPending) return <Spinner label="Opening request…" />;
  if (query.error)
    return (
      <>
        <BackLink />
        <ErrorMessage error={query.error} />
      </>
    );
  const item = query.data.data;
  const currentPolicy = policy.data?.data.current;
  const isDraft = item.status === 'draft';
  const versionChanged = currentPolicy && item.policy_version.id !== currentPolicy.id;
  function openAction(value) {
    setAction(value);
    setReason('');
    setError(null);
    key.current = crypto.randomUUID();
  }
  async function perform(event) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const path =
        action === 'approve' || action === 'reject'
          ? `/steps/${item.current_step.id}/${action}`
          : `/${action}`;
      const body = {
        revision: item.revision,
        ...(action === 'submit' ? { policy_version_id: currentPolicy.id } : {}),
        ...(['approve', 'reject'].includes(action) ? { reason: reason.trim() || null } : {}),
      };
      const result = await api(orgPath(organization.id, `/requests/${id}${path}`), {
        method: 'POST',
        body,
        key: key.current,
      });
      setAction(null);
      if (action === 'copy') {
        navigate(`/requests/${result.data.id}/edit`);
      } else {
        client.setQueryData(queryKey, result);
        setNotice(
          {
            submit: 'Request submitted. Your first reviewer can now act.',
            approve: 'Your approval has been recorded.',
            reject: 'Your rejection and reason have been recorded.',
            cancel: 'The request has been cancelled.',
          }[action],
        );
      }
      await client.invalidateQueries({
        predicate: (q) => ['overview', 'requests', 'request', 'audit'].includes(q.queryKey[0]),
      });
    } catch (failure) {
      setError(failure);
      if (failure.status === 409) {
        client.invalidateQueries({ queryKey });
        client.invalidateQueries({ queryKey: ['policy', organization.id] });
      }
    } finally {
      setBusy(false);
    }
  }
  const modalTitles = {
    submit: 'Review & submit request',
    approve: 'Approve this request',
    reject: 'Reject this request',
    cancel: 'Cancel this request',
    copy: 'Create a new draft',
  };
  return (
    <>
      <BackLink />
      <PageHeading
        eyebrow={`${item.reference} · PURCHASE REQUEST`}
        title={item.title}
        description={`Requested by ${item.requester.name} · ${item.department}`}
        actions={
          <>
            <Status value={item.status} />
            {item.permissions.edit && (
              <Link className="button button-secondary" to={`/requests/${id}/edit`}>
                <Edit3 size={16} />
                Edit draft
              </Link>
            )}
            {item.permissions.submit && (
              <button
                className="button button-primary"
                disabled={!currentPolicy}
                onClick={() => openAction('submit')}
              >
                <Send size={16} />
                Review & submit
              </button>
            )}
            {item.permissions.copy && (
              <button className="button button-primary" onClick={() => openAction('copy')}>
                <Copy size={16} />
                Create new draft
              </button>
            )}
          </>
        }
      />
      <SuccessNotice>{notice}</SuccessNotice>
      {isDraft && versionChanged && (
        <div className="info-notice">
          <GitBranch size={18} />
          <span>
            A newer approval policy is available. Review the current route before submitting; your
            draft answers have been kept.
          </span>
        </div>
      )}
      <div className="detail-grid">
        <div className="detail-main">
          <section className="panel">
            <div className="panel-heading">
              <h2>
                <FileText size={19} />
                Request details
              </h2>
              <span className="subtle-label">{item.reference}</span>
            </div>
            <div className="detail-summary">
              <div>
                <span>Purchase amount</span>
                <strong className="detail-amount">{money(item.amount_minor)}</strong>
              </div>
              <div>
                <span>Department</span>
                <strong>{item.department}</strong>
              </div>
              <div>
                <span>Requested by</span>
                <strong className="person-cell">
                  <Avatar name={item.requester.name} size="tiny" />
                  {item.requester.name}
                </strong>
              </div>
              <div>
                <span>Created</span>
                <strong>{dateTime(item.created_at)}</strong>
              </div>
            </div>
            <div className="justification">
              <h3>Business justification</h3>
              <p>{item.justification}</p>
            </div>
            {item.source_request_id && (
              <div className="source-note">
                Created from a previous request.{' '}
                <Link to={`/requests/${item.source_request_id}`}>View original</Link>
              </div>
            )}
          </section>
          {item.permissions.decide && (
            <section className="decision-card">
              <div className="decision-card-icon">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <h2>Your review makes the next step possible.</h2>
                <p>
                  You’re assigned to {item.current_step.label.toLowerCase()}. Review the details
                  before recording a decision.
                </p>
              </div>
              <div className="decision-buttons">
                <button
                  className="button button-secondary danger-text"
                  onClick={() => openAction('reject')}
                >
                  <X size={16} />
                  Reject
                </button>
                <button className="button button-primary" onClick={() => openAction('approve')}>
                  <Check size={17} />
                  Approve
                </button>
              </div>
            </section>
          )}
          <section className="panel">
            <div className="panel-heading">
              <div>
                <h2>Request history</h2>
                <p>A record of the actions behind this request.</p>
              </div>
              <ShieldCheck size={19} className="muted" />
            </div>
            <ol className="history-list">
              {item.history.map((event) => (
                <li key={event.id}>
                  <span
                    className={`history-icon ${event.event_type.includes('approved') ? 'green' : event.event_type.includes('rejected') ? 'red' : ''}`}
                  >
                    {event.event_type.includes('approved') ? (
                      <Check size={15} />
                    ) : event.event_type.includes('rejected') ? (
                      <X size={15} />
                    ) : (
                      <Clock3 size={15} />
                    )}
                  </span>
                  <div>
                    <p>{event.description}</p>
                    <span>
                      {event.actor} <span className="tiny-dot" /> {dateTime(event.occurred_at)}
                    </span>
                    {event.metadata?.reason && <blockquote>{event.metadata.reason}</blockquote>}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>
        <aside className="detail-aside">
          <section className="panel">
            <div className="panel-heading">
              <h2>
                <GitBranch size={19} />
                Approval journey
              </h2>
            </div>
            <div className="detail-route">
              <div className="route-node">
                <span className={`route-node-icon ${!isDraft ? 'complete' : ''}`}>
                  {!isDraft ? <Check size={16} /> : <FileText size={15} />}
                </span>
                <div>
                  <strong>{isDraft ? 'Draft in progress' : 'Request submitted'}</strong>
                  <small>
                    {isDraft ? 'Only you can edit this draft' : dateTime(item.submitted_at)}
                  </small>
                </div>
              </div>
              {item.steps.map((step) => (
                <div className={`route-node route-status-${step.status}`} key={step.id}>
                  <span
                    className={`route-node-icon ${step.status === 'approved' ? 'complete' : step.status === 'pending' ? 'current' : ''}`}
                  >
                    {step.status === 'approved' ? (
                      <Check size={16} />
                    ) : step.status === 'rejected' ? (
                      <X size={16} />
                    ) : (
                      step.position
                    )}
                  </span>
                  <div>
                    <strong>{step.label}</strong>
                    <small>{step.assignee}</small>
                    <Status value={step.status} />
                  </div>
                </div>
              ))}
              <div className="route-node route-node-end">
                <span className={`route-node-icon ${item.status === 'approved' ? 'complete' : ''}`}>
                  {item.status === 'rejected' || item.status === 'cancelled' ? (
                    <XCircle size={16} />
                  ) : (
                    <CheckCircle2 size={16} />
                  )}
                </span>
                <div>
                  <strong>
                    {item.status === 'approved'
                      ? 'Approved'
                      : item.status === 'rejected'
                        ? 'Request rejected'
                        : item.status === 'cancelled'
                          ? 'Request cancelled'
                          : 'Complete'}
                  </strong>
                  <small>
                    {item.completed_at ? dateTime(item.completed_at) : 'After the required reviews'}
                  </small>
                </div>
              </div>
            </div>
            <div className="policy-snapshot">
              <span className="version-pill">Policy v{item.policy_version.version_number}</span>
              <p>
                {isDraft
                  ? 'Policy loaded when this draft was created. Submission uses the policy you review.'
                  : 'This request keeps its original policy, even when a newer version is published.'}
              </p>
            </div>
          </section>
          {item.permissions.cancel && (
            <button className="cancel-request-link" onClick={() => openAction('cancel')}>
              Cancel this request
            </button>
          )}
        </aside>
      </div>
      {action && (
        <Modal
          title={modalTitles[action]}
          onClose={() => {
            if (!busy) setAction(null);
          }}
        >
          <form onSubmit={perform}>
            <ErrorMessage error={error} />
            {action === 'submit' ? (
              <>
                <p>
                  You’re submitting <strong>{item.reference}</strong> for{' '}
                  <strong>{money(item.amount_minor)}</strong>. Submitted details are preserved and
                  cannot be edited.
                </p>
                <div className="modal-review">
                  <span>
                    Current policy <strong>v{currentPolicy.version_number}</strong>
                  </span>
                  <span>
                    Manager <strong>{currentPolicy.manager.name}</strong>
                  </span>
                  {item.amount_minor >= currentPolicy.threshold_minor && (
                    <span>
                      Finance <strong>{currentPolicy.finance.name}</strong>
                    </span>
                  )}
                </div>
                <p className="muted small">
                  Finance review applies at {money(currentPolicy.threshold_minor)} and above. You
                  cannot approve your own request.
                </p>
              </>
            ) : action === 'copy' ? (
              <p>
                A new editable draft will be created from this request. The original record and
                decisions will be preserved. The new request will use the policy reviewed at
                submission.
              </p>
            ) : action === 'cancel' ? (
              <p>
                This will cancel the request and its outstanding approval steps. Completed decisions
                stay in the history. You can create a new draft later if needed.
              </p>
            ) : (
              <>
                <p>
                  {action === 'approve'
                    ? 'Your decision will be recorded and the request will move to its next required step.'
                    : 'The request will end as rejected. Help the requester understand what needs to change.'}
                </p>
                <label>
                  {action === 'reject' ? 'Reason for rejection *' : 'Review comment (optional)'}
                  <textarea
                    value={reason}
                    onChange={(e) => {
                      setReason(e.target.value);
                      key.current = crypto.randomUUID();
                    }}
                    maxLength={2000}
                    rows={4}
                    required={action === 'reject'}
                    placeholder={
                      action === 'reject'
                        ? 'Explain why this request cannot be approved…'
                        : 'Add context to your decision…'
                    }
                    autoFocus
                  />
                </label>
              </>
            )}
            <div className="modal-actions">
              <button
                type="button"
                className="button button-secondary"
                disabled={busy}
                onClick={() => setAction(null)}
              >
                Go back
              </button>
              <button
                className={`button ${action === 'reject' || action === 'cancel' ? 'button-danger' : 'button-primary'}`}
                disabled={busy}
              >
                {busy
                  ? 'Recording…'
                  : {
                      submit: 'Confirm & submit',
                      approve: 'Confirm approval',
                      reject: 'Confirm rejection',
                      cancel: 'Confirm cancellation',
                      copy: 'Create draft',
                    }[action]}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
