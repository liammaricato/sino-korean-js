const DIGITS = {
	0: '영',
	1: '일',
	2: '이',
	3: '삼',
	4: '사',
	5: '오',
	6: '육',
	7: '칠',
	8: '팔',
	9: '구'
};

const SMALL_UNITS = [
	{ char: '천', value: 1000n },
	{ char: '백', value: 100n },
	{ char: '십', value: 10n }
];

const LARGE_UNITS = [
	{ char: '경', value: 10000n ** 4n },
	{ char: '조', value: 10000n ** 3n },
	{ char: '억', value: 10000n ** 2n },
	{ char: '만', value: 10000n }
];

const HANGUL_TO_DIGIT = {
	'영': 0n,
	'공': 0n,
	'일': 1n,
	'이': 2n,
	'삼': 3n,
	'사': 4n,
	'오': 5n,
	'육': 6n,
	'륙': 6n,
	'칠': 7n,
	'팔': 8n,
	'구': 9n
};

const SMALL_UNIT_MAP = {
	'십': 10n,
	'백': 100n,
	'천': 1000n
};

const LARGE_UNIT_MAP = {
	'만': 10000n,
	'억': 10000n ** 2n,
	'조': 10000n ** 3n,
	'경': 10000n ** 4n
};

function normalizeInputToBigInt(input) {
	if (typeof input === 'bigint') return input;
	if (typeof input === 'number') {
		if (!Number.isFinite(input)) throw new RangeError('Input number must be finite');
		if (!Number.isInteger(input)) throw new RangeError('Input number must be an integer');
		return BigInt(input);
	}
	if (typeof input === 'string') {
		const s = input.trim();
		if (!/^[+-]?\d+$/.test(s)) throw new TypeError('Numeric string must contain only digits');
		return BigInt(s);
	}
	throw new TypeError('Input must be a number, bigint, or numeric string');
}

function chunkToHangul(chunk, options) {
	const omitOneForSmallUnits = options.omitOneForSmallUnits;
	let n = Number(chunk);
	if (n === 0) return '';
	const thousands = Math.floor(n / 1000);
	const hundreds = Math.floor((n % 1000) / 100);
	const tens = Math.floor((n % 100) / 10);
	const ones = n % 10;
	let out = '';
	if (thousands) {
		out += (thousands === 1 && omitOneForSmallUnits ? '' : DIGITS[thousands]) + '천';
	}
	if (hundreds) {
		out += (hundreds === 1 && omitOneForSmallUnits ? '' : DIGITS[hundreds]) + '백';
	}
	if (tens) {
		out += (tens === 1 && omitOneForSmallUnits ? '' : DIGITS[tens]) + '십';
	}
	if (ones) {
		out += DIGITS[ones];
	}
	return out;
}

function toSinoKorean(input, opts = {}) {
	const options = {
		zeroChar: opts.zeroChar ?? '영',
		omitOneForSmallUnits: opts.omitOneForSmallUnits ?? true,
		omitOneForLargeUnits: opts.omitOneForLargeUnits ?? true,
		useSpacingBetweenLargeUnits: opts.useSpacingBetweenLargeUnits ?? false,
		negativeWord: opts.negativeWord ?? '마이너스'
	};
	let n = normalizeInputToBigInt(input);
	let negative = false;
	if (n < 0) {
		negative = true;
		n = -n;
	}
	if (n === 0n) {
		return options.zeroChar;
	}
	const limit = 10000n ** 5n;
	if (n >= limit) {
		throw new RangeError('Numbers >= 10^20 are not supported');
	}
	let parts = [];
	let unitIndex = 0;
	while (n > 0n) {
		const chunk = n % 10000n;
		if (chunk > 0n) {
			const chunkStr = chunkToHangul(chunk, options);
			let unitStr = '';
			if (unitIndex > 0) {
				const unitChar = LARGE_UNITS[LARGE_UNITS.length - unitIndex].char;
				unitStr = chunk === 1n
					? (options.omitOneForLargeUnits ? unitChar : '일' + unitChar)
					: chunkStr + unitChar;
			} else {
				unitStr = chunkStr;
			}
			parts.unshift(unitStr);
		}
		n = n / 10000n;
		unitIndex += 1;
	}
	const sep = options.useSpacingBetweenLargeUnits ? ' ' : '';
	const joined = parts.join(sep);
	if (negative) {
		return options.negativeWord + (sep || ' ') + joined;
	}
	return joined;
}

function fromSinoKorean(input, opts = {}) {
	const options = {
		zeroChar: opts.zeroChar ?? '영',
		negativeWord: opts.negativeWord ?? '마이너스',
		output: opts.output ?? 'auto'
	};
	if (typeof input !== 'string') throw new TypeError('Input must be a string');
	let s = input.trim();
	if (s === '') throw new TypeError('Input must not be empty');
	let negative = false;
	if (s.startsWith(options.negativeWord)) {
		negative = true;
		s = s.slice(options.negativeWord.length).trim();
	}
	s = s.replace(/[\s,._-]+/g, '');
	if (s === '공' || s === '영') {
		return coerceOutput(negative ? -0n : 0n, options.output);
	}
	let total = 0n;
	let section = 0n;
	let current = 0n;
	for (const ch of s) {
		if (HANGUL_TO_DIGIT[ch] !== undefined) {
			current = HANGUL_TO_DIGIT[ch];
			continue;
		}
		if (SMALL_UNIT_MAP[ch] !== undefined) {
			const coeff = current === 0n ? 1n : current;
			section += coeff * SMALL_UNIT_MAP[ch];
			current = 0n;
			continue;
		}
		if (LARGE_UNIT_MAP[ch] !== undefined) {
			let sectionValue = section + current;
			if (sectionValue === 0n) sectionValue = 1n;
			total += sectionValue * LARGE_UNIT_MAP[ch];
			section = 0n;
			current = 0n;
			continue;
		}
		throw new Error('Unrecognized character: ' + ch);
	}
	let result = total + section + current;
	if (negative && result !== 0n) result = -result;
	return coerceOutput(result, options.output);
}

function coerceOutput(valueBigInt, output) {
	if (output === 'bigint') return valueBigInt;
	if (output === 'string') return valueBigInt.toString();
	if (output === 'number') return bigIntToSafeNumber(valueBigInt);
	if (output === 'auto') {
		const abs = valueBigInt < 0 ? -valueBigInt : valueBigInt;
		if (abs <= BigInt(Number.MAX_SAFE_INTEGER)) return Number(valueBigInt);
		return valueBigInt.toString();
	}
	throw new Error('Invalid output option');
}

function bigIntToSafeNumber(b) {
	const abs = b < 0n ? -b : b;
	if (abs > BigInt(Number.MAX_SAFE_INTEGER)) {
		throw new RangeError('Result exceeds Number.MAX_SAFE_INTEGER; choose output \"bigint\" or \"string\"');
	}
	return Number(b);
}

export { toSinoKorean, fromSinoKorean };

