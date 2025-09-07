import { Message } from '../../messageTemplates/Message';
import { ClubPracticeEvent } from '../../types/type';

function ev(
  y: number,
  m: number,
  d: number,
  timeRange: string,
  targetClasses: string,
  type: string,
  pic?: string
): ClubPracticeEvent {
  return {
    date: new Date(y, m - 1, d, 0, 0, 0, 0),
    timeRange,
    targetClasses,
    location: {
      shortenBuildingName: '常盤',
      clubName: 'test_club',
      mapUrl: 'https://example.com',
      buildingName: 'aaaa',
    },
    practiceType: type,
    personInCharge: pic,
  } as ClubPracticeEvent;
}

test('ヘッダ差し替え＆時刻昇順整列', () => {
  const text = Message.clubPractice(
    [
      ev(2025, 9, 9, '13:00-17:00', '常盤', '会練', 'A'),
      ev(2025, 9, 9, '9:00-12:00', '常盤', '会練', 'B'),
    ],
    { header: 'H' }
  );
  expect(text.startsWith('H')).toBe(true);
  expect(text.indexOf('・9:00-12:00')).toBeLessThan(text.indexOf('・13:00-17:00'));
});

describe('buildWeeklyPracticeMessage', () => {
  it('日付ごとグループ化 + 開始時刻ソート + 担当者表示', () => {
    const events = [
      ev(2025, 9, 8, '1300-1700', '全級', '会練', 'Aさん'),
      ev(2025, 9, 8, '0900-1200', '全級', '会練', 'Bさん'),
      ev(2025, 9, 12, '1830-2100', 'F以上', '対戦練', 'Cさん'),
    ];
    const text = Message.clubPractice(events, { header: '🟦今週の練習🟦' });
    expect(text).toContain('🟦今週の練習🟦');
    const idxDate = text.indexOf('【9/8(月)】');
    const idx900 = text.indexOf('・0900-1200 常盤会練', idxDate);
    const idx1300 = text.indexOf('・1300-1700 常盤会練', idxDate);
    expect(idx900).toBeGreaterThan(-1);
    expect(idx1300).toBeGreaterThan(-1);
    expect(idx900).toBeLessThan(idx1300);
    expect(text).toContain('  Bさん');
    expect(text).toContain('  Aさん');
    expect(text).toContain('【9/12(金)】');
    expect(text).toContain('常盤');
  });

  it('イベントなしなら空文字', () => {
    expect(Message.clubPractice([])).toBe('');
  });
});
