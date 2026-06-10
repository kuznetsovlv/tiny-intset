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

export function isAlphabet(str: string): boolean {
    if (str.length > 1) {
        const chars = splitToChars(str);
        const uniqChars = Array.from(new Set(chars)).join('');
        if (uniqChars.length === str.length) {
            return chars.every(isSafePrintableAsciiChar);
        }
    }

    return false;
}

function isSafePrintableAsciiChar(char: string): boolean {
    const code = char.charCodeAt(0);

    return code >= 33 && code <= 126;
}
