/**
 * First printable ASCII code after the space character.
 */
const MIN_SAFE_PRINTABLE_ASCII_CODE = 0x21; // !

/**
 * Last printable ASCII code.
 */
const MAX_SAFE_PRINTABLE_ASCII_CODE = 0x7e; // ~

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

/**
 * Checks whether a string can be used as a serializer alphabet.
 *
 * A valid alphabet contains at least two unique safe printable ASCII
 * characters. The space character is intentionally excluded because it is
 * difficult to distinguish in serialized payloads, logs, and error messages.
 *
 * @param str - String to check.
 * @returns `true` if the string is a valid alphabet.
 */
export function isAlphabet(str: string): boolean {
    if (str.length > 1) {
        const chars = splitToChars(str);

        return (
            new Set(chars).size === chars.length &&
            chars.every(isSafePrintableAsciiChar)
        );
    }

    return false;
}

/**
 * Checks whether a character belongs to the safe printable ASCII range.
 *
 * The accepted range is `!` (`0x21`) through `~` (`0x7e`), intentionally
 * excluding the space character.
 *
 * @param char - Single character to check.
 * @returns `true` if the character is a safe printable ASCII character.
 */
function isSafePrintableAsciiChar(char: string): boolean {
    const code = char.charCodeAt(0);

    return (
        code >= MIN_SAFE_PRINTABLE_ASCII_CODE &&
        code <= MAX_SAFE_PRINTABLE_ASCII_CODE
    );
}
