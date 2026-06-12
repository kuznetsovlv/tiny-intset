import {MAX_LENGTH, MAX_VALUE, MIN_LENGTH, MIN_VALUE} from '@/constants';

import {isInteger} from './number';

/**
 * Checks whether the provided value satisfies tiny-intset input constraints.
 *
 * A valid input must:
 * - be an array;
 * - contain from {@link MIN_LENGTH} to {@link MAX_LENGTH} values;
 * - contain only integer values;
 * - contain only values in the inclusive range from {@link MIN_VALUE} to {@link MAX_VALUE}.
 *
 * The order of values is not checked because tiny-intset treats input as order-insensitive.
 * Duplicate values are allowed and preserved by codecs that support multiset semantics.
 *
 * @param value - Value to validate.
 * @returns `true` if the value can be safely passed to tiny-intset codecs.
 */
export default function validate(value: unknown): value is number[] {
    return Array.isArray(value) && checkLength(value) && checkContents(value);
}

/**
 * Checks whether the input length matches the supported inclusive range.
 *
 * @param arr - Array to check.
 * @returns `true` if the length is between {@link MIN_LENGTH} and {@link MAX_LENGTH}.
 */
function checkLength(arr: number[]): boolean {
    return arr.length >= MIN_LENGTH && arr.length <= MAX_LENGTH;
}

/**
 * Checks whether every value is an integer within the supported value range.
 *
 * @param arr - Array to check.
 * @returns `true` if every value is a supported integer.
 */
function checkContents(arr: unknown[]): arr is number[] {
    return arr.every((value) => isInteger(value) && isInRange(value));
}

/**
 * Checks whether a value is inside the supported inclusive integer range.
 *
 * @param value - Number to check.
 * @returns `true` if the value is between {@link MIN_VALUE} and {@link MAX_VALUE}.
 */
function isInRange(value: number): boolean {
    return value >= MIN_VALUE && value <= MAX_VALUE;
}
