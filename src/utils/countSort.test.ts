import {describe, expect, it} from 'vitest';

import {MAX_VALUE, MIN_VALUE} from '@/constants';

import countSort from './countSort';

describe('countSort', () => {
    it('returns values in ascending order', () => {
        expect(countSort([5, 1, 4, 2, 3])).toEqual([1, 2, 3, 4, 5]);
    });

    it('preserves duplicate values', () => {
        expect(countSort([3, 1, 3, 2, 1])).toEqual([1, 1, 2, 3, 3]);
    });

    it('keeps an already sorted input unchanged in the result', () => {
        expect(countSort([1, 2, 3, 4, 5])).toEqual([1, 2, 3, 4, 5]);
    });

    it('sorts values at supported boundaries', () => {
        expect(
            countSort([MAX_VALUE, MIN_VALUE, 42, MAX_VALUE, MIN_VALUE])
        ).toEqual([MIN_VALUE, MIN_VALUE, 42, MAX_VALUE, MAX_VALUE]);
    });

    it('does not mutate the input array', () => {
        const input = [5, 4, 3, 2, 1];

        const result = countSort(input);

        expect(input).toEqual([5, 4, 3, 2, 1]);
        expect(result).toEqual([1, 2, 3, 4, 5]);
        expect(result).not.toBe(input);
    });

    it('handles repeated boundary values', () => {
        expect(
            countSort([MAX_VALUE, MAX_VALUE, MIN_VALUE, MIN_VALUE, 100])
        ).toEqual([MIN_VALUE, MIN_VALUE, 100, MAX_VALUE, MAX_VALUE]);
    });
});
