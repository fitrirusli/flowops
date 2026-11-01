import { ArrowUpRight, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Avatar, EmptyState, Status } from '../../components/ui';
import { date, money } from '../../lib/format';

export default function RequestTable({ requests, showRequester = true }) {
  if (!requests.length)
    return (
      <EmptyState
        title="No requests to show"
        description="Requests matching this view will appear here."
      />
    );
  return (
    <div className="table-scroll">
      <table className="request-table">
        <thead>
          <tr>
            <th>Request</th>
            {showRequester && <th>Requested by</th>}
            <th>Amount</th>
            <th>Status</th>
            <th>Created</th>
            <th>
              <span className="sr-only">Open request</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {requests.map((item) => (
            <tr key={item.id}>
              <td>
                <Link className="request-title" to={`/requests/${item.id}`}>
                  {item.title}
                </Link>
                <div className="table-subtitle">
                  <span>{item.reference}</span>
                  <span className="tiny-dot" />
                  {item.department}
                </div>
              </td>
              {showRequester && (
                <td>
                  <span className="person-cell">
                    <Avatar name={item.requester.name} size="tiny" />
                    <span>{item.requester.name}</span>
                  </span>
                </td>
              )}
              <td className="amount-cell">{money(item.amount_minor)}</td>
              <td>
                <Status value={item.status} />
              </td>
              <td className="date-cell">{date(item.created_at, { year: undefined })}</td>
              <td>
                <Link
                  className="table-open"
                  to={`/requests/${item.id}`}
                  aria-label={`Open ${item.reference}`}
                >
                  <ChevronRight size={17} />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
