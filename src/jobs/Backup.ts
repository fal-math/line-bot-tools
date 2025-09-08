import Config from '../config/config';
import { ChouseisanService } from '../services/ChouseisanService';
import { KarutaClass } from '../types/type';
import { DateUtils } from '../util/DateUtils';

export class Backup {
  public chouseisanCsv(): void {
    const matrixRecords = new ChouseisanService().getMatrix();

    const spreadsheetId = Config.Chouseisan.spreadsheetId;
    const ss = SpreadsheetApp.openById(spreadsheetId);

    (Object.keys(matrixRecords) as KarutaClass[]).forEach((kClass) => {
      if (matrixRecords[kClass].length === 0) return;
      const maxCols = matrixRecords[kClass].reduce((m, row) => Math.max(m, row.length), 0);

      // 足りないセルは空文字でパディング
      const normalized = matrixRecords[kClass].map((row) =>
        row.length < maxCols ? row.concat(Array(maxCols - row.length).fill('')) : row
      );

      const sheetName = `${DateUtils.formatYMD(new Date()).replace(/-/g, '')}${kClass}`;
      let sheet = ss.getSheetByName(sheetName);
      if (!sheet) sheet = ss.insertSheet(sheetName);
      else sheet.clearContents();

      sheet.getRange(1, 1, normalized.length, maxCols).setValues(normalized);
    });
  }
}
