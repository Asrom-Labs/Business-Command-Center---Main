import { useEffect } from 'react';

export default function ChangePasswordPage() {
  useEffect(() => { document.title = 'Change Password — BCC'; }, []);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Change Password</h1>
      </div>
      <div className="bcc-card">
        <p className="text-muted-foreground text-sm">Password change coming soon.</p>
      </div>
    </div>
  );
}
