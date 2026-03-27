import type { CellData } from "./types";

interface Props {
	cell: CellData | null;
	isSelected: boolean;
	ariaLabel: string;
	comingSoonLabel: string;
}

export function MatrixCell({
	cell,
	isSelected,
	ariaLabel,
	comingSoonLabel,
}: Props) {
	const selectedClass = isSelected ? "matrix-cell--selected" : "";

	if (!cell) {
		return (
			<span
				class={`matrix-cell matrix-cell--none ${selectedClass}`}
				title={comingSoonLabel}
				aria-label={ariaLabel}
			>
				○
			</span>
		);
	}

	return (
		<a
			href={cell.url}
			class={`matrix-cell matrix-cell--${cell.type} ${selectedClass}`}
			aria-label={ariaLabel}
		>
			{cell.type === "domain" ? "●" : "◐"}
		</a>
	);
}
