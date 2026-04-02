import { useEffect } from 'react';

export default function ExpensesPage() {
  useEffect(() => { document.title = 'Expenses — BCC'; }, []);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Expenses</h1>
      </div>
      <div className="bcc-card">
        <p className="text-muted-foreground">Coming soon.</p>
      </div>
    </div>
  );
}
