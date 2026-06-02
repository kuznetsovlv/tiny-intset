/**
 * The smallest integer value supported by tiny-intset.
 *
 * The codec is designed for integer arrays where every value is in the
 * inclusive range from {@link MIN_VALUE} to {@link MAX_VALUE}.
 */
export const MIN_VALUE = 1;

/**
 * The largest integer value supported by tiny-intset.
 *
 * The upper bound is inclusive.
 */
export const MAX_VALUE = 300;

/**
 * The smallest supported input array length.
 *
 * This follows the original task constraint: the input contains from
 * {@link MIN_LENGTH} to {@link MAX_LENGTH} numbers.
 */
export const MIN_LENGTH = 5;

/**
 * The largest supported input array length.
 *
 * This upper bound is useful for validation and for choosing compact
 * length encodings.
 */
export const MAX_LENGTH = 1000;
