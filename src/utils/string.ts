/**
 * Splits a string into JavaScript string characters.
 *
 * The current serializers work with ASCII-only payloads, so simple
 * `String.prototype.split('')` is enough here. This helper exists mostly to
 * make character-level processing explicit at call sites.
 *
 * @param str - Input string.
 * @returns Array of one-code-unit string characters.
 */
export function splitToChars(str: string): string[] {
    return str.split('');
}
