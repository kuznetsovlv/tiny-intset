import {describe, expect, it} from 'vitest';

import {MAX_LENGTH} from '@/constants';

import numericBitPackedSerializer from './numericBitPackedSerializer';
import simpleSerializer from './simpleSerializer';

const BASE64URL_PATTERN = /^[A-Za-z0-9_-]+$/;

function roundtrip(input: readonly number[]): number[] {
    return numericBitPackedSerializer.deserialize(
        numericBitPackedSerializer.serialize(input)
    );
}

describe('numericBitPackedSerializer', () => {
    describe('serialize and deserialize', () => {
        it('roundtrips a simple array', () => {
            const input = [1, 2, 3, 4, 5];

            expect(roundtrip(input)).toEqual(input);
        });

        it('roundtrips boundary values', () => {
            const input = [1, 300, 1, 300, 42];

            expect(roundtrip(input)).toEqual(input);
        });

        it('preserves duplicate values', () => {
            const input = [7, 7, 7, 42, 42];

            expect(roundtrip(input)).toEqual(input);
        });

        it('preserves input order', () => {
            const input = [300, 1, 42, 7, 2];

            expect(roundtrip(input)).toEqual(input);
        });

        it('does not mutate input', () => {
            const input = [300, 1, 42, 7, 2];
            const original = [...input];

            numericBitPackedSerializer.serialize(input);

            expect(input).toEqual(original);
        });

        it('roundtrips an input with the maximum supported length', () => {
            const input = Array.from(
                {length: MAX_LENGTH},
                (_, index) => (index % 300) + 1
            );

            expect(roundtrip(input)).toEqual(input);
        });
    });

    describe('payload format', () => {
        it('uses only Base64URL characters', () => {
            const input = [1, 2, 300, 42, 7];

            const payload = numericBitPackedSerializer.serialize(input);

            expect(payload).toMatch(BASE64URL_PATTERN);
        });

        it('produces a stable payload for a known input', () => {
            const input = [1, 2, 300, 42, 7];

            expect(numericBitPackedSerializer.serialize(input)).toBe(
                'AFAABlYpAw'
            );
        });

        it('encodes length 5 as AF', () => {
            const input = [1, 2, 3, 4, 5];

            const payload = numericBitPackedSerializer.serialize(input);

            expect(payload.slice(0, 2)).toBe('AF');
        });

        it.each([
            [5, 10],
            [50, 77],
            [100, 152],
            [500, 752],
            [1000, 1502],
        ])(
            'uses the expected payload length for %i values',
            (length, expectedLength) => {
                const input = Array.from(
                    {length},
                    (_, index) => (index % 300) + 1
                );

                expect(
                    numericBitPackedSerializer.serialize(input)
                ).toHaveLength(expectedLength);
            }
        );
    });

    describe('compression', () => {
        it.each([50, 100, 500, 1000])(
            'is shorter than simple serialization for %i three-digit-heavy values',
            (length) => {
                const input = Array.from(
                    {length},
                    (_, index) => 100 + (index % 201)
                );

                const numericPayload =
                    numericBitPackedSerializer.serialize(input);
                const simplePayload = simpleSerializer.serialize(input);

                expect(numericPayload.length).toBeLessThan(
                    simplePayload.length
                );
            }
        );
    });

    describe('invalid payloads', () => {
        it('rejects a missing length header', () => {
            expect(() => numericBitPackedSerializer.deserialize('A')).toThrow(
                'Invalid numeric bit-packed payload: missing length header.'
            );
        });

        it('rejects a decoded length below the supported minimum', () => {
            expect(() => numericBitPackedSerializer.deserialize('AA')).toThrow(
                'decoded length 0 must be between 5 and 1000'
            );
        });

        it('rejects a decoded length above the supported maximum', () => {
            expect(() => numericBitPackedSerializer.deserialize('Pp')).toThrow(
                'decoded length 1001 must be between 5 and 1000'
            );
        });

        it('rejects a payload shorter than declared by its header', () => {
            expect(() => numericBitPackedSerializer.deserialize('AF')).toThrow(
                'Invalid numeric bit-packed payload length: expected 8 characters, got 0.'
            );
        });

        it('rejects a payload longer than declared by its header', () => {
            const validPayload = numericBitPackedSerializer.serialize([
                1, 2, 3, 4, 5,
            ]);

            expect(() =>
                numericBitPackedSerializer.deserialize(`${validPayload}A`)
            ).toThrow(
                'Invalid numeric bit-packed payload length: expected 8 characters, got 9.'
            );
        });

        it('rejects characters outside the configured alphabet', () => {
            const validPayload = numericBitPackedSerializer.serialize([
                1, 2, 3, 4, 5,
            ]);
            const invalidPayload = `${validPayload.slice(0, 2)}!${validPayload.slice(3)}`;

            expect(() =>
                numericBitPackedSerializer.deserialize(invalidPayload)
            ).toThrow(
                'Invalid numeric bit-packed payload: unexpected character "!".'
            );
        });

        it('rejects an encoded value outside the supported range', () => {
            /*
             * Header AF declares five values.
             * The first packed 9-bit value is 300, while valid encoded values
             * are limited to 0..299.
             */
            expect(() =>
                numericBitPackedSerializer.deserialize('AFlgAAAAAA')
            ).toThrow(
                'Invalid numeric bit-packed payload: encoded value is out of range.'
            );
        });

        it('rejects non-zero padding bits', () => {
            /*
             * AFAABAQDAg is the canonical encoding of [1, 2, 3, 4, 5].
             * Replacing the final `g` with `h` changes only the three padding
             * bits from 000 to 001.
             */
            expect(() =>
                numericBitPackedSerializer.deserialize('AFAABAQDAh')
            ).toThrow(
                'Invalid numeric bit-packed payload: padding bits must be zero.'
            );
        });
    });
});
