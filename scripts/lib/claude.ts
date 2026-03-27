/**
 * Shared helper to call Claude Code CLI instead of the Anthropic API directly.
 *
 * All pipeline scripts use this instead of @anthropic-ai/sdk.
 * Benefits: uses Claude Code subscription (no separate API credits needed),
 * consistent with the rest of the workflow.
 */
import { execFileSync } from "node:child_process";

export interface ClaudeOptions {
	/** Model alias: "opus", "sonnet", or "haiku" */
	model: "opus" | "sonnet" | "haiku";
	/** System prompt */
	systemPrompt: string;
	/** User message / prompt */
	userMessage: string;
	/** Timeout in milliseconds (default: 600_000 = 10 minutes) */
	timeout?: number;
	/** Max budget in USD (default: none) */
	maxBudget?: number;
}

/**
 * Call Claude Code CLI in print mode and return the text response.
 * Uses --bare to skip hooks/CLAUDE.md/memory for clean pipeline execution.
 */
export function callClaude(opts: ClaudeOptions): string {
	const args = [
		"-p",
		"--bare",
		"--model",
		opts.model,
		"--system-prompt",
		opts.systemPrompt,
		"--no-session-persistence",
	];

	if (opts.maxBudget) {
		args.push("--max-budget-usd", String(opts.maxBudget));
	}

	// Pass the user message as the prompt argument
	args.push(opts.userMessage);

	const result = execFileSync("claude", args, {
		timeout: opts.timeout || 600_000,
		encoding: "utf-8",
		maxBuffer: 10 * 1024 * 1024, // 10MB for large responses
	});

	return result;
}

/**
 * Parse a JSON object from Claude's response text.
 * Handles code fences, leading text, and partial JSON gracefully.
 */
export function extractJson<T>(raw: string): T {
	// Strip code fences if present
	const text = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "");

	const firstBrace = text.indexOf("{");
	const lastBrace = text.lastIndexOf("}");
	if (firstBrace === -1 || lastBrace === -1) {
		throw new Error("No JSON object found in response");
	}

	return JSON.parse(text.slice(firstBrace, lastBrace + 1));
}
