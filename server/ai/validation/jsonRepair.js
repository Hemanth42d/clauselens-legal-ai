/**
 * JSON Repair Module for ClauseLens.
 *
 * When AI returns invalid JSON, this module attempts to:
 * 1. Strip markdown fences and extraneous text.
 * 2. Fix common JSON issues (trailing commas, single quotes, etc.)
 * 3. If local repair fails, send ONE repair request to the AI.
 */

/**
 * Attempts to extract and parse JSON from a raw AI text response.
 * Handles common issues like markdown code fences, leading text, etc.
 *
 * @param {string} text - Raw text response from AI
 * @returns {Object|null} Parsed JSON object, or null if repair fails
 */
function tryLocalRepair(text) {
  if (!text || typeof text !== 'string') return null;

  let cleaned = text.trim();

  // Strip markdown code fences: ```json ... ``` or ``` ... ```
  cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '');

  // Strip any leading text before the first { or [
  const firstBrace = cleaned.indexOf('{');
  const firstBracket = cleaned.indexOf('[');
  let startIdx = -1;
  if (firstBrace >= 0 && firstBracket >= 0) {
    startIdx = Math.min(firstBrace, firstBracket);
  } else if (firstBrace >= 0) {
    startIdx = firstBrace;
  } else if (firstBracket >= 0) {
    startIdx = firstBracket;
  }

  if (startIdx > 0) {
    cleaned = cleaned.slice(startIdx);
  }

  // Strip any trailing text after the last } or ]
  const lastBrace = cleaned.lastIndexOf('}');
  const lastBracket = cleaned.lastIndexOf(']');
  const endIdx = Math.max(lastBrace, lastBracket);
  if (endIdx > 0 && endIdx < cleaned.length - 1) {
    cleaned = cleaned.slice(0, endIdx + 1);
  }

  // Attempt direct parse
  try {
    return JSON.parse(cleaned);
  } catch { /* continue to fixes */ }

  // Fix trailing commas before } or ]
  cleaned = cleaned.replace(/,\s*([}\]])/g, '$1');

  // Fix single quotes → double quotes (simple replacement, not inside values)
  // This is a simple heuristic — may not work for all edge cases
  try {
    return JSON.parse(cleaned);
  } catch { /* continue */ }

  // Try replacing single-quoted keys/values
  const doubleQuoted = cleaned.replace(/'/g, '"');
  try {
    return JSON.parse(doubleQuoted);
  } catch { /* give up */ }

  return null;
}

/**
 * Attempts to parse AI response text as JSON.
 * If direct parsing fails, tries local repair.
 * If local repair fails, calls the repairFn (one AI retry).
 *
 * @param {string} text - Raw AI response text
 * @param {Function} [repairFn] - Async function that sends a repair request to AI
 *   and returns the repaired text. Signature: (originalText) => Promise<string>
 * @returns {Promise<Object>} Parsed JSON object
 * @throws {Error} If all repair attempts fail
 */
async function parseWithRepair(text, repairFn) {
  // First: try direct parse
  try {
    return JSON.parse(text);
  } catch { /* continue */ }

  // Second: try local repair
  const localResult = tryLocalRepair(text);
  if (localResult) return localResult;

  // Third: one AI retry if repairFn is provided
  if (typeof repairFn === 'function') {
    try {
      const repairedText = await repairFn(text);
      try {
        return JSON.parse(repairedText);
      } catch { /* continue */ }

      // Try local repair on the retried response too
      const retryResult = tryLocalRepair(repairedText);
      if (retryResult) return retryResult;
    } catch {
      // Repair request itself failed
    }
  }

  // All attempts failed
  throw Object.assign(
    new Error('AI returned invalid JSON that could not be repaired. Please try again.'),
    { status: 502 }
  );
}


module.exports = {
  tryLocalRepair,
  parseWithRepair,
};
