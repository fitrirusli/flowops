import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Check, GitBranch, Layers3, LockKeyhole, ShieldCheck } from 'lucide-react';
import { useSession } from '../../app/SessionContext';
import { api } from '../../lib/api';
import { ErrorMessage, Logo } from '../../components/ui';

export default function Login() {
  const { login, error: sessionError, notice } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const demo = useQuery({ queryKey: ['demo'], queryFn: () => api('/api/v1/demo'), retry: false });
  async function submit(event) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(email, password);
    } catch (failure) {
      setError(failure);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="login-page">
      <section className="login-story">
        <Logo />
        <div className="login-story-content">
          <span className="login-kicker">
            <span />A CLEARER WAY TO WORK
          </span>
          <h1>
            Good decisions.
            <br />
            Less back-and-forth.
          </h1>
          <p>
            Give every purchase request a clear path, the right reviewers, and a history you can
            trust.
          </p>
          <div className="login-flow">
            <div className="login-flow-line" />
            {[
              {
                icon: FileIcon,
                title: 'Request submitted',
                sub: 'The right information, in one place',
                state: 'done',
              },
              {
                icon: Check,
                title: 'Manager approved',
                sub: 'A clear decision, recorded',
                state: 'done',
              },
              {
                icon: GitBranch,
                title: 'Finance review',
                sub: 'The next step is already in motion',
                state: 'active',
              },
            ].map(({ icon: Icon, title, sub, state }) => (
              <div className={`login-flow-step ${state}`} key={title}>
                <span>
                  <Icon size={18} />
                </span>
                <div>
                  <strong>{title}</strong>
                  <small>{sub}</small>
                </div>
                {state === 'done' && <Check size={16} className="flow-check" />}
              </div>
            ))}
          </div>
          <div className="login-trust">
            <span>
              <ShieldCheck size={16} />
              Separate workspaces
            </span>
            <span>
              <Layers3 size={16} />
              Versioned policies
            </span>
          </div>
        </div>
        <div className="login-story-footer">
          PURCHASE APPROVAL ENGINE <span>BUILT WITH INTENTION.</span>
        </div>
      </section>
      <main className="login-form-side">
        <div className="login-form-wrap">
          <div className="eyebrow">WELCOME TO YOUR WORKSPACE</div>
          <h2>Make work flow.</h2>
          <p className="login-intro">Sign in to manage requests and keep decisions moving.</p>
          {notice && <div className="info-notice">{notice}</div>}
          <ErrorMessage error={error || sessionError} />
          <form onSubmit={submit} className="login-form">
            <label>
              Email address
              <input
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
              />
            </label>
            <label>
              Password
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
              />
            </label>
            <div className="login-secure">
              <LockKeyhole size={14} />
              Protected with a secure browser session
            </div>
            <button className="button button-primary login-submit" disabled={busy}>
              {busy ? 'Signing in…' : 'Sign in to workspace'}
              <ArrowRight size={18} />
            </button>
          </form>
          {demo.data && (
            <div className="demo-accounts">
              <div className="demo-heading">
                <span>EXPLORE THE DEMO</span>
                <span>Sample accounts</span>
              </div>
              <p>Choose a role to fill in the demo credentials.</p>
              <div className="demo-grid">
                {demo.data.data.accounts.map((account) => (
                  <button
                    type="button"
                    key={account.email}
                    className={`demo-account ${email === account.email ? 'selected' : ''}`}
                    onClick={() => {
                      setEmail(account.email);
                      setPassword(demo.data.data.password);
                    }}
                  >
                    <span className="avatar avatar-small">{account.initials}</span>
                    <span>
                      <strong>{account.name.split(' ')[0]}</strong>
                      <small>{account.role}</small>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
          <p className="login-bottom">A thoughtful process for every purchase.</p>
        </div>
      </main>
    </div>
  );
}

function FileIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M8 13h8M8 17h5" />
    </svg>
  );
}
