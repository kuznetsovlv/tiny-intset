import {MAX_LENGTH, MIN_LENGTH, MIN_VALUE, VALUE_RANGE_SIZE} from '@/constants';
import {getBitMask, isAlphabet, isPowerOfTwo} from '@/utils';

import Serializer from './serializer';

/**
 * URL-safe Base64 alphabet used by the default serializer instance.
 *
 * Each character represents exactly 6 bits. The alphabet contains only
 * printable ASCII characters and avoids `+`, `/`, and padding characters.
 */
const BASE64URL_ALPHABET =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

/**
 * Maximum number of distinct ASCII characters available to a custom alphabet.
 *
 * The explicit limit is kept even if `isAlphabet` currently accepts only a
 * smaller safe subset of ASCII, so the codec constraint remains valid if
 * additional ASCII characters, including currently excluded ones, are allowed
 * in the future.
 */
const MAX_ASCII_ALPHABET_SIZE = 128;

/**
 * Serializes integer arrays by packing every value into a fixed-width bit
 * sequence and mapping the resulting bit stream to characters from a
 * power-of-two alphabet.
 *
 * The payload has the following structure:
 *
 * ```
 * length + packedValues
 * ```
 *
 * The length is stored as a fixed-width big-endian sequence of alphabet
 * characters. Every input value is converted to a zero-based offset using
 * `value - MIN_VALUE` and encoded using the minimum number of bits required
 * for the supported value range.
 *
 * Values and character chunks are written MSB-first. If the final character
 * is only partially filled, its unused least-significant bits are padded
 * with zeros.
 *
 * This low-level serializer:
 * - assumes that input arrays were already validated;
 * - preserves the order in which values are received;
 * - does not sort or mutate the input;
 * - does not add or expect a serializer marker.
 *
 * Marker handling, validation, sorting, and serializer selection belong to
 * the future public API layer.
 */
class NumericBitPackedSerializer extends Serializer {
    /**
     * Ordered set of characters used to represent fixed-width bit chunks.
     */
    readonly #alphabet: string;

    /**
     * Number of bits used to encode one input value.
     */
    readonly #bitsPerValue: number;

    /**
     * Number of bits represented by one alphabet character.
     */
    readonly #bitsPerChar: number;

    /**
     * Number of alphabet characters reserved for the input length header.
     */
    readonly #lengthChars: number;

    /**
     * Mask containing `bitsPerChar` least-significant set bits.
     */
    readonly #charBitMask: number;

    /**
     * Mask containing `bitsPerValue` least-significant set bits.
     */
    readonly #valueBitMask: number;

