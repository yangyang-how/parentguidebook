interface Props {
	labels: Record<string, string>;
}

export function Legend({ labels }: Props) {
	return (
		<div class="matrix-legend">
			<div class="matrix-legend-item">
				<span class="matrix-legend-dot matrix-legend-dot--domain">●</span>
				{labels["matrix.legend.deepDive"]}
			</div>
			<div class="matrix-legend-item">
				<span class="matrix-legend-dot matrix-legend-dot--timeline">◐</span>
				{labels["matrix.legend.timeline"]}
			</div>
			<div class="matrix-legend-item">
				<span class="matrix-legend-dot matrix-legend-dot--none">○</span>
				{labels["matrix.legend.none"]}
			</div>
			<div class="matrix-legend-item">
				<span class="matrix-legend-swatch" />
				{labels["matrix.legend.selectedAge"]}
			</div>
		</div>
	);
}
