import {describe, expect, it} from 'vitest';

import {DELIMITER_SYMBOL} from './constants';

describe('constants', () => {
    it('uses a single-character comma delimiter', () => {
        // PairPackedSerializer packs the canonical baseline representation from
        // the task: comma-separated decimal numbers like "1,300,237,188".
        // Changing the delimiter would change that baseline format and the
        // serializer alphabet, so this invariant is intentionally tested.
        expect(DELIMITER_SYMBOL).toBe(',');
        expect(DELIMITER_SYMBOL).toHaveLength(1);
    });
});
