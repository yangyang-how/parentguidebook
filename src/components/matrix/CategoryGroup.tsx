import { DomainRow } from "./DomainRow";
import type { AgeStage, CardData, CellContent, DomainConfig } from "./types";
import { CATEGORY_COLORS, CATEGORY_ICONS } from "./types";

interface Props {
	categorySlug: string;
	categoryLabel: string;
	domains: DomainConfig[];
	stages: AgeStage[];
	cellMap: Record<string, Record<string, CellContent>>;
	rowHeaders: Record<string, CardData | null>;
	selectedStage: string | null;
	labels: Record<string, string>;
	isMobile: boolean;
}

export function CategoryGroup({
	categorySlug,
	categoryLabel,
	domains,
	stages,
	cellMap,
	rowHeaders,
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
					cells={cellMap[domain.slug] || {}}
					rowHeader={rowHeaders[domain.slug] || null}
					selectedStage={selectedStage}
					labels={labels}
					isMobile={isMobile}
				/>
			))}
		</div>
	);
}
