import { useEffect } from 'react';

export default function ProfilePage() {
  useEffect(() => { document.title = 'My Profile — BCC'; }, []);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">My Profile</h1>
      </div>
      <div className="bcc-card">
        <p className="text-muted-foreground text-sm">Profile settings coming soon.</p>
      </div>
    </div>
  );
}
