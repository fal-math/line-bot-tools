import Config from '../config/config';
import { CalendarService } from '../services/CalendarService';
import { LineService } from '../services/LineService';
import { ExPracticeCategory, ExPracticeEvent } from '../types/type';
import { DateUtils } from '../util/DateUtils';
import { StringUtils } from '../util/StringUtils';

export class LineWebhookHandler {
  private line = new LineService();
  private calendar = new CalendarService();

  private key = {
    date: '日付',
    time: '時間',
    title: '練習名',
    location: '場所',
    targetClasses: '対象級',
    deadline: '〆切',
    category: '種別',
  };
  private keyDescription = {
    date: '日付: 「◯/☓」の形式。例→9/13',
    time: '時間: 「0900-1900」の形式',
    title: '練習名: 「◯◯練」の形式が推奨',
    location: '場所: 特になし',
    targetClasses: '対象級:\n例1→ABC、\n例2→E以上、\n例3→G級①②③以上',
    deadline: '〆切: 「◯/☓」の形式。例→9/13',
    category: `種別: 下記のどれかを選んでください。\n${Object.values(ExPracticeCategory).join('/')}`,
  };

  public handle(text: string, to: string) {
    if (text === '外部練追加') {
      this.line.pushText(
        to,
        [
          '★外部練追加フォーマット★',
          `${this.key.date}：`,
          `${this.key.time}：`,
          `${this.key.title}：`,
          `${this.key.location}：`,
          `${this.key.targetClasses}：`,
          `${this.key.deadline}：`,
          `${this.key.category}：`,
        ].join('\n')
      );
      this.line.pushText(
        to,
        [
          '↑埋めて返信してください↑',
          '',
          '記載上の注意',
          `${this.keyDescription.date}`,
          `${this.keyDescription.time}`,
          `${this.keyDescription.title}`,
          `${this.keyDescription.location}`,
          `${this.keyDescription.targetClasses}`,
          `${this.keyDescription.deadline}`,
          `${this.keyDescription.category}`,
        ].join('\n')
      );
      return;
    }

    if (text.trim().includes('外部練追加フォーマット')) {
      this.line.pushText(to, '外部練追加作業を行います。少々お待ちください。');

      text = StringUtils.toHalfWidth(text);
      const parsed = this.parseExternalPractice(text);
      if (!parsed) {
        this.line.pushText(to, 'フォーマットが正しくありません。再度ご確認ください。');
        return;
      }

      let calendarDescription = '';
      switch (parsed.event.category) {
        case ExPracticeCategory.Godo:
          calendarDescription = [
            '⏰📞当日欠席・遅刻の連絡',
            '主催者:山梨さん',
            Config.Mail.godorenAddress,
            '⚠️下記を必ず記載⚠️',
            '所属(ちはやふる富士見)、',
            '名前、',
            '用件(遅刻の場合、到着予定時刻)',
            '※失礼のないように！ ',
          ].join('\n');
          break;
        case ExPracticeCategory.KM:
          calendarDescription = [
            '⏰📞当日欠席・遅刻の連絡',
            '・当日15時まで',
            '　→調整さんの修正のみでOK (LINE連絡など不要)',
            '・当日15時以降',
            '　→直前の欠席＆遅刻は、KM練の全体LINEに連絡',
          ].join('\n');
          break;
        case ExPracticeCategory.Wako:
          calendarDescription = [
            '⏰📞当日欠席・遅刻の連絡',
            '河野さんと髙田(祐)さんへLINEをしてください。',
          ].join('\n');
          break;
        default:
          break;
      }

      try {
        this.calendar.createCalenderEvent(
          {
            start: parsed.event.date,
            location: parsed.event.location,
            summary: `外部${parsed.event.title}${parsed.event.timeRange} ${
              parsed.event.targetClasses
            }:${DateUtils.formatMD(parsed.deadline)}〆`,
            description: calendarDescription,
          },
          Config.Calendar.id.externalPractice
        );
      } catch (e) {
        this.line.pushError((e as Error).message);
      }
      try {
        this.calendar.createCalenderEvent(
          {
            start: parsed.deadline,
            summary: `〆${parsed.event.targetClasses}|外部${
              parsed.event.title
            }${DateUtils.formatMDD(parsed.event.date)}`,
            description: `グループLINE内「イベント」から参加ポチ\nKM練は調整さん入力も忘れずに！`,
          },
          Config.Calendar.id.internalDeadline
        );
      } catch (e) {
        this.line.pushError((e as Error).message);
      }

      this.line.pushText(
        to,
        [
          `✅ 外部練習・締切日を登録しました`,
          `日付：${parsed.event.date.toLocaleDateString()}`,
          `時間：${parsed.event.timeRange}`,
          `練習名：${parsed.event.title}`,
          `対象級：${parsed.event.targetClasses}`,
          `〆切：${parsed.deadline.toLocaleDateString()}`,
          `場所:${parsed.event.location}`,
          `種別:${parsed.event.category}`,
        ].join('\n')
      );
      return;
    }
  }

  private parseExternalPractice(text: string): {
    event: ExPracticeEvent;
    deadline: Date;
  } | null {
    // 行ごとに key：value を抽出
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.includes('：') && !l.startsWith('★'));
    const data: Record<string, string> = {};
    for (const line of lines) {
      const [key, ...rest] = line.split('：');
      data[key] = rest.join('：').trim();
    }

    const dateStr = data[this.key.date];
    const deadlineStr = data[this.key.deadline];
    const timeRange = data[this.key.time];
    const title = data[this.key.title];
    const targetClasses = data[this.key.targetClasses]; // 任意
    const location = data[this.key.location];
    const category = data[this.key.category];

    if (!dateStr || !deadlineStr || !timeRange || !title || !location || !category) return null;

    let date: Date, deadline: Date;
    try {
      date = DateUtils.parseMD(dateStr);
      deadline = DateUtils.parseMD(deadlineStr);
    } catch {
      return null;
    }

    function isExPracticeCategory(value: unknown): value is ExPracticeCategory {
      return Object.values(ExPracticeCategory).includes(value as ExPracticeCategory);
    }
    if (!isExPracticeCategory(category)) return null;

    return {
      event: {
        date,
        title,
        location,
        timeRange,
        targetClasses,
        category,
      },
      deadline,
    };
  }
}
