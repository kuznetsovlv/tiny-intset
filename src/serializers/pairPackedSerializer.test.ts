import {describe, expect, it} from 'vitest';

import pairPackedSerializer from './pairPackedSerializer';
import simpleSerializer from './simpleSerializer';

describe('pairPackedSerializer', () => {
    it('roundtrips a simple array', () => {
        const input = [1, 300, 237, 188, 42];

        expect(
            pairPackedSerializer.deserialize(
                pairPackedSerializer.serialize(input)
            )
        ).toEqual(input);
    });

    it('roundtrips boundary values', () => {
        const input = [1, 300, 1, 300, 1];

        expect(
            pairPackedSerializer.deserialize(
                pairPackedSerializer.serialize(input)
            )
        ).toEqual(input);
    });

    it('roundtrips duplicates', () => {
        const input = [7, 7, 7, 42, 42, 300, 300];

        expect(
            pairPackedSerializer.deserialize(
                pairPackedSerializer.serialize(input)
            )
        ).toEqual(input);
    });

    it('preserves input order', () => {
        const input = [300, 1, 237, 188, 42, 5];

        expect(
            pairPackedSerializer.deserialize(
                pairPackedSerializer.serialize(input)
            )
        ).toEqual(input);
    });

    it('does not mutate input', () => {
        const input = [300, 1, 237, 188, 42];
        const original = [...input];

        pairPackedSerializer.serialize(input);

        expect(input).toEqual(original);
    });

    it('handles odd-length decimal strings with delimiter padding', () => {
        const input = [1, 2, 3, 4, 5];
        const simple = simpleSerializer.serialize(input);

        expect(simple.length % 2).toBe(1);

        expect(
            pairPackedSerializer.deserialize(
                pairPackedSerializer.serialize(input)
            )
        ).toEqual(input);
    });

    it('handles even-length decimal strings without padding', () => {
        const input = [10, 20, 30, 40, 50];
        const simple = simpleSerializer.serialize(input);

        expect(simple.length % 2).toBe(0);

        expect(
            pairPackedSerializer.deserialize(
                pairPackedSerializer.serialize(input)
            )
        ).toEqual(input);
    });

    it('compresses to ceil of half the simple serialized length', () => {
        const input = [1, 300, 237, 188, 42, 17, 99, 100, 255, 300];

        const simple = simpleSerializer.serialize(input);
        const packed = pairPackedSerializer.serialize(input);

        expect(packed.length).toBe(Math.ceil(simple.length / 2));
        expect(packed.length).toBeLessThan(simple.length);
    });

    it('uses only ASCII character codes from 1 to 121', () => {
        const input = [1, 300, 237, 188, 42, 17, 99, 100, 255, 300];
        const packed = pairPackedSerializer.serialize(input);

        for (let index = 0; index < packed.length; index += 1) {
            const code = packed.charCodeAt(index);

            expect(code).toBeGreaterThanOrEqual(1);
            expect(code).toBeLessThanOrEqual(121);
        }
    });

    it('throws on NUL character in packed payload', () => {
        expect(() => pairPackedSerializer.deserialize('\u0000')).toThrow(
            'Invalid PairPackedSerializer character code'
        );
    });

    it('throws on character code above PairPackedSerializer range', () => {
        expect(() =>
            pairPackedSerializer.deserialize(String.fromCharCode(122))
        ).toThrow('Invalid PairPackedSerializer character code');

        expect(() =>
            pairPackedSerializer.deserialize(String.fromCharCode(127))
        ).toThrow('Invalid PairPackedSerializer character code');
    });
});
