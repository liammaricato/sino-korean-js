import assert from 'node:assert/strict';
import { toSinoKorean, fromSinoKorean } from '../src/index.js';

function t(desc, fn) {
	process.stdout.write('• ' + desc + ' ... ');
	fn();
	console.log('ok');
}

t('zero', () => {
	assert.equal(toSinoKorean(0), '영');
	assert.equal(fromSinoKorean('영'), 0);
	assert.equal(fromSinoKorean('공'), 0);
});

t('basic small numbers', () => {
	assert.equal(toSinoKorean(1), '일');
	assert.equal(toSinoKorean(5), '오');
	assert.equal(toSinoKorean(10), '십');
	assert.equal(toSinoKorean(11), '십일');
	assert.equal(toSinoKorean(20), '이십');
	assert.equal(toSinoKorean(101), '백일');
	assert.equal(toSinoKorean(110), '백십');
	assert.equal(toSinoKorean(115), '백십오');
	assert.equal(toSinoKorean(1234), '천이백삼십사');
});

t('large units', () => {
	assert.equal(toSinoKorean(10000), '만');
	assert.equal(toSinoKorean(100000000), '억');
	assert.equal(toSinoKorean(10000, { omitOneForLargeUnits: false }), '일만');
	assert.equal(toSinoKorean(100000000, { omitOneForLargeUnits: false }), '일억');
});

t('spacing option', () => {
	assert.equal(
		toSinoKorean(123456789, { useSpacingBetweenLargeUnits: true }),
		'억 이천삼백사십오만 육천칠백팔십구'
	);
	assert.equal(
		toSinoKorean(123456789, { useSpacingBetweenLargeUnits: false }),
		'억이천삼백사십오만육천칠백팔십구'
	);
});

t('roundtrip within safe integer range', () => {
	const samples = [
		1, 7, 10, 15, 20, 42, 99, 100, 105, 110, 111, 999,
		1000, 1010, 1100, 1111, 2005, 9999, 10000, 12345,
		99999999, 100000000, 987654321
	];
	for (const n of samples) {
		const s = toSinoKorean(n);
		const back = fromSinoKorean(s, { output: 'number' });
		assert.equal(back, n, `${n} -> ${s} -> ${back}`);
	}
});

t('negative numbers', () => {
	assert.equal(toSinoKorean(-12), '마이너스 십이');
	assert.equal(fromSinoKorean('마이너스 십이'), -12);
});

console.log('All tests passed'); 

