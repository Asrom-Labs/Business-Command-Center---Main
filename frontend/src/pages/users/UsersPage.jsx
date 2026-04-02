import { useEffect } from 'react';

export default function UsersPage() {
  useEffect(() => { document.title = 'Users — BCC'; }, []);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Users</h1>
      </div>
      <div className="bcc-card">
        <p className="text-muted-foreground">Coming soon.</p>
      </div>
    </div>
  );
}
