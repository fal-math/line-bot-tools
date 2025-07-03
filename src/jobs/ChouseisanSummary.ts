// src/jobs/ChouseisanSummary.ts
import { ChouseisanService } from '../services/ChouseisanService';
import { LineService } from '../services/LineService';
import { DateUtils } from '../util/DateUtils';

export class ChouseisanSummary {
  private readonly today = DateUtils.startOfDay();

  constructor(
    private readonly chouseisanService: ChouseisanService = new ChouseisanService(),
    private readonly lineService: LineService = new LineService(),
  ) { }

  // 調整さん集計（当日）
  public sendToday(to: string): void {
     this.sendSummary(this.today, this.today, to);
  }

  // 調整さん集計（前後1 週間分）
  public sendWeekly(to: string): void {
    const start = DateUtils.addDays(this.today, -7);
    const end = DateUtils.addDays(this.today, +7);
     this.sendSummary(start, end, to);
  }

  private sendSummary(start: Date, end: Date, to: string): void {
    const { hasEvent, body } = this.chouseisanService.checkChouseisanByClass(start, end);
    if (!hasEvent) return;
     this.lineService.pushText(to, body);
  }
}
