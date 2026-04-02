import { useEffect } from 'react';

export default function AuditLogPage() {
  useEffect(() => { document.title = 'Audit Log — BCC'; }, []);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Audit Log</h1>
      </div>
      <div className="bcc-card">
        <p className="text-muted-foreground">Coming soon.</p>
      </div>
    </div>
  );
}
