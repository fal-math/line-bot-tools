import { CsvProcessor } from "../../util/CsvProcessor";

describe("CsvProcessor", () => {
  // ============================================================
  // parse()
  // ============================================================
  describe("parse: RFC4180 minimal parser", () => {
    test("カンマ区切り・単純CSV", () => {
      const csv = "a,b,c\n1,2,3";
      const proc = new CsvProcessor(csv);
      expect(proc["rows"]).toEqual([
        ["a", "b", "c"],
        ["1", "2", "3"],
      ]);
    });

    test("クォート付きセルの処理", () => {
      const csv = `"a","b","c"\n"1","2","3"`;
      const proc = new CsvProcessor(csv);
      expect(proc["rows"]).toEqual([
        ["a", "b", "c"],
        ["1", "2", "3"],
      ]);
    });

    test("クォート内部のカンマ", () => {
      const csv = `"a,1",b,c\n1,2,3`;
      const proc = new CsvProcessor(csv);
      expect(proc["rows"][0]).toEqual(["a,1", "b", "c"]);
    });

    test("エスケープされた二重引用符 \"\" の処理", () => {
      const csv = `"a""x",b\n1,2`;
      const proc = new CsvProcessor(csv);
      expect(proc["rows"][0][0]).toBe(`a"x`);
    });

    test("改行（LF と CRLF）混在", () => {
      const csv = "a,b,c\r\n1,2,3\n4,5,6";
      const proc = new CsvProcessor(csv);
      expect(proc["rows"]).toEqual([
        ["a", "b", "c"],
        ["1", "2", "3"],
        ["4", "5", "6"],
      ]);
    });

    test("最終行に改行がないケース", () => {
      const csv = "a,b,c\n1,2,3";
      const proc = new CsvProcessor(csv);
      expect(proc["rows"][1]).toEqual(["1", "2", "3"]);
    });

    test("空セル・空行を正しく保持", () => {
      const csv = "a,b,c\n,,\nx,,y";
      const proc = new CsvProcessor(csv);
      expect(proc["rows"]).toEqual([
        ["a", "b", "c"],
        ["", "", ""],
        ["x", "", "y"],
      ]);
    });
  });

  // ============================================================
  // stringify()
  // ============================================================
  describe("stringify", () => {
    test("カンマ含むセルはクォートされる", () => {
      const s = (CsvProcessor as any).stringify([
        ["a,1", "b"],
      ]);
      expect(s).toBe(`"a,1",b`);
    });

    test("引用符含むセルはエスケープされる", () => {
      const s = (CsvProcessor as any).stringify([
        [`a"x`, "b"],
      ]);
      expect(s).toBe(`"a""x",b`);
    });

    test("改行含むセルはクォートされる", () => {
      const s = (CsvProcessor as any).stringify([
        ["a\nb", "c"],
      ]);
      expect(s).toBe(`"a\nb",c`);
    });
  });

  // ============================================================
  // toString(headerOrder)
  // ============================================================
  describe("toString with headerOrder", () => {
    const csv = "A,B,C\n1,2,3\n4,5,6";

    test("headerOrder なし → 元の並びで出力", () => {
      const p = new CsvProcessor(csv);
      expect(p.toString()).toBe(csv);
    });

    test("部分列のみ出力", () => {
      const p = new CsvProcessor(csv);
      expect(p.toString(["B", "A"])).toBe("B,A\n2,1\n5,4");
    });

    test("存在しない列は自動で無視される", () => {
      const p = new CsvProcessor(csv);
      expect(p.toString(["B", "X", "A"])).toBe("B,A\n2,1\n5,4");
    });
  });

  // ============================================================
  // removeColumns()
  // ============================================================
  describe("removeColumns", () => {
    const csv = "A,B,C,D\n1,2,3,4\n5,6,7,8";

    test("複数列を削除", () => {
      const p = new CsvProcessor(csv);
      p.removeColumns(["B", "D"]);
      expect(p.toString()).toBe("A,C\n1,3\n5,7");
    });

    test("存在しない列名は無視される", () => {
      const p = new CsvProcessor(csv);
      p.removeColumns(["X", "A"]);
      expect(p.toString()).toBe("B,C,D\n2,3,4\n6,7,8");
    });

    test("indexOf が -1 を返すケースでも壊れない", () => {
      const p = new CsvProcessor(csv);
      // removeColumns(["X"]) が removeIdx = { -1 } を作るが問題ないことを確認
      p.removeColumns(["X"]);
      expect(p.toString()).toBe(csv);
    });
  });

  // ============================================================
  // filterRows()
  // ============================================================
  describe("filterRows", () => {
    const csv = "A,B,C\n1,2,3\n4,5,6\n7,8,9";

    test("条件を満たす行のみ残す", () => {
      const p = new CsvProcessor(csv);
      p.filterRows((row) => Number(row.A) >= 4);
      expect(p.toString()).toBe("A,B,C\n4,5,6\n7,8,9");
    });

    test("すべて false → ヘッダーのみ残る", () => {
      const p = new CsvProcessor(csv);
      p.filterRows(() => false);
      expect(p.toString()).toBe("A,B,C");
    });

    test("複数条件を評価", () => {
      const p = new CsvProcessor(csv);
      p.filterRows((row) => Number(row.B) % 2 === 0 && Number(row.C) > 5);
      expect(p.toString()).toBe("A,B,C\n7,8,9"); 
    });
  });

  // ============================================================
  // transformColumn()
  // ============================================================
  describe("transformColumn", () => {
    const csv = "A,B\n1,xxx\n2,yyy";

    test("指定列に変換を適用する", () => {
      const p = new CsvProcessor(csv);
      p.transformColumn("B", (v) => v.toUpperCase());
      expect(p.toString()).toBe("A,B\n1,XXX\n2,YYY");
    });

    test("存在しない列を指定しても無視される", () => {
      const p = new CsvProcessor(csv);
      p.transformColumn("X", () => "zzz");
      expect(p.toString()).toBe(csv);
    });

    test("空セルでも convert が呼ばれる", () => {
      const p = new CsvProcessor("A,B\n1,\n2,abc");
      p.transformColumn("B", (v) => (v === "" ? "EMPTY" : v));
      expect(p.toString()).toBe("A,B\n1,EMPTY\n2,abc");
    });
  });
});
