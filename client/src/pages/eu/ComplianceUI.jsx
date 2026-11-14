export function PageHeading({ eyebrow, title, description }) {
  return (
    <div className="eu-page-heading">
      <p className="eu-eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p className="eu-description">{description}</p>
    </div>
  );
}

export function SummaryCard({ label, value, detail }) {
  return (
    <article className="eu-summary-card">
      <p>{label}</p>
      <strong>{value}</strong>
      <span>{detail}</span>
    </article>
  );
}

export function ReportState({ loading, error, empty, children }) {
  if (loading) {
    return <div className="eu-state" role="status">Loading report data...</div>;
  }

  if (error) {
    const status = error.response?.status;
    const message = error.response?.data?.message;
    const accessMessage = status === 401 || status === 403
      ? "Access was denied. Sign in with an authorized EU compliance account once client authentication is available."
      : message || error.message || "The report could not be loaded.";

    return (
      <div className="eu-state eu-state-error" role="alert">
        <strong>Unable to load report</strong>
        <span>{accessMessage}</span>
      </div>
    );
  }

  if (empty) {
    return <div className="eu-state">No report data is available yet.</div>;
  }

  return children;
}

export function DataTable({ columns, rows, rowKey }) {
  if (rows.length === 0) {
    return <ReportState empty />;
  }

  return (
    <div className="eu-table-wrap">
      <table className="eu-table">
        <thead>
          <tr>{columns.map((column) => <th key={column.key}>{column.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={rowKey ? rowKey(row) : index}>
              {columns.map((column) => (
                <td key={column.key}>
                  {column.render ? column.render(row[column.key], row) : row[column.key] ?? "-"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
