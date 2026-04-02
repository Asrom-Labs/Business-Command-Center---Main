import { useEffect } from 'react';

export default function OrganizationPage() {
  useEffect(() => { document.title = 'Organization — BCC'; }, []);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Organization</h1>
      </div>
      <div className="bcc-card">
        <p className="text-muted-foreground">Coming soon.</p>
      </div>
    </div>
  );
}
