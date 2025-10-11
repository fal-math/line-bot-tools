import Config from '../config/config';
import { CalendarService } from '../services/CalendarService';
import { LineService } from '../services/LineService';
import { ExPracticeEvent, HeaderMap } from '../types/type';
import { DateUtils } from '../util/DateUtils';
import { StringUtils } from '../util/StringUtils';
import { ExPracticeConfigRow, SpreadsheetConfigService } from './SpreadsheetConfigService';

export class LineWebhookHandler {
  private line = new LineService();
  private calendar = new CalendarService();
  private sheetName = '外部練';
  private configOfExPracrice = new SpreadsheetConfigService(
    Config.CONFIG_SPREADSHEET_ID,
    this.sheetName,
    { name: '名前', description: '説明' } as HeaderMap<ExPracticeConfigRow>,
    'name'
  );

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
    targetClasses: '対象級: 例→ABC、\n例→E以上、\n例→G級①②③以上',
    deadline: '〆切: 「◯/☓」の形式。例→9/13',
    category: '',
  };

  public handle(text: string, to: string) {
    if (text === '外部練追加') {
      const categoryList = [...this.configOfExPracrice.names(), 'その他'];
      const categoryText = `種別:\n下記のどれかを選んでください。\n${categoryList.join('/')}`;
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
          '※記載上の注意',
          `${this.keyDescription.date}`,
          `${this.keyDescription.time}`,
          `${this.keyDescription.title}`,
          `${this.keyDescription.location}`,
          `${this.keyDescription.targetClasses}`,
          `${this.keyDescription.deadline}`,
          categoryText,
        ].join('\n\n')
      );
      return;
    }

    if (text.trim().includes('外部練追加フォーマット')) {
      // this.line.pushText(to, '外部練追加作業を行います。少々お待ちください。');

      text = StringUtils.toHalfWidth(text);
      const exPracrtice = this.parseExternalPractice(text);
      if (!exPracrtice) {
        this.line.pushText(to, 'フォーマットが正しくありません。再度ご確認ください。');
        return;
      }

      const calendarDescription = this.configOfExPracrice.getByName(
        exPracrtice.category
      )?.description;

      try {
        this.calendar.createCalenderEvent(
          {
            start: exPracrtice.date,
            location: exPracrtice.location,
            summary: `外部${exPracrtice.title}${exPracrtice.timeRange} ${
              exPracrtice.targetClasses
            }:${DateUtils.formatMD(exPracrtice.deadline)}〆`,
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
            start: exPracrtice.deadline,
            summary: `〆${exPracrtice.targetClasses}|外部${exPracrtice.title}${DateUtils.formatMDD(
              exPracrtice.date
            )}`,
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
          `日付: ${DateUtils.formatMDD(exPracrtice.date)}`,
          `時間: ${exPracrtice.timeRange}`,
          `練習名: ${exPracrtice.title}`,
          `対象級: ${exPracrtice.targetClasses}`,
          `〆切: ${DateUtils.formatMDD(exPracrtice.deadline)}`,
          `場所: ${exPracrtice.location}`,
          `種別: ${exPracrtice.category}`,
        ].join('\n')
      );
      return;
    }
  }

  private parseExternalPractice(text: string): ExPracticeEvent | null {
    // 行ごとに key：value を抽出
    const lines = text
      .replace(/：/g, ':')
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.includes(':') && !l.startsWith('★'));
    const data: Record<string, string> = {};
    for (const line of lines) {
      const [key, ...rest] = line.split(':');
      data[key] = rest.join(':').trim();
    }

    const dateStr = data[this.key.date];
    const deadlineStr = data[this.key.deadline];
    const timeRange = data[this.key.time];
    const title = data[this.key.title];
    const targetClasses = data[this.key.targetClasses];
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

    return {
      date,
      title,
      location,
      timeRange,
      targetClasses,
      category,
      deadline,
    };
  }
}
