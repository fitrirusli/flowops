import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider, useSession } from './app/SessionContext';
import Layout from './app/Layout';
import Login from './features/auth/Login';
import Overview from './features/workspace/Overview';
import RequestList from './features/requests/RequestList';
import RequestEditor from './features/requests/RequestEditor';
import RequestDetail from './features/requests/RequestDetail';
import Policy from './features/policies/Policy';
import { ActivityPage, GuidePage, MembersPage } from './features/workspace/WorkspacePages';
import { ErrorMessage, Spinner } from './components/ui';
import './styles.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
    mutations: { retry: false },
  },
});

function App() {
  const { user, organization, loading, logout } = useSession();
  if (loading) return <Spinner label="Opening your workspace…" />;
  if (!user) return <Login />;
  if (!organization)
    return (
      <div className="no-workspace">
        <h1>No active workspace</h1>
        <p>
          Your account does not have an active organization membership. Contact your administrator.
        </p>
        <button className="button button-secondary" onClick={logout}>
          Sign out
        </button>
      </div>
    );
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Overview />} />
        <Route path="requests" element={<RequestList />} />
        <Route path="inbox" element={<RequestList inbox />} />
        <Route path="requests/new" element={<RequestEditor />} />
        <Route path="requests/:id/edit" element={<RequestEditor />} />
        <Route path="requests/:id" element={<RequestDetail />} />
        <Route path="policies" element={<Policy />} />
        <Route path="members" element={<MembersPage />} />
        <Route path="activity" element={<ActivityPage />} />
        <Route path="guide" element={<GuidePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

class ErrorBoundary extends React.Component {
  state = { error: null };
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    return this.state.error ? (
      <div className="no-workspace">
        <h1>The workspace could not be displayed.</h1>
        <ErrorMessage error="Please reload the page. If this continues, check the application logs." />
        <button className="button button-primary" onClick={() => window.location.reload()}>
          Reload workspace
        </button>
      </div>
    ) : (
      this.props.children
    );
  }
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <SessionProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </SessionProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
