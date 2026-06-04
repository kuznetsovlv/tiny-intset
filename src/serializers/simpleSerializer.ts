import {DELIMITER_SYMBOL} from '@/constants';

import Serializer from './serializer';

/**
 * Naive decimal serializer using delimiter-separated numbers.
 *
 * This serializer intentionally matches the baseline representation from
 * the original task, for example: `1,300,237,188`.
 *
 * It is a low-level serializer and assumes that validation is handled by the
 * public API layer.
 *
 * This serializer does not compress data.
 */
class SimpleSerializer extends Serializer {
    /**
     * Serializes numbers as a delimiter-separated decimal string.
     *
     * The input order is preserved. The input array is not mutated.
     *
     * @param input - Validated tiny-intset input.
     * @returns Decimal string joined with {@link DELIMITER_SYMBOL}.
     */
    public serialize(input: readonly number[]): string {
        return input.join(DELIMITER_SYMBOL);
    }

    /**
     * Deserializes a delimiter-separated decimal string.
     *
     * The method assumes that the input was produced by
     * {@link SimpleSerializer.serialize}. It does not validate malformed
     * strings.
     *
     * @param input - Serialized decimal string.
     * @returns Parsed array of numbers.
     */
    public deserialize(input: string): number[] {
        return input.split(DELIMITER_SYMBOL).map(Number);
    }
}

/**
 * Singleton instance of the naive decimal serializer.
 */
const simpleSerializer = new SimpleSerializer();

export default simpleSerializer;
