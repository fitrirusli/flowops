import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Check, FileText, GitBranch, Save, ShieldCheck } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useSession } from '../../app/SessionContext';
import { BackLink, EmptyState, ErrorMessage, PageHeading, Spinner } from '../../components/ui';
import { api, orgPath } from '../../lib/api';
import { money, parseAmount } from '../../lib/format';

const empty = { title: '', amount: '', department: 'Engineering', justification: '' };

export default function RequestEditor() {
  const { id } = useParams();
  const { organization } = useSession();
  const [fields, setFields] = useState(empty);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const initialized = useRef(null);
  const key = useRef(crypto.randomUUID());
  const client = useQueryClient();
  const navigate = useNavigate();
  const policy = useQuery({
    queryKey: ['policy', organization.id],
    queryFn: ({ signal }) => api(orgPath(organization.id, '/policy'), { signal }),
  });
  const item = useQuery({
    queryKey: ['request', organization.id, id],
    queryFn: ({ signal }) => api(orgPath(organization.id, `/requests/${id}`), { signal }),
    enabled: Boolean(id),
  });
  useEffect(() => {
    if (item.data && initialized.current !== id) {
      const value = item.data.data;
      setFields({
        title: value.title,
        amount: (value.amount_minor / 100).toFixed(2),
        department: value.department,
        justification: value.justification,
      });
      initialized.current = id;
    }
  }, [item.data, id]);
  useEffect(() => {
    if (!Object.values(fields).some((value, index) => index !== 2 && value)) return;
    const warn = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [fields]);
  if (!organization.roles.includes('requester'))
    return (
      <EmptyState
        title="A requester role is required"
        description="Your current organization membership cannot create purchase requests."
      />
    );
  if (policy.isPending || (id && item.isPending))
    return <Spinner label="Preparing the request form…" />;
  if (policy.error || item.error) return <ErrorMessage error={policy.error || item.error} />;
  if (id && !item.data.data.permissions.edit)
    return (
      <EmptyState
        title="This request cannot be edited"
        description="Only your own drafts can be changed. Submitted information is preserved."
        action={
          <Link className="button button-secondary" to={`/requests/${id}`}>
            View request
          </Link>
        }
      />
    );
  const current = policy.data.data.current;
  const amount = parseAmount(fields.amount);
  const needsFinance = amount !== null && amount >= current.threshold_minor;
  function change(event) {
    setFields({ ...fields, [event.target.name]: event.target.value });
    key.current = crypto.randomUUID();
  }
  async function save(event) {
    event.preventDefault();
    setError(null);
    if (amount === null) {
      setError(new Error('Enter a valid positive MYR amount with up to two decimal places.'));
      return;
    }
    setBusy(true);
    try {
      const body = {
        title: fields.title.trim(),
        amount_minor: amount,
        department: fields.department,
        justification: fields.justification.trim(),
        ...(id ? { revision: item.data.data.revision } : {}),
      };
      const result = await api(orgPath(organization.id, `/requests${id ? `/${id}` : ''}`), {
        method: id ? 'PATCH' : 'POST',
        body,
        key: key.current,
      });
      await client.invalidateQueries({
        predicate: (query) => ['overview', 'requests', 'request'].includes(query.queryKey[0]),
      });
      navigate(`/requests/${result.data.id}`, {
        state: { notice: 'Draft saved. Review your details and submit when you’re ready.' },
      });
    } catch (failure) {
      setError(failure);
      if (failure.status === 409)
        client.invalidateQueries({ queryKey: ['request', organization.id, id] });
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <BackLink to={id ? `/requests/${id}` : '/requests'} />
      <PageHeading
        eyebrow="START WITH THE DETAILS"
        title={id ? 'Edit purchase request' : 'A new purchase request'}
        description="Tell your reviewers what you need and why it matters."
      />
      <div className="editor-grid">
        <form onSubmit={save} className="panel request-form">
          <div className="panel-heading">
            <div>
              <h2>
                <FileText size={19} />
                Purchase details
              </h2>
              <p>A little context makes for a better decision.</p>
            </div>
            <span className="subtle-label">MYR</span>
          </div>
          <div className="form-body">
            <ErrorMessage error={error} />
            <label>
              Request title <span className="required-mark">*</span>
              <input
                name="title"
                value={fields.title}
                onChange={change}
                minLength={3}
                maxLength={160}
                required
                placeholder="e.g. Developer workstations for the product team"
              />
              <small>A short, descriptive name for this purchase.</small>
            </label>
            <div className="form-two-columns">
              <label>
                Purchase amount <span className="required-mark">*</span>
                <span className="currency-input">
                  <span>MYR</span>
                  <input
                    name="amount"
                    value={fields.amount}
                    onChange={change}
                    inputMode="decimal"
                    required
                    placeholder="0.00"
                  />
                </span>
                <small>Enter the full purchase amount, including tax.</small>
              </label>
              <label>
                Department <span className="required-mark">*</span>
                <select name="department" value={fields.department} onChange={change}>
                  {['Engineering', 'Design', 'Marketing', 'Operations', 'Finance', 'People'].map(
                    (value) => (
                      <option key={value}>{value}</option>
                    ),
                  )}
                </select>
                <small>The team this purchase supports.</small>
              </label>
            </div>
            <label>
              Business justification <span className="required-mark">*</span>
              <textarea
                name="justification"
                value={fields.justification}
                onChange={change}
                required
                minLength={10}
                maxLength={10000}
                rows={6}
                placeholder="What is this purchase for? Explain the need, expected benefit, and any alternatives considered."
              />
              <small>Give your reviewers enough information to make an informed decision.</small>
            </label>
          </div>
          <div className="form-actions">
            <Link className="button button-secondary" to={id ? `/requests/${id}` : '/requests'}>
              Back
            </Link>
            <button className="button button-primary" disabled={busy}>
              <Save size={16} />
              {busy ? 'Saving draft…' : 'Save draft & review'}
              <ArrowRight size={16} />
            </button>
          </div>
        </form>
        <aside className="editor-aside">
          <section className="panel route-preview">
            <div className="panel-heading">
              <div>
                <h2>
                  <GitBranch size={19} />
                  Your approval path
                </h2>
                <p>Based on current policy v{current.version_number}.</p>
              </div>
            </div>
            <div className="route-preview-body">
              <div className="route-node">
                <span className="route-node-icon">
                  <Check size={16} />
                </span>
                <div>
                  <strong>You submit</strong>
                  <small>After reviewing your draft</small>
                </div>
              </div>
              <div className="route-node">
                <span className="route-node-icon">1</span>
                <div>
                  <strong>Manager review</strong>
                  <small>{current.manager.name}</small>
                </div>
              </div>
              {needsFinance && (
                <div className="route-node">
                  <span className="route-node-icon">2</span>
                  <div>
                    <strong>Finance review</strong>
                    <small>{current.finance.name}</small>
                  </div>
                </div>
              )}
              <div className="route-node route-node-end">
                <span className="route-node-icon">
                  <Check size={16} />
                </span>
                <div>
                  <strong>Ready to move forward</strong>
                  <small>Once every required review is approved</small>
                </div>
              </div>
            </div>
            <div className="route-threshold">
              Finance review applies at <strong>{money(current.threshold_minor)}</strong> and above.
            </div>
          </section>
          <div className="plain-note">
            <ShieldCheck size={20} />
            <div>
              <strong>Review before you submit.</strong>
              <p>
                Saving a draft won’t notify reviewers or create approval tasks. You’ll review the
                details on the next screen.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
