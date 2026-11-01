import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  CircleDashed,
  Clock3,
  FileText,
  GitBranch,
  Plus,
  ShieldCheck,
  Wallet,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSession } from '../../app/SessionContext';
import { Avatar, EmptyState, ErrorMessage, PageHeading, Spinner } from '../../components/ui';
import { api, orgPath } from '../../lib/api';
import { date, money } from '../../lib/format';
import RequestTable from '../requests/RequestTable';

export default function Overview() {
  const { user, organization } = useSession();
  const overview = useQuery({
    queryKey: ['overview', organization.id],
    queryFn: ({ signal }) => api(orgPath(organization.id, '/overview'), { signal }),
  });
  const policy = useQuery({
    queryKey: ['policy', organization.id],
    queryFn: ({ signal }) => api(orgPath(organization.id, '/policy'), { signal }),
  });
  if (overview.isPending) return <Spinner />;
  if (overview.error) return <ErrorMessage error={overview.error} />;
  const data = overview.data.data;
  const current = policy.data?.data.current;
  const counts = data.counts;
  const requester = organization.roles.includes('requester');
  const statistics = [
    {
      title: 'Total requests',
      value: data.total,
      detail: 'Across your accessible requests',
      icon: FileText,
      color: 'blue',
    },
    {
      title: 'Awaiting approval',
      value: counts.pending || 0,
      detail: organization.roles.includes('approver')
        ? `${data.assigned_to_me} assigned to you`
        : 'Moving through the review process',
      icon: Clock3,
      color: 'amber',
    },
    {
      title: 'Approved requests',
      value: counts.approved || 0,
      detail: 'Reviewed and ready to move forward',
      icon: CheckCircle2,
      color: 'green',
    },
    {
      title: 'Approved value',
      value: money(data.approved_amount_minor),
      detail: 'Total value of approved purchases',
      icon: Wallet,
      color: 'violet',
    },
  ];
  return (
    <>
      <PageHeading
        eyebrow="YOUR WORKSPACE AT A GLANCE"
        title={`Hello, ${user.name.split(' ')[0]}.`}
        description="Here’s where things stand. Let’s keep good work moving."
        actions={
          requester && (
            <Link className="button button-primary" to="/requests/new">
              <Plus size={17} />
              New request
            </Link>
          )
        }
      />
      <div className="stat-grid">
        {statistics.map(({ title, value, detail, icon: Icon, color }) => (
          <section className="stat-card" key={title}>
            <div className="stat-top">
              <span>{title}</span>
              <span className={`stat-icon ${color}`}>
                <Icon size={18} />
              </span>
            </div>
            <strong className={typeof value === 'string' ? 'stat-money' : ''}>{value}</strong>
            <small>{detail}</small>
          </section>
        ))}
      </div>
      {current && (
        <section className="policy-banner">
          <div className="policy-banner-icon">
            <GitBranch size={24} />
          </div>
          <div className="policy-banner-copy">
            <div>
              <strong>A clear path for every purchase</strong>
              <span className="version-pill">Policy v{current.version_number}</span>
            </div>
            <p>
              Manager review for every request. Finance joins at {money(current.threshold_minor)}{' '}
              and above.
            </p>
          </div>
          <Link to="/policies">
            View policy
            <ArrowRight size={16} />
          </Link>
        </section>
      )}
      <div className="overview-columns">
        <section className="panel recent-panel">
          <div className="panel-heading">
            <div>
              <h2>Recent requests</h2>
              <p>The latest movement in your workspace.</p>
            </div>
            <Link className="text-link" to="/requests">
              View all
              <ArrowUpRight size={15} />
            </Link>
          </div>
          <RequestTable requests={data.recent_requests} />
          <div className="panel-footer">
            <span>
              <ShieldCheck size={14} />
              Visible to authorized workspace members
            </span>
            <span>{organization.name}</span>
          </div>
        </section>
        <section className="panel activity-panel">
          <div className="panel-heading">
            <div>
              <h2>Latest activity</h2>
              <p>Every decision leaves a trail.</p>
            </div>
            <span className="activity-live-dot" />
          </div>
          <div className="activity-feed">
            {data.activity.length ? (
              data.activity.map((event) => (
                <div className="activity-item" key={event.id}>
                  <Avatar name={event.actor} size="small" />
                  <div>
                    <strong>{event.actor}</strong>
                    <p>{event.description}</p>
                    <time>
                      {date(event.occurred_at, {
                        year: undefined,
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </time>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                title="A fresh start"
                description="Your workspace activity will appear here."
              />
            )}
          </div>
          {(organization.roles.includes('administrator') ||
            organization.roles.includes('auditor')) && (
            <Link className="activity-footer" to="/activity">
              Open audit history
              <ArrowRight size={16} />
            </Link>
          )}
        </section>
      </div>
      <div className="overview-bottom">
        <section className="panel progress-panel">
          <div className="panel-heading">
            <div>
              <h2>Request health</h2>
              <p>A quick look at your current pipeline.</p>
            </div>
            <span className="subtle-label">{data.total} total</span>
          </div>
          <div className="pipeline-bar" aria-label="Request status distribution">
            {[
              { key: 'approved', color: 'green' },
              { key: 'pending', color: 'amber' },
              { key: 'draft', color: 'slate' },
              { key: 'rejected', color: 'red' },
              { key: 'cancelled', color: 'grey' },
            ].map(({ key, color }) =>
              counts[key] ? (
                <span
                  key={key}
                  className={`pipeline-${color}`}
                  style={{ flex: Number(counts[key]) }}
                  title={`${key}: ${counts[key]}`}
                />
              ) : null,
            )}
            {!data.total && <span className="pipeline-grey" style={{ flex: 1 }} />}
          </div>
          <div className="pipeline-legend">
            {[
              { key: 'approved', label: 'Approved', color: 'green' },
              { key: 'pending', label: 'In review', color: 'amber' },
              { key: 'draft', label: 'Drafts', color: 'slate' },
              { key: 'rejected', label: 'Rejected', color: 'red' },
              { key: 'cancelled', label: 'Cancelled', color: 'grey' },
            ].map(({ key, label, color }) => (
              <span key={key}>
                <i className={`pipeline-${color}`} />
                {label}
                <strong>{counts[key] || 0}</strong>
              </span>
            ))}
          </div>
        </section>
        <section className="guide-card">
          <div className="guide-card-top">
            <span>
              <CircleDashed size={22} />
            </span>
            <span>DESIGNED TO BE CLEAR</span>
          </div>
          <h2>
            One request.
            <br />
            The right next step.
          </h2>
          <p>Learn how requests, reviewers, and policy versions work together.</p>
          <Link to="/guide">
            Get to know your workspace
            <ArrowUpRight size={16} />
          </Link>
        </section>
      </div>
    </>
  );
}
