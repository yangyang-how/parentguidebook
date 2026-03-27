interface Props {
	labels: Record<string, string>;
}

export function Legend({ labels }: Props) {
	return (
		<div class="matrix-legend">
			<div class="matrix-legend-item">
				<span class="matrix-legend-swatch matrix-legend-swatch--active" />
				{labels["matrix.legend.selectedAge"]}
			</div>
			<div class="matrix-legend-item">
				<span class="matrix-legend-swatch matrix-legend-swatch--placeholder" />
				{labels["matrix.placeholder"]}
			</div>
		</div>
	);
}
