import {describe, expect, it} from 'vitest';

import compressor from './index';

describe('compressor', () => {
    it('Check compressor', () => {
        expect(compressor('text')).toBe('text');
    });
});
