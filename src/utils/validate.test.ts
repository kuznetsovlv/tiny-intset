import {describe, expect, it} from 'vitest';

import {MAX_LENGTH, MAX_VALUE, MIN_LENGTH, MIN_VALUE} from '@/constants';

import validate from './validate';

describe('validate', () => {
    it('returns true for a valid input with minimum supported length', () => {
        expect(
            validate(Array.from({length: MIN_LENGTH}, () => MIN_VALUE))
        ).toBe(true);
    });

    it('returns true for a valid input with maximum supported length', () => {
        expect(
            validate(Array.from({length: MAX_LENGTH}, () => MAX_VALUE))
        ).toBe(true);
    });

    it('returns true for boundary values and duplicates', () => {
        expect(validate([MIN_VALUE, MAX_VALUE, 42, 42, 100])).toBe(true);
    });

    it('returns false when value is not an array', () => {
        expect(validate(null)).toBe(false);
        expect(validate(undefined)).toBe(false);
        expect(validate('1,2,3,4,5')).toBe(false);
        expect(validate({length: MIN_LENGTH})).toBe(false);
    });

    it('returns false when the input is shorter than the minimum supported length', () => {
        expect(
            validate(Array.from({length: MIN_LENGTH - 1}, () => MIN_VALUE))
        ).toBe(false);
    });

    it('returns false when the input is longer than the maximum supported length', () => {
        expect(
            validate(Array.from({length: MAX_LENGTH + 1}, () => MIN_VALUE))
        ).toBe(false);
    });

    it('returns false when a value is below the minimum supported value', () => {
        expect(validate([MIN_VALUE - 1, 2, 3, 4, 5])).toBe(false);
    });

    it('returns false when a value is above the maximum supported value', () => {
        expect(validate([1, 2, 3, 4, MAX_VALUE + 1])).toBe(false);
    });

    it('returns false for non-integer or non-number values', () => {
        expect(validate([1, 2, 3, 4, 5.5])).toBe(false);
        expect(validate([1, 2, 3, 4, Number.NaN])).toBe(false);
        expect(validate([1, 2, 3, 4, Number.POSITIVE_INFINITY])).toBe(false);
        expect(validate([1, 2, 3, 4, '5'])).toBe(false);
    });
});
