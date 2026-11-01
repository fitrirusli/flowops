import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  Check,
  ChevronDown,
  GitBranch,
  History,
  LockKeyhole,
  ShieldCheck,
  Upload,
} from 'lucide-react';
import { useSession } from '../../app/SessionContext';
import {
  Avatar,
  ErrorMessage,
  Modal,
  PageHeading,
  Spinner,
  SuccessNotice,
} from '../../components/ui';
import { api, orgPath } from '../../lib/api';
import { dateTime, money, parseAmount } from '../../lib/format';

export default function Policy() {
  const { organization } = useSession();
  const query = useQuery({
    queryKey: ['policy', organization.id],
    queryFn: ({ signal }) => api(orgPath(organization.id, '/policy'), { signal }),
  });
  const client = useQueryClient();
  const [fields, setFields] = useState(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState(null);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const key = useRef(crypto.randomUUID());
  const canEdit = organization.roles.includes('administrator');
  useEffect(() => {
    if (query.data && !fields) {
      const policy = query.data.data;
      setFields({
        amount: (policy.current.threshold_minor / 100).toFixed(2),
        manager: policy.current.manager.id,
        finance: policy.current.finance.id,
        note: '',
        revision: policy.revision,
      });
    }
  }, [query.data, fields]);
  if (query.isPending || !fields)
    return query.error ? (
      <ErrorMessage error={query.error} />
    ) : (
      <Spinner label="Loading approval policy…" />
    );
  if (query.error) return <ErrorMessage error={query.error} />;
  const data = query.data.data;
  const current = data.current;
  function change(event) {
    setFields({ ...fields, [event.target.name]: event.target.value });
    key.current = crypto.randomUUID();
  }
  function review(event) {
    event.preventDefault();
    setError(null);
    if (parseAmount(fields.amount) === null) {
      setError(new Error('Enter a valid positive threshold with up to two decimal places.'));
      return;
    }
    if (fields.manager === fields.finance) {
      setError(new Error('Manager and finance reviewers must be different people.'));
      return;
    }
    setConfirm(true);
  }
  async function publish(event) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result = await api(orgPath(organization.id, '/policy/publish'), {
        method: 'POST',
        body: {
          revision: fields.revision,
          threshold_minor: parseAmount(fields.amount),
          manager_membership_id: fields.manager,
          finance_membership_id: fields.finance,
          change_note: fields.note.trim(),
        },
        key: key.current,
      });
      setConfirm(false);
      setNotice(
        `Policy v${result.data.version_number} published. Existing requests keep their original versions.`,
      );
      await client.invalidateQueries({
        predicate: (q) => ['policy', 'overview', 'audit'].includes(q.queryKey[0]),
      });
      setFields(null);
    } catch (failure) {
      setError(failure);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeading
        eyebrow="CONSISTENT DECISIONS START HERE"
        title="Approval policy"
        description="Define the right review path. Keep every published version intact."
        actions={
          <span className="published-badge">
            <span />
            Policy v{current.version_number} is live
          </span>
        }
      />
      <SuccessNotice>{notice}</SuccessNotice>
      <div className="info-notice">
        <ShieldCheck size={19} />
        <span>
          Published policies are immutable. New submissions use the latest reviewed version;
          requests already in progress keep their original policy.
        </span>
      </div>
      <div className="policy-grid">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>
                <GitBranch size={19} />
                Purchase approval rules
              </h2>
              <p>
                {canEdit
                  ? 'Publish a new version to update these settings.'
                  : 'The current rules for new purchase requests.'}
              </p>
            </div>
            <span className="version-pill">v{current.version_number}</span>
          </div>
          {canEdit ? (
            <form onSubmit={review}>
              <div className="form-body">
                <ErrorMessage error={!confirm && error} />
                <label>
                  Finance review threshold
                  <span className="currency-input">
                    <span>MYR</span>
                    <input
                      name="amount"
                      value={fields.amount}
                      onChange={change}
                      inputMode="decimal"
                      required
                    />
                  </span>
                  <small>
                    Requests at or above this amount require finance review after manager approval.
                  </small>
                </label>
                <div className="form-two-columns">
                  <label>
                    Manager reviewer
                    <select name="manager" value={fields.manager} onChange={change} required>
                      {data.approvers.map((person) => (
                        <option key={person.id} value={person.id}>
                          {person.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Finance reviewer
                    <select name="finance" value={fields.finance} onChange={change} required>
                      {data.approvers.map((person) => (
                        <option key={person.id} value={person.id}>
                          {person.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <label>
                  What’s changing?
                  <textarea
                    name="note"
                    value={fields.note}
                    onChange={change}
                    minLength={8}
                    maxLength={500}
                    required
                    rows={3}
                    placeholder="Explain this policy change for your workspace history…"
                  />
                  <small>A short explanation is kept with the published version.</small>
                </label>
              </div>
              <div className="form-actions">
                <span className="small muted">Based on policy v{current.version_number}</span>
                <button className="button button-primary">
                  <Upload size={16} />
                  Review & publish
                </button>
              </div>
            </form>
          ) : (
            <div className="form-body policy-readonly">
              <div>
                <span>Finance review threshold</span>
                <strong>{money(current.threshold_minor)}</strong>
              </div>
              <div>
                <span>Manager reviewer</span>
                <strong>{current.manager.name}</strong>
              </div>
              <div>
                <span>Finance reviewer</span>
                <strong>{current.finance.name}</strong>
              </div>
            </div>
          )}
        </section>
        <aside>
          <section className="panel policy-path-card">
            <div className="panel-heading">
              <h2>How requests move</h2>
            </div>
            <div className="policy-path-body">
              <span className="eyebrow">BELOW {money(current.threshold_minor)}</span>
              <div className="compact-route">
                <span>Submit</span>
                <ArrowRight size={14} />
                <span>Manager</span>
                <ArrowRight size={14} />
                <span className="route-done">
                  <Check size={13} />
                  Done
                </span>
              </div>
              <span className="eyebrow">AT OR ABOVE {money(current.threshold_minor)}</span>
              <div className="compact-route">
                <span>Submit</span>
                <ArrowRight size={14} />
                <span>Manager</span>
                <ArrowRight size={14} />
                <span>Finance</span>
              </div>
            </div>
          </section>
          <div className="plain-note">
            <LockKeyhole size={21} />
            <div>
              <strong>History stays true.</strong>
              <p>
                Publishing a new version never rewrites an existing request’s policy or recorded
                decisions.
              </p>
            </div>
          </div>
        </aside>
      </div>
      {data.versions.length > 0 && (
        <section className="panel versions-panel">
          <div className="panel-heading">
            <div>
              <h2>
                <History size={19} />
                Version history
              </h2>
              <p>Every published policy, preserved.</p>
            </div>
            <span className="subtle-label">{data.versions.length} versions</span>
          </div>
          {data.versions.map((version) => (
            <details className="version-row" key={version.id}>
              <summary>
                <span className="version-square">v{version.version_number}</span>
                <div>
                  <strong>{version.change_note}</strong>
                  <small>
                    {version.published_by} <span className="tiny-dot" />{' '}
                    {dateTime(version.published_at)}
                  </small>
                </div>
                {version.id === current.id && <span className="current-label">Current</span>}
                <ChevronDown size={17} />
              </summary>
              <div className="version-detail">
                <span>
                  Finance threshold <strong>{money(version.threshold_minor)}</strong>
                </span>
                <span>
                  Manager <strong>{version.manager.name}</strong>
                </span>
                <span>
                  Finance <strong>{version.finance.name}</strong>
                </span>
              </div>
            </details>
          ))}
        </section>
      )}
      {confirm && (
        <Modal
          title="Publish a new policy version"
          onClose={() => {
            if (!busy) setConfirm(false);
          }}
        >
          <form onSubmit={publish}>
            <ErrorMessage error={error} />
            <p>
              New submissions will use a finance threshold of{' '}
              <strong>{money(parseAmount(fields.amount))}</strong>. Requests already submitted will
              retain their original policy.
            </p>
            <div className="modal-review">
              <span>
                Manager <strong>{data.approvers.find((p) => p.id === fields.manager)?.name}</strong>
              </span>
              <span>
                Finance <strong>{data.approvers.find((p) => p.id === fields.finance)?.name}</strong>
              </span>
              <span>
                Change note <strong>{fields.note}</strong>
              </span>
            </div>
            {error?.status === 409 && (
              <button
                type="button"
                className="text-link"
                onClick={async () => {
                  await query.refetch();
                  setFields(null);
                  setConfirm(false);
                }}
              >
                Reload the current policy before editing
              </button>
            )}
            <div className="modal-actions">
              <button
                type="button"
                className="button button-secondary"
                disabled={busy}
                onClick={() => setConfirm(false)}
              >
                Go back
              </button>
              <button className="button button-primary" disabled={busy || error?.status === 409}>
                {busy ? 'Publishing…' : 'Publish policy'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
