import {describe, expect, it} from 'vitest';

import {isAlphabet, splitToChars} from './string';

describe('splitToChars', () => {
    it('splits an ASCII string into one-character strings', () => {
        expect(splitToChars('Ab-_')).toEqual(['A', 'b', '-', '_']);
    });
});

describe('isAlphabet', () => {
    it.each([
        '01',
        'ABCD',
        'abcdefghijklmnopqrstuvwxyz',
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_',
        '!~',
    ])('returns true for the valid alphabet %s', (alphabet) => {
        expect(isAlphabet(alphabet)).toBe(true);
    });

    it('accepts the full safe printable ASCII range', () => {
        const alphabet = Array.from({length: 0x7e - 0x21 + 1}, (_, index) =>
            String.fromCharCode(0x21 + index)
        ).join('');

        expect(isAlphabet(alphabet)).toBe(true);
    });

    it.each(['', 'A'])(
        'returns false when the alphabet contains fewer than two characters',
        (alphabet) => {
            expect(isAlphabet(alphabet)).toBe(false);
        }
    );

    it.each(['AA', 'ABCA', '01234567890'])(
        'returns false when the alphabet contains duplicate characters',
        (alphabet) => {
            expect(isAlphabet(alphabet)).toBe(false);
        }
    );

    it('returns false when the alphabet contains a space', () => {
        expect(isAlphabet('A B')).toBe(false);
    });

    it.each([
        `A${String.fromCharCode(0x00)}`,
        `A${String.fromCharCode(0x1f)}`,
        `A${String.fromCharCode(0x7f)}`,
    ])(
        'returns false when the alphabet contains a control character',
        (alphabet) => {
            expect(isAlphabet(alphabet)).toBe(false);
        }
    );

    it.each(['Aé', 'AЖ', 'A🙂'])(
        'returns false when the alphabet contains non-ASCII characters',
        (alphabet) => {
            expect(isAlphabet(alphabet)).toBe(false);
        }
    );

    it('accepts the lower safe printable ASCII boundary', () => {
        expect(isAlphabet('A!')).toBe(true);
    });

    it('accepts the upper safe printable ASCII boundary', () => {
        expect(isAlphabet('A~')).toBe(true);
    });

    it('rejects the character immediately below the allowed range', () => {
        expect(isAlphabet(`A${String.fromCharCode(0x20)}`)).toBe(false);
    });

    it('rejects the character immediately above the allowed range', () => {
        expect(isAlphabet(`A${String.fromCharCode(0x7f)}`)).toBe(false);
    });
});
