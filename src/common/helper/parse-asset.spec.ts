import parseAsset from './parse-asset';

describe('Parse token', () => {
    it('(1) should parse', () => {
        const input = '18.494 SBD';
        expect(parseAsset(input)).toMatchSnapshot();
    });

    it('(2) should parse', () => {
        const input = '0.012 STEEM';
        expect(parseAsset(input)).toMatchSnapshot();
    });
});
