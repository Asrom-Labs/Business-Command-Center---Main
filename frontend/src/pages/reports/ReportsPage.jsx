import { useEffect } from 'react';

export default function ReportsPage() {
  useEffect(() => { document.title = 'Reports — BCC'; }, []);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Reports</h1>
      </div>
      <div className="bcc-card">
        <p className="text-muted-foreground">Coming soon.</p>
      </div>
    </div>
  );
}