    /**
     * Creates a numeric bit-packed serializer.
     *
     * The alphabet must contain unique supported ASCII characters and its
     * length must be a power of two. This allows every output character to
     * represent an integer number of bits without unused character codes.
     *
     * @param alphabet - Ordered character alphabet used for encoded output.
     * Defaults to the URL-safe Base64 alphabet.
     * @throws {Error} If the alphabet is invalid, too large, or does not have
     * a power-of-two length.
     */
    constructor(alphabet: string = BASE64URL_ALPHABET) {
        super();

        if (!isAlphabet(alphabet)) {
            throw new Error(`Invalid alphabet: ${alphabet}`);
        }

        if (alphabet.length > MAX_ASCII_ALPHABET_SIZE) {
            throw new Error(
                `Alphabet size is too large: ${alphabet.length}. Maximum supported size is ${MAX_ASCII_ALPHABET_SIZE}.`
            );
        }

        if (!isPowerOfTwo(alphabet.length)) {
            throw new Error(
                `Invalid alphabet size: ${alphabet.length}. It must be a power of 2.`
            );
        }

        this.#alphabet = alphabet;
        this.#bitsPerValue = Math.ceil(Math.log2(VALUE_RANGE_SIZE));
        this.#bitsPerChar = Math.log2(alphabet.length);
        this.#lengthChars = Math.ceil(
            Math.log2(MAX_LENGTH + 1) / this.#bitsPerChar
        );
        this.#charBitMask = getBitMask(this.#bitsPerChar);
        this.#valueBitMask = getBitMask(this.#bitsPerValue);
    }

    /**
     * Encodes a non-negative integer as a fixed-width, big-endian sequence
     * of alphabet characters.
     *
     * Each character stores `bitsPerChar` bits. Leading zero chunks are
     * preserved so that the returned string always contains `chars`
     * characters.
     *
     * @param value - Integer to encode.
     * @param chars - Exact number of output characters.
     * @returns Fixed-width encoded representation.
     */
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

    /**
     * Decodes a big-endian sequence of alphabet characters into an integer.
     *
     * @param input - Fixed-width encoded number.
     * @returns Decoded non-negative integer.
     * @throws {Error} If the input contains a character outside the alphabet.
     */
    #decodeFixedWidthNumber(input: string): number {
        let result = 0;

        for (const char of input) {
            result = (result << this.#bitsPerChar) | this.#decodeChar(char);
        }

        return result;
    }

    /**
     * Encodes an input length using the fixed-width payload header.
     *
     * The length is stored directly without subtracting `MIN_LENGTH`, because
     * applying such an offset would not reduce the number of header
     * characters.
     *
     * @param length - Valid input array length.
     * @returns Encoded length header.
     */
    #encodeLength(length: number): string {
        return this.#encodeFixedWidthNumber(length, this.#lengthChars);
    }

    /**
     * Reads and validates the fixed-width length header.
     *
     * @param input - Complete numeric bit-packed payload.
     * @returns Decoded input array length.
     * @throws {Error} If the header is missing, contains invalid characters,
     * or declares a length outside the supported range.
     */
    #decodeLength(input: string): number {
        if (input.length < this.#lengthChars) {
            throw new Error(
                'Invalid numeric bit-packed payload: missing length header.'
            );
        }

        const length = this.#decodeFixedWidthNumber(
            input.slice(0, this.#lengthChars)
        );

        if (length < MIN_LENGTH || length > MAX_LENGTH) {
            throw new Error(
                `Invalid numeric bit-packed payload: decoded length ${length} ` +
                    `must be between ${MIN_LENGTH} and ${MAX_LENGTH}.`
            );
        }

        return length;
    }

    /**
     * Maps a numeric alphabet index to its corresponding character.
     *
     * @param code - Zero-based character code.
     * @returns Character at the requested alphabet position.
     * @throws {Error} If the code is outside the alphabet range.
     */
    #encodeChar(code: number): string {
        const char = this.#alphabet[code];

        if (char === undefined) {
            throw new Error(
                `Invalid numeric bit-packed state: character code ${code} is out of alphabet range.`
            );
        }

        return char;
    }

    /**
     * Maps an encoded character to its zero-based alphabet index.
     *
     * @param char - Character to decode.
     * @returns Character index in the configured alphabet.
     * @throws {Error} If the character does not belong to the alphabet.
     */
    #decodeChar(char: string): number {
        const index = this.#alphabet.indexOf(char);

        if (index < 0) {
            throw new Error(
                `Invalid numeric bit-packed payload: unexpected character "${char}".`
            );
        }

        return index;
    }

    /**
     * Converts a supported input value to its zero-based encoded form.
     *
     * The method assumes that the value was already validated.
     *
     * @param value - Supported tiny-intset value.
     * @returns Zero-based encoded value.
     */
    #encodeValue(value: number): number {
        return value - MIN_VALUE;
    }

    /**
     * Restores an original value from its zero-based encoded form.
     *
     * @param value - Encoded value in the range `0..VALUE_RANGE_SIZE - 1`.
     * @returns Original tiny-intset value.
     * @throws {Error} If the encoded value is outside the supported range.
     */
    #decodeValue(value: number): number {
        if (value >= VALUE_RANGE_SIZE) {
            throw new Error(
                'Invalid numeric bit-packed payload: encoded value is out of range.'
            );
        }

        return value + MIN_VALUE;
    }

    /**
     * Packs values into an MSB-first stream of alphabet characters.
     *
     * Every value contributes `bitsPerValue` bits to the stream. Complete
     * `bitsPerChar` chunks are emitted immediately. Remaining bits in the
     * final chunk are shifted to the most-significant side and padded with
     * zeros on the right.
     *
     * @param values - Valid values in the order in which they should be stored.
     * @returns Packed values without the length header or serializer marker.
     */
    #packValues(values: readonly number[]): string {
        let result = '';
        let buffer = 0;
        let bitsInBuffer = 0;

        for (const value of values) {
            const encoded = this.#encodeValue(value);

            buffer = (buffer << this.#bitsPerValue) | encoded;
            bitsInBuffer += this.#bitsPerValue;

            while (bitsInBuffer >= this.#bitsPerChar) {
                const shift = bitsInBuffer - this.#bitsPerChar;
                const charCode = (buffer >> shift) & this.#charBitMask;

                result += this.#encodeChar(charCode);

                bitsInBuffer -= this.#bitsPerChar;
                buffer &= getBitMask(bitsInBuffer);
            }
        }

        if (bitsInBuffer > 0) {
            const charCode =
                (buffer << (this.#bitsPerChar - bitsInBuffer)) &
                this.#charBitMask;

            result += this.#encodeChar(charCode);
        }

        return result;
    }

    /**
     * Unpacks exactly the declared number of values from an encoded payload.
     *
     * Character chunks and values are read MSB-first. The payload must have
     * the exact canonical length and any unused bits in its final character
     * must be zero.
     *
     * @param payload - Packed value stream without the length header.
     * @param length - Number of values declared by the payload header.
     * @returns Decoded values in their serialized order.
     * @throws {Error} If the payload has an unexpected length, contains an
     * invalid character or encoded value, lacks enough data, or has non-zero
     * padding bits.
     */
    #unpackValues(payload: string, length: number): number[] {
        const expectedPayloadLength = Math.ceil(
            (length * this.#bitsPerValue) / this.#bitsPerChar
        );

        if (payload.length !== expectedPayloadLength) {
            throw new Error(
                `Invalid numeric bit-packed payload length: expected ${expectedPayloadLength} characters, got ${payload.length}.`
            );
        }

        const result: number[] = [];
        let buffer = 0;
        let bitsInBuffer = 0;

        for (const char of payload) {
            buffer = (buffer << this.#bitsPerChar) | this.#decodeChar(char);
            bitsInBuffer += this.#bitsPerChar;

            while (
                bitsInBuffer >= this.#bitsPerValue &&
                result.length < length
            ) {
                const shift = bitsInBuffer - this.#bitsPerValue;
                const encoded = (buffer >> shift) & this.#valueBitMask;

                result.push(this.#decodeValue(encoded));

                bitsInBuffer -= this.#bitsPerValue;
                buffer &= getBitMask(bitsInBuffer);
            }

            if (result.length === length) {
                break;
            }
        }

        if (result.length !== length) {
            throw new Error(
                'Invalid numeric bit-packed payload: not enough data for declared length.'
            );
        }

        if (bitsInBuffer > 0 && buffer !== 0) {
            throw new Error(
                'Invalid numeric bit-packed payload: padding bits must be zero.'
            );
        }

        return result;
    }

    /**
     * Serializes an already validated integer array.
     *
     * The returned payload contains only the encoded length and packed values.
     * It does not include a serializer marker.
     *
     * The method preserves input order and does not mutate the input array.
     *
     * @param input - Already validated integer array.
     * @returns Numeric bit-packed payload.
     */
    public serialize(input: readonly number[]): string {
        const length = this.#encodeLength(input.length);
        const values = this.#packValues(input);

        return `${length}${values}`;
    }

    /**
     * Deserializes a numeric bit-packed payload.
     *
     * The method expects a serializer-specific payload without a leading mode
     * marker.
     *
     * @param input - Payload containing the length header and packed values.
     * @returns Decoded integer array.
     * @throws {Error} If the payload is malformed or non-canonical.
     */
    public deserialize(input: string): number[] {
        const length = this.#decodeLength(input);
        const payload = input.slice(this.#lengthChars);

        return this.#unpackValues(payload, length);
    }
}

const numericBitPackedSerializer = new NumericBitPackedSerializer();

export default numericBitPackedSerializer;
