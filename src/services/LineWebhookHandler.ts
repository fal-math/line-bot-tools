import Config from '../config/config';
import { CalendarService } from '../services/CalendarService';
import { LineService } from '../services/LineService';
import { ExPracticeEvent } from '../types/type';
import { DateUtils } from '../util/DateUtils';
import { StringUtils } from '../util/StringUtils';

export class LineWebhookHandler {
  private line = new LineService();
  private calendar = new CalendarService();
  private configOfExPracrice = Config.ExPracticeRecord;

  public handle(text: string, to: string) {
    if (text === '★外部練追加★') this.replyFormat(to);
    if (text.trim().includes('★外部練追加フォーマット★')) this.registerExternalPractice(text, to);
  }

  // 外部練追加フォーマットのキー
  private fields = {
    date: { label: '日付', desc: '日付: 「◯/☓」の形式。例→9/13' },
    time: { label: '時間', desc: '時間: 「0900-1900」の形式' },
    title: { label: '練習名', desc: '練習名: 「◯◯練」の形式が推奨' },
    location: { label: '場所', desc: '場所: 特になし' },
    targetClasses: {
      label: '対象級',
      desc: '対象級: 例→ABC、\n例→E以上、\n例→G級①②③以上',
    },
    deadline: { label: '〆切', desc: '〆切: 「◯/☓」の形式。例→9/13' },
    category: { label: '種別', desc: '' },
  };

  // 外部練追加フォーマットの返信
  private replyFormat(to: string) {
    const formatText = [
      '★外部練追加フォーマット★',
      ...Object.values(this.fields).map((f) => `${f.label}：`),
    ].join('\n');

    const categoryList = [...Object.keys(this.configOfExPracrice), 'その他'];
    const categoryText = `種別:\n下記のどれかを選んでください。\n${categoryList.join('/')}`;
    const descriptionText = [
      '↑埋めて返信してください↑',
      '※記載上の注意',
      ...Object.values(this.fields)
        .map((f) => f.desc)
        .filter(Boolean),
      categoryText,
    ].join('\n\n');

    this.line.pushText(to, formatText);
    this.line.pushText(to, descriptionText);
    return;
  }

  // 外部練追加の処理
  private registerExternalPractice(text: string, to: string) {
    text = StringUtils.toHalfWidth(text);
    const exPracrtice = this.parseExternalPractice(text);
    if (!exPracrtice) {
      this.line.pushText(to, 'フォーマットが正しくありません。再度ご確認ください。');
      return;
    }

    const calendarDescription = this.configOfExPracrice[exPracrtice.category]?.description;

    try {
      this.calendar.createCalenderEvent(
        {
          start: exPracrtice.date,
          location: exPracrtice.location,
          summary: `${exPracrtice.title}${exPracrtice.timeRange} ${
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

  // 外部練追加フォーマットのパース
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

    const f = this.fields;
    const dateStr = data[f.date.label];
    const deadlineStr = data[f.deadline.label];
    const timeRange = data[f.time.label];
    const title = data[f.title.label];
    const targetClasses = data[f.targetClasses.label];
    const location = data[f.location.label];
    const category = data[f.category.label];

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
