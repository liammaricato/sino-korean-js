# sino-korean-js

Convert numbers to Sino‑Korean numerals and back.

## Install

```bash
yarn add sino-korean-js
# or
npm i sino-korean-js
```

## Usage

```js
import { toSinoKorean, fromSinoKorean } from 'sino-korean-js';

toSinoKorean(0);            // '영'
toSinoKorean(11);           // '십일'
toSinoKorean(1234);         // '천이백삼십사'
toSinoKorean(10000);        // '만'
toSinoKorean(100000000);    // '억'

fromSinoKorean('십일');                       // 11
fromSinoKorean('일억이천삼백사십오만육천칠백팔십구'); // 123456789
```

## Options

```js
toSinoKorean(10000, { omitOneForLargeUnits: false }); // '일만'
toSinoKorean(123456789, { useSpacingBetweenLargeUnits: true });
// '일억 이천삼백사십오만 육천칠백팔십구'

fromSinoKorean('마이너스 십이'); // -12
fromSinoKorean('억');           // 100000000
fromSinoKorean('억', { output: 'bigint' }); // 100000000n
```

### toSinoKorean(input, options?)
- `input`: number | bigint | numeric string
- `options.zeroChar` default `'영'`
- `options.omitOneForSmallUnits` default `true` (e.g. `십`, `백`, `천`)
- `options.omitOneForLargeUnits` default `true` (e.g. `만`, `억`, `조`, `경`)
- `options.useSpacingBetweenLargeUnits` default `false`
- `options.negativeWord` default `'마이너스'`

Throws for integers ≥ 10^20.

### fromSinoKorean(input, options?)
- Accepts continuous Hangul or spaced: `'일억이천...'` or `'일억 이천...'`
- Recognizes zero as `'영'` or `'공'`, and also `'륙'` for `'육'`
- `options.output`: `'auto' | 'number' | 'bigint' | 'string'` (default `'auto'`)
- `options.negativeWord` default `'마이너스'`

`'auto'` returns a JS `number` when safe, otherwise a decimal `string`.

## Test

```bash
yarn test
# or
npm test
```


