import { Message } from '../../messageTemplates/Message';
// import { buildLinkListMessage } from '../../../src/messageTemplates/LinkListBuilder';
import { InternalDeadlineEvent } from '../../types/type';
import { StringUtils } from '../../util/StringUtils';

function ev(
  y: number,
  m: number,
  d: number,
  title: string,
  targetClasses: string,
  isMatch: boolean,
  isExternalPractice: boolean
): InternalDeadlineEvent {
  return {
    date: new Date(y, m - 1, d, 0, 0, 0, 0),
    targetClasses: StringUtils.formatStrictKarutaClass(targetClasses),
    title,
    isMatch,
    isExternalPractice,
  } as InternalDeadlineEvent;
}

describe('buildDeadlineMessage (TS)', () => {
  test('本日／あとN日タグ表示', () => {
    const today = new Date(2025, 6, 7); // 2025-07-07 JST
    const text = Message.deadlineExPractice(
      [
        ev(2025,7,1,"札幌","ABC", true, false),
        ev(2025,7,2,"札幌","DE", true, false),
        ev(2025,7,15,"宮崎","AB", true, false),
        ev(2025,7,16,"宮崎","D", true, false),
        ev(2025,7,16,"合同練","G以上", false, true),
      ],
      { today, header: 'D' }
    );
    expect(text).toContain('本日〆切');
    expect(text).toContain('あと2日');
  });
});

// describe('buildLinkListMessage (TS)', () => {
//   test('セクションごとにリンク列挙', () => {
//     const text = buildLinkListMessage(
//       [{ title: 'A級', items: [{ label: '9/9', url: 'https://example.com' }] }],
//       'L'
//     );
//     expect(text.startsWith('L')).toBe(true);
//     expect(text).toContain('【A級】');
//     expect(text).toContain('https://example.com');
//     console.log(text);
//   });
// });
