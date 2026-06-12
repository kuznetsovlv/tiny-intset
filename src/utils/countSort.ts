import {MIN_VALUE, VALUE_RANGE_SIZE} from '@/constants';

/**
 * Sorts a valid tiny-intset input using counting sort.
 *
 * The function assumes that the input has already been validated:
 * every value must be an integer in the inclusive range from
 * {@link MIN_VALUE} to {@link MAX_VALUE}.
 *
 * The input array is not modified. Duplicate values are preserved.
 *
 * Counting sort is used because tiny-intset works with a small fixed
 * integer range. This gives O(n + range) time complexity and avoids
 * comparison-based sorting.
 *
 * @param input - Valid tiny-intset input array.
 * @returns A new array containing the same values in ascending order.
 */
export default function countSort(input: readonly number[]): number[] {
    const result = new Array<number>(input.length);
    const counts = new Array<number>(VALUE_RANGE_SIZE).fill(0);

    for (const value of input) {
        ++counts[value - MIN_VALUE];
    }

    let resultIndex = 0;

    for (let offset = 0; offset < VALUE_RANGE_SIZE; ++offset) {
        const count = counts[offset];
        const value = offset + MIN_VALUE;

        for (let i = 0; i < count; ++i) {
            result[resultIndex] = value;
            ++resultIndex;
        }
    }

    return result;
}
