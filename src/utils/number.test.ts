import {describe, expect, it} from 'vitest';

import {getBitMask, isInteger, isPowerOfTwo} from './number';

describe('isPowerOfTwo', () => {
    it.each([1, 2, 4, 8, 16, 32, 64, 128, 1024])(
        'returns true for %i',
        (value) => {
            expect(isPowerOfTwo(value)).toBe(true);
        }
    );

    it.each([0, 3, 5, 6, 7, 9, 12, 127, 129, 1000])(
        'returns false for %i',
        (value) => {
            expect(isPowerOfTwo(value)).toBe(false);
        }
    );

    it('returns false for negative numbers', () => {
        expect(isPowerOfTwo(-2)).toBe(false);
        expect(isPowerOfTwo(-8)).toBe(false);
    });

    it('returns false for fractional numbers', () => {
        expect(isPowerOfTwo(0.5)).toBe(false);
        expect(isPowerOfTwo(4.5)).toBe(false);
    });

    it('supports the largest positive power of two handled by 32-bit bitwise operations', () => {
        expect(isPowerOfTwo(2 ** 31)).toBe(true);
    });

    it('rejects powers of two outside the supported bitwise range', () => {
        expect(isPowerOfTwo(2 ** 32)).toBe(false);
        expect(isPowerOfTwo(2 ** 40)).toBe(false);
    });

    it('returns false for NaN and infinities', () => {
        expect(isPowerOfTwo(Number.NaN)).toBe(false);
        expect(isPowerOfTwo(Number.POSITIVE_INFINITY)).toBe(false);
        expect(isPowerOfTwo(Number.NEGATIVE_INFINITY)).toBe(false);
    });
});

describe('isInteger', () => {
    it.each([0, 1, -1, 300, Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER])(
        'returns true for the safe integer %s',
        (value) => {
            expect(isInteger(value)).toBe(true);
        }
    );

    it.each([
        1.5,
        -1.5,
        Number.NaN,
        Number.POSITIVE_INFINITY,
        Number.NEGATIVE_INFINITY,
        Number.MAX_SAFE_INTEGER + 1,
    ])('returns false for the non-safe-integer value %s', (value) => {
        expect(isInteger(value)).toBe(false);
    });

    it.each([null, undefined, '1', true, false, {}, []])(
        'returns false for the non-number value %s',
        (value) => {
            expect(isInteger(value)).toBe(false);
        }
    );
});

describe('getBitMask', () => {
    it.each([
        [0, 0b0],
        [1, 0b1],
        [3, 0b111],
        [6, 0b111111],
        [9, 0b111111111],
    ])(
        'returns a mask with %i least-significant bits set',
        (length, expected) => {
            expect(getBitMask(length)).toBe(expected);
        }
    );
});
