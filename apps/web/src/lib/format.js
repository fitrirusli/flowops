export function money(amountMinor = 0) {
  return new Intl.NumberFormat('en-MY', {
    style: 'currency',
    currency: 'MYR',
    minimumFractionDigits: 2,
  }).format(amountMinor / 100);
}

export function parseAmount(value) {
  const normalized = String(value).trim();
  if (!/^\d{1,9}(\.\d{1,2})?$/.test(normalized)) return null;
  const [whole, fraction = ''] = normalized.split('.');
  const amount = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  return Number.isSafeInteger(amount) && amount > 0 && amount <= 99999999999 ? amount : null;
}

export function date(value, options = {}) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Singapore',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...options,
  }).format(new Date(value));
}

export function dateTime(value) {
  return date(value, { hour: '2-digit', minute: '2-digit' });
}

export function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export function statusLabel(status) {
  return (
    {
      pending: 'In review',
      draft: 'Draft',
      approved: 'Approved',
      rejected: 'Rejected',
      cancelled: 'Cancelled',
      waiting: 'Waiting',
    }[status] || status
  );
}
