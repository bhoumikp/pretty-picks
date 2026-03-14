interface AdminTableProps {
  headers: string[];
  rows: Array<Array<React.ReactNode>>;
}

export default function AdminTable({ headers, rows }: AdminTableProps) {
  return (
    <div className="overflow-x-auto border border-[var(--pp-border)] bg-white">
      <table className="admin-table min-w-full text-sm">
        <thead className="bg-[var(--pp-beige)] text-left">
          <tr>
            {headers.map((header) => (
              <th key={header} className="px-4 py-3 font-semibold">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-t border-[var(--pp-border)]">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-4 py-3" data-label={headers[cellIndex]}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
