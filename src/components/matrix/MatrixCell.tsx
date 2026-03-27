import type { CellContent } from "./types";

interface Props {
	cell: CellContent;
	isSelected: boolean;
	placeholderLabel: string;
}

export function MatrixCell({ cell, isSelected, placeholderLabel }: Props) {
	const selectedClass = isSelected ? "matrix-card--selected" : "";

	if (cell.type === "placeholder") {
		return (
			<div class={`matrix-card matrix-card--placeholder ${selectedClass}`}>
				<span class="matrix-card__title matrix-card__title--muted">
					{cell.domainLabel}
				</span>
				<span class="matrix-card__hook matrix-card__hook--muted">
					{placeholderLabel}
				</span>
			</div>
		);
	}

	return (
		<a
			href={cell.url}
			class={`matrix-card matrix-card--${cell.type} ${selectedClass}`}
		>
			<span class="matrix-card__title">{cell.title}</span>
			{cell.hook && <span class="matrix-card__hook">{cell.hook}</span>}
		</a>
	);
}
