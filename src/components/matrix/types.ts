/** Data for a single matrix card (cell, row header, or column header). */
export interface CardData {
	title: string;
	hook: string;
	url: string;
	type: "domain" | "timeline" | "cell";
}

/** Placeholder for cells without articles yet. */
export interface PlaceholderData {
	type: "placeholder";
	domainLabel: string;
}

export type CellContent = CardData | PlaceholderData;

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
	/** domain slug → stage slug → card or placeholder */
	cellMap: Record<string, Record<string, CellContent>>;
	/** domain slug → overview card (row header) */
	rowHeaders: Record<string, CardData | null>;
	/** stage slug → timeline card (column header) */
	colHeaders: Record<string, CardData | null>;
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
