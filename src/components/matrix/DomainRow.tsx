import { MatrixCell } from "./MatrixCell";
import type { AgeStage, CardData, CellContent, DomainConfig } from "./types";

interface Props {
	domain: DomainConfig;
	stages: AgeStage[];
	cells: Record<string, CellContent>;
	rowHeader: CardData | null;
	selectedStage: string | null;
	labels: Record<string, string>;
	isMobile: boolean;
}

export function DomainRow({
	domain,
	stages,
	cells,
	rowHeader,
	selectedStage,
	labels,
	isMobile,
}: Props) {
	const domainLabel = labels[domain.labelKey] || domain.slug;

	// Row header card — title only (placeholders keep a status label)
	const headerCard = rowHeader ? (
		<a href={rowHeader.url} class="matrix-card matrix-card--row-header">
			<span class="matrix-card__title">{rowHeader.title}</span>
		</a>
	) : (
		<div class="matrix-card matrix-card--row-header matrix-card--placeholder">
			<span class="matrix-card__title matrix-card__title--muted">
				{domainLabel}
			</span>
			<span class="matrix-card__hook matrix-card__hook--muted">
				{labels["matrix.placeholder"]}
			</span>
		</div>
	);

	if (isMobile) {
		const cell = selectedStage ? cells[selectedStage] : null;
		return (
			<div class="matrix-row matrix-row--mobile">
				{headerCard}
				{cell && (
					<MatrixCell
						cell={cell}
						isSelected={false}
						placeholderLabel={labels["matrix.placeholder"]}
						resolvedDomainLabel={domainLabel}
					/>
				)}
			</div>
		);
	}

	return (
		<div class="matrix-row">
			{headerCard}
			{stages.map((stage) => (
				<MatrixCell
					key={stage.slug}
					cell={cells[stage.slug]}
					isSelected={selectedStage === stage.slug}
					placeholderLabel={labels["matrix.placeholder"]}
					resolvedDomainLabel={domainLabel}
				/>
			))}
		</div>
	);
}
