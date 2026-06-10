import {simpleSerializer} from '@/serializers';
import {countSort, validate} from '@/utils';

export function serialize(input: unknown): string {
    if (!validate(input)) {
        throw new Error('Invalid input value');
    }

    const sortedInput = countSort(input);

    return simpleSerializer.serialize(sortedInput);
}

export function deserialize(input: string): number[] {
    const output = simpleSerializer.deserialize(input);

    if (validate(output)) {
        return output;
    }

    throw new Error('Deserialization error: result is invalid.');
}
