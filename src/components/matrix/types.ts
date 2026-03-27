export interface CellData {
	type: "domain" | "timeline";
	url: string;
}

export interface DomainConfig {
	slug: string;
	labelKey: string;
	ready: boolean;
	category: string;
	categoryLabelKey: string;
}

export interface AgeStage {
	slug: string;
	labelKey: string;
	label: string;
	order: number;
}

export interface MatrixProps {
	domains: DomainConfig[];
	stages: AgeStage[];
	contentMap: Record<string, Record<string, CellData | null>>;
	lang: "en" | "zh";
	labels: Record<string, string>;
}

/** Category colors — maps category slug to CSS variable name */
export const CATEGORY_COLORS: Record<string, string> = {
	"child-body": "var(--color-accent-green)",
	"child-mind": "var(--color-accent-blue)",
	"child-heart": "var(--color-accent-coral)",
	parent: "var(--color-accent-amber)",
	family: "var(--color-accent-purple)",
};

/** Category icons */
export const CATEGORY_ICONS: Record<string, string> = {
	"child-body": "\u{1F33F}",
	"child-mind": "\u{1F9E0}",
	"child-heart": "\u{1F49B}",
	parent: "\u{1F33B}",
	family: "\u{1F3E0}",
};
