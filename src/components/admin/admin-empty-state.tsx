interface AdminEmptyStateProps {
	colSpan: number;
	message: string;
}

export default function AdminEmptyState({ colSpan, message }: AdminEmptyStateProps) {
	return (
		<tr>
			<td className="admin-table-empty px-5 py-8 text-center text-sm text-[var(--pp-muted)]" colSpan={colSpan}>
				{message}
			</td>
		</tr>
	);
}
