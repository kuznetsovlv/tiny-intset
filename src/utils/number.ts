const MAX_BITWISE_POWER_OF_TWO = 2 ** 31;

/**
 * Checks whether a value is a positive power of two supported by JavaScript
 * 32-bit bitwise operations.
 *
 * A power of two has exactly one set bit. Subtracting one clears that bit
 * and sets all lower bits, so their bitwise intersection is zero.
 *
 * @param value - Value to check.
 * @returns `true` if the value is a supported positive power of two.
 */
export function isPowerOfTwo(value: number): boolean {
    return (
        isInteger(value) &&
        value > 0 &&
        value <= MAX_BITWISE_POWER_OF_TWO &&
        (value & (value - 1)) === 0
    );
}

/**
 * Checks whether a value is a safe integer number.
 *
 * @param value - Value to check.
 * @returns `true` if the value is a safe integer number.
 */
export function isInteger(value: unknown): value is number {
    return Number.isSafeInteger(value);
}

/**
 * Creates a 32-bit mask with the requested number of least-significant bits set.
 *
 * This helper is intended for small bit lengths used by the serializers.
 *
 * @param length - Number of set bits in the mask.
 * @returns A mask whose `length` least-significant bits are set to `1`.
 */
export function getBitMask(length: number): number {
    return (1 << length) - 1;
}
