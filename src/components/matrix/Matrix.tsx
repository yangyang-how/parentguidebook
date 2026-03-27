import { useEffect, useRef, useState } from "preact/hooks";
import { CATEGORIES } from "../../config/domains";
import { AgeSelector } from "./AgeSelector";
import { CategoryGroup } from "./CategoryGroup";
import { Legend } from "./Legend";
import type { MatrixProps } from "./types";
import { useDob } from "./use-dob";

export default function Matrix({
	domains,
	stages,
	cellMap,
	rowHeaders,
	colHeaders,
	lang: _lang,
	labels,
}: MatrixProps) {
	const { dob, stageFromDob, setDob } = useDob(stages);
	const [selectedStage, setSelectedStage] = useState<string | null>(null);
	const [showSticky, setShowSticky] = useState(false);
	const [isMobile, setIsMobile] = useState(false);
	const heroRef = useRef<HTMLDivElement>(null);

	// Set initial stage from DOB
	useEffect(() => {
		if (stageFromDob && !selectedStage) {
			setSelectedStage(stageFromDob);
		}
	}, [stageFromDob]);

	// Responsive detection
	useEffect(() => {
		const mq = window.matchMedia("(max-width: 768px)");
		setIsMobile(mq.matches);
		const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
		mq.addEventListener("change", handler);
		return () => mq.removeEventListener("change", handler);
	}, []);

	// Sticky selector via IntersectionObserver
	useEffect(() => {
		if (!heroRef.current) return;
		const observer = new IntersectionObserver(
			([entry]) => setShowSticky(!entry.isIntersecting),
			{ threshold: 0 },
		);
		observer.observe(heroRef.current);
		return () => observer.disconnect();
	}, []);

	// Mobile swipe
	const touchStart = useRef<{ x: number; y: number } | null>(null);
	function onPointerDown(e: PointerEvent) {
		touchStart.current = { x: e.clientX, y: e.clientY };
	}
	function onPointerUp(e: PointerEvent) {
		if (!touchStart.current || !selectedStage) return;
		const dx = e.clientX - touchStart.current.x;
		const dy = Math.abs(e.clientY - touchStart.current.y);
		touchStart.current = null;

		if (Math.abs(dx) < 50 || dy > 30) return;

		const idx = stages.findIndex((s) => s.slug === selectedStage);
		if (dx < 0 && idx < stages.length - 1) {
			setSelectedStage(stages[idx + 1].slug);
		} else if (dx > 0 && idx > 0) {
			setSelectedStage(stages[idx - 1].slug);
		}
	}

	// Group domains by category
	const categorized = CATEGORIES.map((cat) => ({
		slug: cat.slug,
		labelKey: cat.labelKey,
		domains: domains.filter((d) => d.category === cat.slug),
	}));

	// Mobile navigation arrows
	function prevStage() {
		if (!selectedStage) return;
		const idx = stages.findIndex((s) => s.slug === selectedStage);
		if (idx > 0) setSelectedStage(stages[idx - 1].slug);
	}
	function nextStage() {
		if (!selectedStage) return;
		const idx = stages.findIndex((s) => s.slug === selectedStage);
		if (idx < stages.length - 1) setSelectedStage(stages[idx + 1].slug);
	}

	const selectedLabel = selectedStage
		? labels[stages.find((s) => s.slug === selectedStage)?.labelKey || ""] || ""
		: "";

	return (
		<div class="matrix-root">
			{/* Hero area */}
			<div ref={heroRef} class="matrix-hero">
				<h1 class="matrix-hero-title">{labels["matrix.hero.title"]}</h1>
				<p class="matrix-hero-subtitle">{labels["matrix.hero.subtitle"]}</p>
				<AgeSelector
					stages={stages}
					selected={selectedStage}
					onSelect={setSelectedStage}
					labels={labels}
					dob={dob}
					onDobChange={setDob}
				/>
			</div>

			{/* Sticky selector */}
			{showSticky && (
				<div class="matrix-sticky-wrapper">
					<AgeSelector
						stages={stages}
						selected={selectedStage}
						onSelect={setSelectedStage}
						labels={labels}
						compact
						dob={dob}
						onDobChange={setDob}
					/>
				</div>
			)}

			{/* Mobile stage indicator */}
			{isMobile && selectedStage && (
				<div class="matrix-mobile-nav">
					<button
						class="matrix-mobile-arrow"
						onClick={prevStage}
						aria-label="Previous age"
						type="button"
					>
						←
					</button>
					<span class="matrix-mobile-stage">
						{labels["matrix.mobile.showing"]}: {selectedLabel}
					</span>
					<button
						class="matrix-mobile-arrow"
						onClick={nextStage}
						aria-label="Next age"
						type="button"
					>
						→
					</button>
				</div>
			)}

			{/* Column headers (timeline cards) — desktop only */}
			{!isMobile && (
				<div class="matrix-col-headers">
					<div class="matrix-col-header-spacer" />
					{stages.map((stage) => {
						const col = colHeaders[stage.slug];
						const isSelected = selectedStage === stage.slug;
						if (col) {
							return (
								<a
									key={stage.slug}
									href={col.url}
									class={`matrix-card matrix-card--col-header ${isSelected ? "matrix-card--selected" : ""}`}
									onClick={(e) => {
										e.preventDefault();
										setSelectedStage(stage.slug);
									}}
									onDblClick={() => {
										if (col.url) window.location.href = col.url;
									}}
								>
									<span class="matrix-card__title">
										{labels[stage.labelKey]}
									</span>
								</a>
							);
						}
						return (
							<div
								key={stage.slug}
								class={`matrix-card matrix-card--col-header matrix-card--placeholder ${isSelected ? "matrix-card--selected" : ""}`}
							>
								<span class="matrix-card__title matrix-card__title--muted">
									{labels[stage.labelKey]}
								</span>
							</div>
						);
					})}
				</div>
			)}

			{/* Matrix grid */}
			<div
				class={`matrix-grid ${isMobile ? "matrix-grid--mobile" : ""}`}
				onPointerDown={isMobile ? onPointerDown : undefined}
				onPointerUp={isMobile ? onPointerUp : undefined}
			>
				{categorized.map((cat) => (
					<CategoryGroup
						key={cat.slug}
						categorySlug={cat.slug}
						categoryLabel={labels[cat.labelKey] || cat.slug}
						domains={cat.domains}
						stages={stages}
						cellMap={cellMap}
						rowHeaders={rowHeaders}
						selectedStage={selectedStage}
						labels={labels}
						isMobile={isMobile}
					/>
				))}
			</div>

			<Legend labels={labels} />
		</div>
	);
}
