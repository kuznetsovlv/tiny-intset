import {DELIMITER_SYMBOL} from '@/constants';
import {isAlphabet, splitToChars} from '@/utils';

import Serializer from './serializer';
import simpleSerializer from './simpleSerializer';

/**
 * Offset between a pair index and the emitted ASCII character code.
 *
 * Pair indexes are in the `0..120` range. Adding `1` maps them to ASCII codes
 * `1..121`, intentionally avoiding code `0` / NUL.
 */
const PACKED_CODE_OFFSET = 1;

const ALPHABET = `0123456789${DELIMITER_SYMBOL}`;
const MAX_PAIRS_COUNT = 127;

/**
 * Raw ASCII serializer that packs pairs of decimal baseline characters.
 *
 * The serializer first converts the input to the same comma-separated decimal
 * representation as {@link simpleSerializer}. That representation uses only
 * eleven symbols: digits `0..9` and {@link DELIMITER_SYMBOL}.
 *
 * Each pair of those symbols has `11 * 11 = 121` possible combinations and is
 * encoded as one ASCII character with code `pairIndex + 1`.
 *
 * ASCII code `0` / NUL is intentionally avoided because it can be treated as a
 * string terminator by C/C++-style APIs and may be unsafe in text-processing
 * tools. ASCII code `127` / DEL is not used.
 *
 * The output may contain control characters such as TAB, LF, CR or ESC. This
 * serializer optimizes raw JavaScript string length, not readability,
 * JSON-escaped size, logs, terminal output or copy-paste safety.
 *
 * This is a low-level serializer. It assumes that input arrays are validated by
 * the public API layer.
 */
class PairPackedSerializer extends Serializer {
    readonly #alphabet: string;
    readonly #pairCount: number;

    constructor(alphabet: string = ALPHABET) {
        super();
        if (!isAlphabet(alphabet)) {
            throw new Error(`Invalid alphabet: ${alphabet}`);
        }

        const pairCount = alphabet.length * alphabet.length;

        if (pairCount > MAX_PAIRS_COUNT) {
            throw new Error(
                `Alphabet size is too large: ${alphabet.length} symbols. The possible pair's count ${MAX_PAIRS_COUNT} is exceeded.`
            );
        }

        this.#alphabet = alphabet;
        this.#pairCount = pairCount;
    }

    /**
     * Returns the index of a decimal-format symbol in the serializer alphabet.
     *
     * `serialize()` receives a validated number array, but this serializer also
     * depends on the canonical output format of SimpleSerializer. This check
     * protects the codec from future incompatible changes, such as adding spaces,
     * markers or a different decimal representation.
     *
     * @param char - Decimal-format character.
     * @returns Symbol index in the `0..10` range.
     * @throws Error when the character is not part of the decimal alphabet.
     */
    #getIndex(char: string): number {
        const index = this.#alphabet.indexOf(char);

        // serialize() receives a validated number array, but PairPackedSerializer
        // also depends on the canonical output format of SimpleSerializer.
        // This check protects the codec from future incompatible changes, such
        // as adding spaces, markers or a different decimal representation.
        if (index < 0) {
            throw new Error(`Unsupported char: ${char}.`);
        }

        return index;
    }

    /**
     * Returns a decimal-format symbol by its alphabet index.
     *
     * @param index - Symbol index in the `0..10` range.
     * @returns Decimal-format character.
     * @throws Error when the index is outside the serializer alphabet.
     */
    #getChar(index: number): string {
        if (index < 0 || index >= this.#alphabet.length) {
            throw new Error(
                `PairPackedSerializer symbol index is out of bounds: ${index}.`
            );
        }

        return this.#alphabet[index];
    }

    /**
     * Packs two decimal-format characters into one ASCII character code.
     *
     * The pair is interpreted as a base-11 number:
     * `firstIndex * 11 + secondIndex`. Then {@link PACKED_CODE_OFFSET} is added to
     * avoid emitting ASCII code `0` / NUL.
     *
     * If the second character is missing, {@link DELIMITER_SYMBOL} is used as
     * padding.
     *
     * @param first - First decimal-format character.
     * @param second - Second decimal-format character or delimiter padding.
     * @returns ASCII character code in the `1..121` range.
     */
    #getPairCode(first: string, second: string = DELIMITER_SYMBOL): number {
        return (
            this.#getIndex(first) * this.#alphabet.length +
            this.#getIndex(second) +
            PACKED_CODE_OFFSET
        );
    }

    /**
     * Restores two decimal-format characters from one packed ASCII character code.
     *
     * @param input - Packed ASCII character code.
     * @returns Two-character decimal-format string.
     * @throws Error when the code is outside the PairPackedSerializer range.
     */
    #deserializePair(input: number): string {
        const code = input - PACKED_CODE_OFFSET;

        if (code < 0 || code >= this.#pairCount) {
            throw new Error(
                `Invalid PairPackedSerializer character code: ${input}.`
            );
        }

        const first = Math.floor(code / this.#alphabet.length);
        const second = code % this.#alphabet.length;

        return `${this.#getChar(first)}${this.#getChar(second)}`;
    }

    /**
     * Removes delimiter padding added for odd-length decimal strings.
     *
     * A valid baseline decimal string produced from an array never ends with a
     * delimiter, because delimiters appear only between numbers. Therefore a final
     * delimiter after unpacking can only be padding for payloads produced by this
     * serializer.
     *
     * @param input - Restored decimal-format string.
     * @returns Decimal-format string without serializer padding.
     */
    #removeDelimiterPadding(input: string): string {
        return input.endsWith(DELIMITER_SYMBOL)
            ? input.substring(0, input.length - 1)
            : input;
    }

    /**
     * Serializes a validated integer array into a raw ASCII pair-packed payload.
     *
     * The input order is preserved. The input array is not mutated.
     *
     * If the intermediate decimal string has odd length, the final decimal
     * symbol is paired with {@link DELIMITER_SYMBOL} as padding. Valid baseline
     * decimal strings never end with a delimiter, so this padding is
     * unambiguous for payloads produced by this serializer.
     *
     * @param input - Validated tiny-intset input.
     * @returns Raw ASCII pair-packed payload.
     */
    public serialize(input: readonly number[]): string {
        const chars = splitToChars(simpleSerializer.serialize(input));
        const pairedChars: number[] = [];

        for (let index = 0; index < chars.length; index += 2) {
            pairedChars.push(this.#getPairCode(chars[index], chars[index + 1]));
        }

        return String.fromCharCode(...pairedChars);
    }

    /**
     * Deserializes a raw ASCII pair-packed payload back into numbers.
     *
     * The method expects input produced by {@link PairPackedSerializer.serialize}.
     * It performs only payload-level checks for impossible packed character
     * codes. Validation of the resulting number array belongs to the public API
     * layer.
     *
     * @param input - Raw ASCII pair-packed payload.
     * @returns Parsed array of numbers.
     * @throws Error when the payload contains a character code outside the
     * PairPackedSerializer range.
     */
    public deserialize(input: string): number[] {
        return simpleSerializer.deserialize(
            this.#removeDelimiterPadding(
                splitToChars(input)
                    .map((char) => this.#deserializePair(char.charCodeAt(0)))
                    .join('')
            )
        );
    }
}

/**
 * Singleton instance of the raw ASCII pair-packing serializer.
 */
const pairPackedSerializer = new PairPackedSerializer();

export default pairPackedSerializer;
