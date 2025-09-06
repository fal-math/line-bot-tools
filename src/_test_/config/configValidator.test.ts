import { ConfigValidator } from "../../config/configValidator";

describe('ConfigValidator', () => {
  it('requireNonEmptyString: OK', () => {
    expect(ConfigValidator.requireNonEmptyString('abc', 'k')).toBe('abc');
  });
  it('requireNonEmptyString: 空文字で例外', () => {
    expect(() => ConfigValidator.requireNonEmptyString('', 'k')).toThrow();
  });
  it('validateLineGroupIds: 必須キー欠落で例外', () => {
    expect(() => ConfigValidator.validateLineGroupIds({ apply: 'x' })).toThrow();
  });
  // it('validateLineGroupIds: 任意キーは未設定でもOK', () => {
  //   expect(() => ConfigValidator.validateLineGroupIds({
  //     apply: 'a', operations: 'b', shift: 'c', all: 'd', test: 'e', reserve: 'f'
  //   })).not.toThrow();
  // });
});
