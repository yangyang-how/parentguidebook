import { useEffect, useState } from "preact/hooks";
import type { AgeStage } from "./types";

const STORAGE_KEY = "pgb-child-dob";

function calculateStage(dob: string): string | null {
	const birth = new Date(dob);
	const now = new Date();
	if (Number.isNaN(birth.getTime())) return null;

	const ageMs = now.getTime() - birth.getTime();
	const ageDays = ageMs / (1000 * 60 * 60 * 24);
	const ageMonths = ageDays / 30.44;
	const ageYears = ageDays / 365.25;

	if (ageMonths < 1) return "0-1mo";
	if (ageMonths < 6) return "1-6mo";
	if (ageYears < 2) return "6mo-2yr";
	if (ageYears < 5) return "2-5yr";
	if (ageYears < 12) return "5-12yr";
	return "12-18yr";
}

export function useDob(_stages: AgeStage[]) {
	const [dob, setDobState] = useState<string | null>(null);
	const [stageFromDob, setStageFromDob] = useState<string | null>(null);

	useEffect(() => {
		try {
			const saved = localStorage.getItem(STORAGE_KEY);
			if (saved) {
				setDobState(saved);
				setStageFromDob(calculateStage(saved));
			}
		} catch {
			// localStorage unavailable
		}
	}, []);

	function setDob(value: string | null) {
		setDobState(value);
		if (value) {
			try {
				localStorage.setItem(STORAGE_KEY, value);
			} catch {}
			setStageFromDob(calculateStage(value));
		} else {
			try {
				localStorage.removeItem(STORAGE_KEY);
			} catch {}
			setStageFromDob(null);
		}
	}

	return { dob, stageFromDob, setDob };
}
