import type { AgeStage } from "./types";

interface Props {
	stages: AgeStage[];
	selected: string | null;
	onSelect: (slug: string) => void;
	labels: Record<string, string>;
	compact?: boolean;
	dob: string | null;
	onDobChange: (dob: string | null) => void;
}

export function AgeSelector({
	stages,
	selected,
	onSelect,
	labels,
	compact,
	dob,
	onDobChange,
}: Props) {
	if (compact) {
		return (
			<div class="matrix-sticky-bar">
				<span class="matrix-sticky-label">{labels["matrix.sticky.label"]}</span>
				<div
					role="radiogroup"
					aria-label="Select age range"
					class="matrix-age-pills matrix-age-pills--compact"
				>
					{stages.map((s) => (
						<button
							key={s.slug}
							role="radio"
							aria-checked={selected === s.slug}
							class={`matrix-age-pill matrix-age-pill--compact ${selected === s.slug ? "matrix-age-pill--active" : ""}`}
							onClick={() => onSelect(s.slug)}
							type="button"
						>
							{labels[s.labelKey]}
						</button>
					))}
				</div>
			</div>
		);
	}

	return (
		<div class="matrix-age-selector">
			<div
				role="radiogroup"
				aria-label="Select age range"
				class="matrix-age-pills"
			>
				{stages.map((s) => (
					<button
						key={s.slug}
						role="radio"
						aria-checked={selected === s.slug}
						class={`matrix-age-pill ${selected === s.slug ? "matrix-age-pill--active" : ""}`}
						onClick={() => onSelect(s.slug)}
						type="button"
					>
						{labels[s.labelKey]}
					</button>
				))}
			</div>
			<div class="matrix-birthday-row">
				{dob ? (
					<button
						class="matrix-birthday-link"
						onClick={() => onDobChange(null)}
						type="button"
					>
						{labels["matrix.hero.birthday.clear"]}
					</button>
				) : (
					<label class="matrix-birthday-link">
						{labels["matrix.hero.birthday"]}
						<input
							type="date"
							class="matrix-birthday-input"
							onChange={(e) => {
								const val = (e.target as HTMLInputElement).value;
								if (val) onDobChange(val);
							}}
						/>
					</label>
				)}
			</div>
		</div>
	);
}
