import { DomainRow } from "./DomainRow";
import type { AgeStage, CellData, DomainConfig } from "./types";
import { CATEGORY_COLORS, CATEGORY_ICONS } from "./types";

interface Props {
	categorySlug: string;
	categoryLabel: string;
	domains: DomainConfig[];
	stages: AgeStage[];
	contentMap: Record<string, Record<string, CellData | null>>;
	selectedStage: string | null;
	labels: Record<string, string>;
	isMobile: boolean;
}

export function CategoryGroup({
	categorySlug,
	categoryLabel,
	domains,
	stages,
	contentMap,
	selectedStage,
	labels,
	isMobile,
}: Props) {
	const color = CATEGORY_COLORS[categorySlug] || "var(--color-text-muted)";
	const icon = CATEGORY_ICONS[categorySlug] || "";

	return (
		<div class="matrix-category">
			<div
				class="matrix-category-header"
				style={{ borderBottomColor: color, color }}
			>
				<span>
					{icon} {categoryLabel}
				</span>
			</div>
			{domains.map((domain) => (
				<DomainRow
					key={domain.slug}
					domain={domain}
					stages={stages}
					cells={contentMap[domain.slug] || {}}
					selectedStage={selectedStage}
					labels={labels}
					isMobile={isMobile}
				/>
			))}
		</div>
	);
}
