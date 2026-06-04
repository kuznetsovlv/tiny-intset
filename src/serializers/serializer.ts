/**
 * Base class for tiny-intset serialization algorithms.
 *
 * Serializers are low-level codec implementations. They are expected to be
 * called only after input validation has already been performed by the public
 * API layer.
 *
 * Implementations may use different encoding strategies. Unless documented
 * otherwise, serializers should preserve duplicate values.
 */
export default abstract class Serializer {
    /**
     * Serializes a validated integer array.
     *
     * This method assumes that:
     * - the input is an array;
     * - every value is an integer;
     * - every value is within the supported tiny-intset range;
     * - the input length is within the supported tiny-intset limits.
     *
     * Implementations should not mutate the input array.
     *
     * @param input - Validated tiny-intset input.
     * @returns Serialized string representation.
     */
    public abstract serialize(input: readonly number[]): string;

    /**
     * Deserializes a string produced by the matching serializer.
     *
     * This method assumes that the input string belongs to this serializer's
     * format. Public API code is responsible for selecting the correct
     * serializer and validating the resulting data when needed.
     *
     * @param input - Serialized string representation.
     * @returns Deserialized integer array.
     */
    public abstract deserialize(input: string): number[];
}
