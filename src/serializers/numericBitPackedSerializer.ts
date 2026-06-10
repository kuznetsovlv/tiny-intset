import {MAX_LENGTH, MAX_VALUE, MIN_VALUE} from '@/constants';
import {getBitMask, isAlphabet} from '@/utils';

import Serializer from './serializer';

const BASE64URL_ALPHABET =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

const MAX_ENCODED_VALUE = MAX_VALUE - MIN_VALUE;

const MAX_AVAILABLE_ALPHABET_SIZE = 128;

class NumericBitPackedSerializer extends Serializer {
    readonly #alphabet: string;
    readonly #bitsPerValue: number;
    readonly #bitsPerChar: number;
    readonly #lengthChars: number;
    readonly #charBitMask: number;
    readonly #valueBitMask: number;

    constructor(alphabet: string = BASE64URL_ALPHABET) {
        super();

        if (!isAlphabet(alphabet)) {
            throw new Error(`Invalid alphabet: ${alphabet}`);
        }

        if (alphabet.length > MAX_AVAILABLE_ALPHABET_SIZE) {
            throw new Error(
                `Two large alphabet's size: ${alphabet.length}. It must be equal or less than ${MAX_AVAILABLE_ALPHABET_SIZE}.`
            );
        }

        if (!isLengthPowerOfTwo(alphabet)) {
            throw new Error(
                `Invalid alphabet's size: ${alphabet.length}. It must be a power of 2.`
            );
        }

        this.#alphabet = alphabet;
        this.#bitsPerValue = Math.ceil(Math.log2(MAX_VALUE - MIN_VALUE + 1));
        this.#bitsPerChar = Math.log2(alphabet.length);
        this.#lengthChars = Math.ceil(
            Math.log2(MAX_LENGTH + 1) / this.#bitsPerChar
        );
        this.#charBitMask = getBitMask(this.#bitsPerChar);
        this.#valueBitMask = getBitMask(this.#bitsPerValue);
    }

    #encodeFixedWidthNumber(value: number, chars: number): string {
        let result = '';

        for (
            let shift = (chars - 1) * this.#bitsPerChar;
            shift >= 0;
            shift -= this.#bitsPerChar
        ) {
            const chunk = (value >> shift) & this.#charBitMask;

            result += this.#encodeChar(chunk);
        }

        return result;
    }

    #decodeFixedWidthNumber(input: string): number {
        let result = 0;

        for (const char of input) {
            result = (result << this.#bitsPerChar) | this.#decodeChar(char);
        }

        return result;
    }

    #encodeLength(length: number): string {
        return this.#encodeFixedWidthNumber(length, this.#lengthChars);
    }

    #decodeLength(input: string): number {
        if (input.length < this.#lengthChars) {
            throw new Error(
                'Invalid numeric bit-packed payload: missing length header.'
            );
        }

        return this.#decodeFixedWidthNumber(input.slice(0, this.#lengthChars));
    }

    #encodeChar(code: number): string {
        const char = this.#alphabet[code];

        if (char === undefined) {
            throw new Error(
                `Invalid numeric bit-packed state: character code ${code} is out of alphabet range.`
            );
        }

        return char;
    }

    #decodeChar(char: string): number {
        const index = this.#alphabet.indexOf(char);

        if (index < 0) {
            throw new Error(
                `Invalid numeric bit-packed payload: unexpected character "${char}".`
            );
        }

        return index;
    }

    #encodeValue(value: number): number {
        return value - MIN_VALUE;
    }

    #decodeValue(value: number): number {
        if (value > MAX_ENCODED_VALUE) {
            throw new Error(
                'Invalid numeric bit-packed payload: encoded value is out of range.'
            );
        }

        return value + MIN_VALUE;
    }

    public serialize(input: readonly number[]): string {
        return '';
    }

    public deserialize(input: string): number[] {
        return [];
    }
}

const numericBitPackedSerializer = new NumericBitPackedSerializer(
    BASE64URL_ALPHABET
);

export default numericBitPackedSerializer;

function isLengthPowerOfTwo({length}: string): boolean {
    return !!length && !(length & (length - 1));
}
