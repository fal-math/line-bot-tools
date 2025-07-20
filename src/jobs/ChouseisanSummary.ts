// // src/jobs/ChouseisanSummary.ts
// import { ChouseisanService } from '../services/ChouseisanService';
// import { LineService } from '../services/LineService';
// import { ClassMap, KarutaClass, Registration } from '../types/type';
// import { DateUtils } from '../util/DateUtils';

// export class ChouseisanSummary {
//   private readonly today = DateUtils.startOfDay();

//   constructor(
//     private readonly chouseisanService: ChouseisanService = new ChouseisanService(),
//     private readonly lineService: LineService = new LineService(),
//   ) { }



//   // // 調整さん集計（当日）
//   // public sendToday(to: string): void {
//   //   this.sendSummary(this.today, this.today, to);
//   // }

//   // 調整さん集計（前後1 週間分）
//   public sendWeekly(to: string): void {
//     const start = DateUtils.addDays(this.today, -7);
//     const end = DateUtils.addDays(this.today, +7);
//     this.sendSummary(start, end, to);
//   }

//   private sendSummary(start: Date, end: Date, to: string): void {
//     const summaries = this.chouseisanService.getSummaryByClass(start, end);

//     let body = ``;
//     for (const [kClass, registrations] of Object.entries(summaries) as [KarutaClass, Registration[]][]) {
//       if (registrations.length === 0) continue;
//       body += `===${kClass}===\n`
//       registrations.forEach(ev => {
//         body += `🔹${DateUtils.formatMD(ev.eventDate)}${ev.title}(${DateUtils.formatMD(ev.deadline)}〆切)\n`;
//         body += `⭕参加:\n${ev.participants.attending.join('\n')}\n`;
//         body += `❓未回答:\n${ev.participants.undecided.join('\n')}\n\n`;
//       });
//     }

//     this.lineService.pushText(to, body);
//   }
// }
