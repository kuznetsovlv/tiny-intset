import {describe, expect, it} from 'vitest';

import {DELIMITER_SYMBOL} from '@/constants';

import simpleSerializer from './simpleSerializer';

describe('simpleSerializer', () => {
    it('serializes numbers using the delimiter symbol', () => {
        expect(simpleSerializer.serialize([1, 300, 237, 188])).toBe(
            `1${DELIMITER_SYMBOL}300${DELIMITER_SYMBOL}237${DELIMITER_SYMBOL}188`
        );
    });

    it('deserializes delimiter-separated numbers', () => {
        expect(simpleSerializer.deserialize('1,300,237,188')).toEqual([
            1, 300, 237, 188,
        ]);
    });

    it('preserves input order', () => {
        const input = [300, 1, 237, 188, 42];

        expect(
            simpleSerializer.deserialize(simpleSerializer.serialize(input))
        ).toEqual(input);
    });

    it('preserves duplicate values', () => {
        const input = [7, 7, 7, 42, 42];

        expect(
            simpleSerializer.deserialize(simpleSerializer.serialize(input))
        ).toEqual(input);
    });

    it('does not mutate the input array', () => {
        const input = [5, 4, 3, 2, 1];

        const serialized = simpleSerializer.serialize(input);

        expect(serialized).toBe('5,4,3,2,1');
        expect(input).toEqual([5, 4, 3, 2, 1]);
    });

    it('uses the same singleton instance when imported through the barrel file', async () => {
        const {simpleSerializer: barrelSimpleSerializer} =
            await import('./index');

        expect(barrelSimpleSerializer).toBe(simpleSerializer);
    });
});
