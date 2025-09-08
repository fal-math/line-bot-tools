// src/_test_/services/SpreadsheetConfigService.test.ts
import { SpreadsheetConfigService } from '../../services/SpreadsheetConfigService';
import type { PracticeConfigRow } from '../../types/type';

/**
 * --- 簡易 GAS モック ---
 * SpreadsheetApp.openById(id).getSheetByName(name)
 *   -> sheet?.getDataRange().getDisplayValues()
 */
type Values = string[][];
type Sheets = Record<string, Values>;

function installSpreadsheetMock(sheets: Sheets) {
  const makeSheet = (name: string) => {
    const values = sheets[name];
    if (!values) return null;
    return {
      getDataRange: () => ({
        getDisplayValues: () => values,
      }),
    };
  };

  (global as any).SpreadsheetApp = {
    openById: (_id: string) => ({
      getSheetByName: (name: string) => makeSheet(name),
    }),
  };
}

describe('SpreadsheetConfigService', () => {
  const SHEET_ID = 'dummy-id';
  const SHEET_NAME = '外部練設定';

  const row = (name: string, description = ''): string[] => [name, description];

  describe('getAll', () => {
    it('正常系: 行を読み取り、trim し、Map で返す（空行はスキップ）', () => {
      installSpreadsheetMock({
        [SHEET_NAME]: [
          [' name ', ' description '],          // header（大小文字は問わないがここはそのまま）
          row('  合同練  ', '  体験可  '),      // 前後空白は trim
          ['', ''],                              // 空行 → スキップ
          row('千葉練', ''),                     // description 空でもOK
        ],
      });

      const svc = new SpreadsheetConfigService(SHEET_ID, SHEET_NAME);
      const m = svc.getAll();

      expect(m.size).toBe(2);
      expect(m.get('合同練')).toEqual<PracticeConfigRow>({
        name: '合同練',
        description: '体験可',
      });
      expect(m.get('千葉練')).toEqual<PracticeConfigRow>({
        name: '千葉練',
        description: '',
      });
    });

    it('シートが存在しない場合は例外', () => {
      installSpreadsheetMock({ /* シートなし */ });

      const svc = new SpreadsheetConfigService(SHEET_ID, SHEET_NAME);
      expect(() => svc.getAll()).toThrowError(/Sheet not found/);
    });

    it('ヘッダのみ（データなし）は空の Map', () => {
      installSpreadsheetMock({
        [SHEET_NAME]: [['name', 'description']],
      });

      const svc = new SpreadsheetConfigService(SHEET_ID, SHEET_NAME);
      const m = svc.getAll();
      expect(m.size).toBe(0);
    });

    it('ヘッダの大小文字は無視される（case-insensitive）', () => {
      installSpreadsheetMock({
        [SHEET_NAME]: [
          ['Name', 'Description'], // 大小混在
          row('合同練', '注意事項'),
        ],
      });

      const svc = new SpreadsheetConfigService(SHEET_ID, SHEET_NAME);
      const m = svc.getAll();
      expect(m.size).toBe(1);
      expect(m.get('合同練')!.description).toBe('注意事項');
    });

    it('必要列が欠けていると例外（name / description のどれが欠けてもNG）', () => {
      // name だけ
      installSpreadsheetMock({
        [SHEET_NAME]: [['name'], row('合同練')],
      });

      const svc1 = new SpreadsheetConfigService(SHEET_ID, SHEET_NAME);
      expect(() => svc1.getAll()).toThrowError(/Missing required columns/i);

      // description だけ
      installSpreadsheetMock({
        [SHEET_NAME]: [['description'], ['メモ']],
      });

      const svc2 = new SpreadsheetConfigService(SHEET_ID, SHEET_NAME);
      expect(() => svc2.getAll()).toThrowError(/Missing required columns/i);
    });

    it('name が空の行が存在する場合は例外（isValid による検証）', () => {
      installSpreadsheetMock({
        [SHEET_NAME]: [
          ['name', 'description'],
          row('', '説明あり'), // name 空 → 例外
        ],
      });

      const svc = new SpreadsheetConfigService(SHEET_ID, SHEET_NAME);
      expect(() => svc.getAll()).toThrowError(/Invalid row at R2/);
    });

    it('name 重複がある場合は例外', () => {
      installSpreadsheetMock({
        [SHEET_NAME]: [
          ['name', 'description'],
          row('合同練', 'A'),
          row('合同練', 'B'), // 重複
        ],
      });

      const svc = new SpreadsheetConfigService(SHEET_ID, SHEET_NAME);
      expect(() => svc.getAll()).toThrowError(/Duplicate name "合同練" at R3/);
    });
  });

  describe('getDescription', () => {
    it('名称に一致する description を返す。なければ空文字', () => {
      installSpreadsheetMock({
        [SHEET_NAME]: [
          ['name', 'description'],
          row('合同練', '体験可'),
          row('千葉練', ''),
        ],
      });

      const svc = new SpreadsheetConfigService(SHEET_ID, SHEET_NAME);
      expect(svc.getDescription('合同練')).toBe('体験可');
      expect(svc.getDescription('千葉練')).toBe('');        // 空でもOK
      expect(svc.getDescription('存在しない')).toBe('');    // 見つからない → ''
    });
  });

  describe('list / names / getByName', () => {
    it('list は全行の PracticeConfigRow を配列で返す', () => {
      installSpreadsheetMock({
        [SHEET_NAME]: [
          ['name', 'description'],
          row('合同練', '体験可'),
          row('千葉練', ''),
          ['', ''], // 空行はスキップ
        ],
      });

      const svc = new SpreadsheetConfigService(SHEET_ID, SHEET_NAME);
      const items = svc.list();

      expect(items).toEqual<PracticeConfigRow[]>([
        { name: '合同練', description: '体験可' },
        { name: '千葉練', description: '' },
      ]);
    });

    it('names は name だけの配列を返す', () => {
      installSpreadsheetMock({
        [SHEET_NAME]: [
          ['name', 'description'],
          row('合同練', '体験可'),
          row('千葉練', ''),
        ],
      });

      const svc = new SpreadsheetConfigService(SHEET_ID, SHEET_NAME);
      expect(svc.names()).toEqual(['合同練', '千葉練']);
    });

    it('getByName は一致行を返し、なければ null', () => {
      installSpreadsheetMock({
        [SHEET_NAME]: [
          ['name', 'description'],
          row('合同練', '体験可'),
        ],
      });

      const svc = new SpreadsheetConfigService(SHEET_ID, SHEET_NAME);
      expect(svc.getByName('合同練')).toEqual<PracticeConfigRow>({
        name: '合同練',
        description: '体験可',
      });
      expect(svc.getByName('存在しない')).toBeNull();
    });
  });
});
