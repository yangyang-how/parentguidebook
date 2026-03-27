import { MatrixCell } from "./MatrixCell";
import type { AgeStage, CellData, DomainConfig } from "./types";

interface Props {
	domain: DomainConfig;
	stages: AgeStage[];
	cells: Record<string, CellData | null>;
	selectedStage: string | null;
	labels: Record<string, string>;
	isMobile: boolean;
}

export function DomainRow({
	domain,
	stages,
	cells,
	selectedStage,
	labels,
	isMobile,
}: Props) {
	const domainLabel = labels[domain.labelKey] || domain.slug;
	const hasArticle = Object.values(cells).some((c) => c?.type === "domain");

	if (isMobile) {
		const cell = selectedStage ? cells[selectedStage] : null;
		const stageLabel = selectedStage
			? labels[stages.find((s) => s.slug === selectedStage)?.labelKey || ""] ||
				""
			: "";
		const cellTypeLabel =
			cell?.type === "domain"
				? labels["matrix.legend.deepDive"]
				: cell?.type === "timeline"
					? labels["matrix.legend.timeline"]
					: labels["matrix.legend.none"];

		return (
			<div class="matrix-domain-row matrix-domain-row--mobile">
				<span
					class={`matrix-domain-name ${hasArticle ? "matrix-domain-name--ready" : ""}`}
				>
					{domainLabel}
				</span>
				<MatrixCell
					cell={cell}
					isSelected={false}
					ariaLabel={`${domainLabel}, ${stageLabel} — ${cellTypeLabel}`}
					comingSoonLabel={labels["matrix.legend.none"]}
				/>
			</div>
		);
	}

	return (
		<div class="matrix-domain-row">
			<span
				class={`matrix-domain-name ${hasArticle ? "matrix-domain-name--ready" : ""}`}
			>
				{domainLabel}
			</span>
			{stages.map((stage) => {
				const cell = cells[stage.slug];
				const stageLabel = labels[stage.labelKey] || stage.label;
				const cellTypeLabel =
					cell?.type === "domain"
						? labels["matrix.legend.deepDive"]
						: cell?.type === "timeline"
							? labels["matrix.legend.timeline"]
							: labels["matrix.legend.none"];

				return (
					<MatrixCell
						key={stage.slug}
						cell={cell}
						isSelected={selectedStage === stage.slug}
						ariaLabel={`${domainLabel}, ${stageLabel} — ${cellTypeLabel}`}
						comingSoonLabel={labels["matrix.legend.none"]}
					/>
				);
			})}
		</div>
	);
}
