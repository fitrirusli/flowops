import { useDeferredValue, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Inbox, Plus, Search, SlidersHorizontal } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSession } from '../../app/SessionContext';
import { EmptyState, ErrorMessage, PageHeading, Pagination, Spinner } from '../../components/ui';
import { api, orgPath } from '../../lib/api';
import RequestTable from './RequestTable';

export default function RequestList({ inbox = false }) {
  const { organization } = useSession();
  const requester = organization.roles.includes('requester');
  const [status, setStatus] = useState('all');
  const [view, setView] = useState(requester ? 'mine' : 'all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const deferredSearch = useDeferredValue(search);
  const params = new URLSearchParams({
    status: inbox ? 'pending' : status,
    view: inbox ? 'inbox' : view,
    search: deferredSearch,
    page,
  });
  const list = useQuery({
    queryKey: ['requests', organization.id, inbox, status, view, deferredSearch, page],
    queryFn: ({ signal }) => api(orgPath(organization.id, `/requests?${params}`), { signal }),
    enabled: !inbox || organization.roles.includes('approver'),
  });
  if (inbox && !organization.roles.includes('approver'))
    return (
      <EmptyState
        icon={Inbox}
        title="An approver role is required"
        description="Your current membership does not include an approval inbox."
      />
    );
  return (
    <>
      <PageHeading
        eyebrow={inbox ? 'DECISIONS THAT MOVE WORK FORWARD' : 'FROM IDEA TO APPROVAL'}
        title={inbox ? 'Approval inbox' : requester ? 'My requests' : 'Purchase requests'}
        description={
          inbox
            ? 'Your assigned requests, ready for a considered decision.'
            : 'Create, track, and follow every purchase through its next step.'
        }
        actions={
          requester &&
          !inbox && (
            <Link className="button button-primary" to="/requests/new">
              <Plus size={17} />
              New request
            </Link>
          )
        }
      />
      <section className="panel list-panel">
        <div className="list-toolbar">
          <div className="search-field">
            <Search size={18} />
            <label className="sr-only" htmlFor="request-search">
              Search requests
            </label>
            <input
              id="request-search"
              placeholder="Search by title or reference…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          {!inbox && requester && (
            <label className="view-filter">
              <SlidersHorizontal size={16} />
              <span className="sr-only">Request ownership</span>
              <select
                value={view}
                onChange={(e) => {
                  setView(e.target.value);
                  setPage(1);
                }}
              >
                <option value="mine">My requests</option>
                <option value="all">All accessible requests</option>
              </select>
            </label>
          )}
        </div>
        {!inbox && (
          <div className="filter-tabs" role="group" aria-label="Filter by status">
            {[
              ['all', 'All requests'],
              ['pending', 'In review'],
              ['approved', 'Approved'],
              ['draft', 'Drafts'],
              ['rejected', 'Rejected'],
              ['cancelled', 'Cancelled'],
            ].map(([key, label]) => (
              <button
                key={key}
                className={status === key ? 'active' : ''}
                aria-pressed={status === key}
                onClick={() => {
                  setStatus(key);
                  setPage(1);
                }}
              >
                {label}
              </button>
            ))}
          </div>
        )}
        {list.isPending ? (
          <Spinner label="Loading requests…" />
        ) : list.error ? (
          <div className="panel-padding">
            <ErrorMessage error={list.error} />
          </div>
        ) : list.data.data.length ? (
          <>
            <RequestTable requests={list.data.data} />
            <Pagination meta={list.data.meta} onChange={setPage} />
          </>
        ) : (
          <EmptyState
            icon={inbox ? Inbox : undefined}
            title={inbox ? 'You’re all caught up' : 'No matching requests'}
            description={
              inbox
                ? 'There are no requests waiting for your decision. New assignments will appear here.'
                : search || status !== 'all'
                  ? 'Try a different search or status filter.'
                  : 'Start your first purchase request and follow its progress here.'
            }
            action={
              requester &&
              !inbox &&
              !search &&
              status === 'all' && (
                <Link className="button button-primary" to="/requests/new">
                  <Plus size={16} />
                  Create a request
                </Link>
              )
            }
          />
        )}
      </section>
      <p className="page-footnote">
        {inbox
          ? 'Only the currently assigned reviewer can decide a step. You cannot approve your own request.'
          : 'Access is checked for every request. Records from other organizations stay in their own workspace.'}
      </p>
    </>
  );
}
