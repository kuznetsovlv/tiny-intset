import type {Serializer} from '@/serializers';
import {
    numericBitPackedSerializer,
    pairPackedSerializer,
    simpleSerializer,
} from '@/serializers';
import {countSort, validate} from '@/utils';

/**
 * One-character markers identifying serializer-specific payload formats.
 *
 * Markers belong to the public serialization layer. Low-level serializers
 * produce and consume payloads without these markers.
 */
enum SerializerMarker {
    SIMPLE = 'S',
    PAIR_PACKED = 'P',
    NUMERIC_BIT_PACKED = 'N',
}

/**
 * Minimum compression ratio accepted by {@link serializeEnough}.
 *
 * A value of `2` means that the function may stop evaluating serializers once
 * the complete marked result is no longer than half of the unmarked simple
 * serialization used as the task baseline.
 */
const MINIMAL_OPTIMISATION_COEFFICIENT = 2;

/**
 * Serializes an integer array using a sufficiently compact available format.
 *
 * The input is validated and sorted once before serialization. Serializer
 * candidates are then evaluated in their configured order. Evaluation may
 * stop early once a complete marked result is at least
 * {@link MINIMAL_OPTIMISATION_COEFFICIENT} times shorter than the unmarked
 * simple serialization required as the comparison baseline by the task.
 *
 * Unlike {@link serializeBest}, this function does not guarantee that every
 * available serializer is evaluated or that the absolute shortest result is
 * returned.
 *
 * The returned string always contains a one-character serializer marker,
 * including when simple serialization is selected.
 *
 * @param input - Value expected to be an integer array satisfying tiny-intset
 * constraints.
 * @returns Marked serialized representation.
 * @throws {Error} If the input does not satisfy tiny-intset constraints.
 */
export function serializeEnough(input: unknown): string {
    return serialize(input, false);
}

/**
 * Serializes an integer array using the shortest available format.
 *
 * The input is validated and sorted once, after which every configured
 * serializer is evaluated. The function returns the shortest complete result,
 * including its one-character serializer marker.
 *
 * If several candidates have the same length, the serializer evaluated first
 * remains selected. Simple serialization is the initial candidate.
 *
 * @param input - Value expected to be an integer array satisfying tiny-intset
 * constraints.
 * @returns The shortest marked serialized representation.
 * @throws {Error} If the input does not satisfy tiny-intset constraints.
 */
export function serializeBest(input: unknown): string {
    return serialize(input, true);
}

/**
 * Deserializes a tiny-intset string.
 *
 * Marked strings use their first character to identify the low-level
 * serializer. The remaining payload is passed to that serializer without the
 * marker.
 *
 * For interoperability, the function also accepts an unmarked simple
 * serialization consisting only of comma-separated decimal integers, such as
 * `"1,42,300"`.
 *
 * The decoded array is validated before it is returned.
 *
 * @param input - Marked tiny-intset serialization or an unmarked simple
 * serialization.
 * @returns Valid deserialized integer array.
 * @throws {Error} If the marker is unsupported, the input format is invalid,
 * the serializer-specific payload cannot be decoded, or the decoded result
 * violates tiny-intset constraints.
 */
export function deserialize(input: string): number[] {
    const marker = input.substring(0, 1);
    const payload = input.substring(1);

    let result: number[];

    switch (marker) {
        case SerializerMarker.SIMPLE:
            result = simpleSerializer.deserialize(payload);
            break;
        case SerializerMarker.PAIR_PACKED:
            result = pairPackedSerializer.deserialize(payload);
            break;
        case SerializerMarker.NUMERIC_BIT_PACKED:
            result = numericBitPackedSerializer.deserialize(payload);
            break;
        default:
            if (/^\d+(?:,\d+)*$/.test(input)) {
                result = simpleSerializer.deserialize(input);
            } else {
                throw new Error('Invalid string or unsupported serialisation');
            }
    }

    if (validate(result)) {
        return result;
    }

    throw new Error('Deserialization error: result is invalid.');
}

/**
 * Associates a low-level serializer with its public format marker.
 */
interface SerializeConfig {
    /**
     * Serializer producing a marker-free payload.
     */
    serializer: Serializer;

    /**
     * Marker prepended by the public serialization layer.
     */
    marker: SerializerMarker;
}

/**
 * Lazily serializes an input with the available compact serializers.
 *
 * Simple serialization is not included because it is created separately as
 * both the initial candidate and the unmarked comparison baseline.
 *
 * Each yielded candidate already contains its public one-character marker.
 * Laziness allows {@link serializeEnough} to stop before evaluating every
 * serializer once a sufficiently compact result has been found.
 *
 * @param input - Valid, sorted integer array.
 * @yields Complete marked serialization candidates in evaluation order.
 */
function* serializationGenerator(
    input: readonly number[]
): Generator<string, void, void> {
    const pairs: SerializeConfig[] = [
        {
            serializer: pairPackedSerializer,
            marker: SerializerMarker.PAIR_PACKED,
        },
        {
            serializer: numericBitPackedSerializer,
            marker: SerializerMarker.NUMERIC_BIT_PACKED,
        },
    ];

    for (const {serializer, marker} of pairs) {
        yield `${marker}${serializer.serialize(input)}`;
    }
}

/**
 * Validates, prepares, and serializes an input array.
 *
 * Validation is performed once at the public API boundary. The valid input is
 * then sorted once so every serializer receives the same deterministic
 * representation without repeating preparation work.
 *
 * The unmarked simple serialization serves as the task comparison baseline.
 * A separately marked simple serialization is used as the initial public
 * result candidate.
 *
 * @param input - Value expected to satisfy tiny-intset constraints.
 * @param best - When `true`, evaluates every serializer and returns the
 * shortest candidate. When `false`, allows early termination after finding a
 * sufficiently compact result.
 * @returns Selected complete serialization including its marker.
 * @throws {Error} If the input does not satisfy tiny-intset constraints.
 */
function serialize(input: unknown, best: boolean = false): string {
    if (!validate(input)) {
        throw new Error('Invalid input value');
    }

    const sortedInput = countSort(input);

    const simpleSerialized = simpleSerializer.serialize(sortedInput);
    let bestResult = `${SerializerMarker.SIMPLE}${simpleSerialized}`;

    for (const candidate of serializationGenerator(sortedInput)) {
        if (candidate.length < bestResult.length) {
            bestResult = candidate;
        }

        if (
            !best &&
            bestResult.length <=
                simpleSerialized.length / MINIMAL_OPTIMISATION_COEFFICIENT
        ) {
            break;
        }
    }

    return bestResult;
}
