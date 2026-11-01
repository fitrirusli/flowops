import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  CheckCircle2,
  FileText,
  GitBranch,
  LockKeyhole,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSession } from '../../app/SessionContext';
import {
  Avatar,
  EmptyState,
  ErrorMessage,
  PageHeading,
  Pagination,
  Spinner,
} from '../../components/ui';
import { api, orgPath } from '../../lib/api';
import { dateTime } from '../../lib/format';

export function ActivityPage() {
  const { organization } = useSession();
  const [page, setPage] = useState(1);
  const [type, setType] = useState('all');
  const allowed = organization.roles.some((role) => ['administrator', 'auditor'].includes(role));
  const query = useQuery({
    queryKey: ['audit', organization.id, page, type],
    queryFn: ({ signal }) =>
      api(orgPath(organization.id, `/audit-events?page=${page}&type=${type}`), { signal }),
    enabled: allowed,
  });
  if (!allowed)
    return (
      <EmptyState
        icon={LockKeyhole}
        title="This view is restricted"
        description="An administrator or auditor role is required to read organization-wide history."
      />
    );
  return (
    <>
      <PageHeading
        eyebrow="A RECORD YOU CAN FOLLOW"
        title="Audit history"
        description="The people, policies, and decisions behind your workspace."
      />
      <section className="panel">
        <div className="list-toolbar">
          <div className="filter-tabs inline-tabs" role="group" aria-label="Filter activity">
            {[
              ['all', 'All activity'],
              ['request', 'Requests'],
              ['step', 'Decisions'],
              ['policy', 'Policies'],
            ].map(([value, label]) => (
              <button
                key={value}
                className={type === value ? 'active' : ''}
                aria-pressed={type === value}
                onClick={() => {
                  setType(value);
                  setPage(1);
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <ShieldCheck size={19} className="muted" />
        </div>
        {query.isPending ? (
          <Spinner />
        ) : query.error ? (
          <ErrorMessage error={query.error} />
        ) : query.data.data.length ? (
          <>
            <div className="audit-list">
              {query.data.data.map((event) => (
                <div className="audit-row" key={event.id}>
                  <Avatar name={event.actor} />
                  <div>
                    <strong>{event.description}</strong>
                    <p>
                      {event.actor} <span className="tiny-dot" />{' '}
                      <span className="audit-type">{event.event_type}</span>
                    </p>
                    {event.metadata?.reason && <blockquote>{event.metadata.reason}</blockquote>}
                  </div>
                  <div className="audit-row-right">
                    <time>{dateTime(event.occurred_at)}</time>
                    {event.request_id && (
                      <Link to={`/requests/${event.request_id}`}>View request →</Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <Pagination meta={query.data.meta} onChange={setPage} />
          </>
        ) : (
          <EmptyState
            title="No activity matches this view"
            description="Choose another activity type or check back after new actions."
          />
        )}
      </section>
      <p className="page-footnote">
        History is read-only in the application. Access is limited to your current organization.
      </p>
    </>
  );
}

export function MembersPage() {
  const { organization } = useSession();
  const allowed = organization.roles.includes('administrator');
  const query = useQuery({
    queryKey: ['members', organization.id],
    queryFn: ({ signal }) => api(orgPath(organization.id, '/members'), { signal }),
    enabled: allowed,
  });
  if (!allowed)
    return (
      <EmptyState
        icon={LockKeyhole}
        title="Administrator access required"
        description="Member details are available to organization administrators."
      />
    );
  return (
    <>
      <PageHeading
        eyebrow="THE PEOPLE BEHIND THE PROCESS"
        title="Members & roles"
        description="A clear responsibility for every member of your workspace."
      />
      <div className="info-notice">
        <Users size={18} />
        <span>
          This release provides a read-only membership directory. Account provisioning and role
          changes are maintained through controlled administration.
        </span>
      </div>
      <section className="panel">
        {query.isPending ? (
          <Spinner />
        ) : query.error ? (
          <ErrorMessage error={query.error} />
        ) : (
          <div className="table-scroll">
            <table className="request-table member-table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Roles</th>
                  <th>Membership</th>
                </tr>
              </thead>
              <tbody>
                {query.data.data.map((person) => (
                  <tr key={person.id}>
                    <td>
                      <span className="person-cell">
                        <Avatar name={person.name} />
                        <span>
                          <strong>{person.name}</strong>
                          <small>{person.email}</small>
                        </span>
                      </span>
                    </td>
                    <td>
                      <div className="role-tags">
                        {person.roles.map((role) => (
                          <span key={role}>{role}</span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <span
                        className={`status ${person.active ? 'status-approved' : 'status-cancelled'}`}
                      >
                        <span />
                        {person.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <section className="role-explanation-grid">
        {[
          {
            role: 'Requester',
            text: 'Creates and submits purchase requests, then follows their progress.',
            icon: FileText,
          },
          {
            role: 'Approver',
            text: 'Decides the current step of a request assigned specifically to them.',
            icon: CheckCircle2,
          },
          {
            role: 'Administrator',
            text: 'Publishes policy versions and views the organization’s records.',
            icon: GitBranch,
          },
          {
            role: 'Auditor',
            text: 'Reads submitted requests and history without making decisions.',
            icon: ShieldCheck,
          },
        ].map(({ role, text, icon: Icon }) => (
          <div className="panel role-explanation" key={role}>
            <Icon size={20} />
            <h3>{role}</h3>
            <p>{text}</p>
          </div>
        ))}
      </section>
    </>
  );
}

export function GuidePage() {
  return (
    <>
      <PageHeading
        eyebrow="A LITTLE CONTEXT GOES A LONG WAY"
        title="Your workspace guide"
        description="How requests become informed, traceable decisions."
      />
      <div className="guide-sections">
        <section className="panel guide-section">
          <span className="guide-number">01</span>
          <div>
            <h2>Start with a purchase request.</h2>
            <p>
              Add a clear title, the exact MYR amount, your department, and the business
              justification. Save a draft, review the details, and submit when you’re ready.
              Submitted information cannot be edited.
            </p>
            <Link className="text-link" to="/requests">
              Explore requests →
            </Link>
          </div>
        </section>
        <section className="panel guide-section">
          <span className="guide-number">02</span>
          <div>
            <h2>The policy selects the next reviewer.</h2>
            <p>
              Every request starts with manager review. At or above the policy’s threshold, finance
              review follows. Only the assigned active reviewer can decide the current step.
              Requesters cannot approve their own requests.
            </p>
            <Link className="text-link" to="/policies">
              See the current policy →
            </Link>
          </div>
        </section>
        <section className="panel guide-section">
          <span className="guide-number">03</span>
          <div>
            <h2>Every decision becomes part of the history.</h2>
            <p>
              Approval moves the request forward; rejection ends it with a reason. Requesters may
              cancel their own pending requests. Rejected and cancelled requests can be copied into
              a new draft without changing the original history.
            </p>
          </div>
        </section>
        <section className="panel guide-section">
          <span className="guide-number">04</span>
          <div>
            <h2>Policies evolve. History stays intact.</h2>
            <p>
              Administrators publish a new immutable policy version when thresholds or reviewers
              change. Existing submissions retain their original policy. A stale draft requires
              review against the current policy before submission.
            </p>
          </div>
        </section>
        <section className="panel guide-section">
          <span className="guide-number">05</span>
          <div>
            <h2>Your organization is its own boundary.</h2>
            <p>
              Workspace membership and permissions are checked on the server. Switching
              organizations changes the records and roles available to you. A valid account does not
              grant access to another organization’s data.
            </p>
          </div>
        </section>
      </div>
      <p className="page-footnote">
        FlowOps is the working project name for this independently implemented purchase approval
        engine. It does not execute payments.
      </p>
    </>
  );
}
