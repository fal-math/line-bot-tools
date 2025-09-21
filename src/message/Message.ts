import Config from '../config/config';
import {
  ClassMap,
  ClubPracticeEvent,
  ExPracticeEvent,
  InternalDeadlineEvent,
  KarutaClass,
  MatchEvent,
  Registration,
} from '../types/type';
import { DateUtils, WEEK_DAYS } from '../util/DateUtils';
import { KARUTA_CLASS_COLOR, StringUtils } from '../util/StringUtils';
import { MessageBase } from './MessageBase';

type BaseOpts = {
  header?: string;
  bullet?: string;
  showTargetClasses?: boolean;
  dayLabels?: readonly string[];
};

export type ClubPracticeMessageOptions = BaseOpts & {
  showPersonInCharge?: boolean;
};

export type ExPracticeMessageOptions = BaseOpts & {
  showDescription?: boolean;
  today?: Date; // Δ日計算用。省略時は new Date()
};

export type MatchMessageOptions = BaseOpts;

export type DeadlineMessageOptions = BaseOpts & {
  today?: Date; // Δ日計算用。省略時は new Date()
};
export type DeadlineMatchMessageOptions = BaseOpts & {
  showAttending?: boolean;
};

export class Message {
  static deadlineMatch(
    itemMap: ClassMap<Registration[]>,
    opts: DeadlineMatchMessageOptions = {}
  ): { hasMatch: boolean; message: string } {
    const o = {
      ...this.norm({
        header: opts.header ?? '🔔近日の〆切(大会)🔔',
        bullet: opts.bullet,
        showTargetClasses: opts.showTargetClasses,
        dayLabels: opts.dayLabels,
      }),
      showAttending: opts.showAttending ?? true,
    };

    const chouseisanSummary = {} as ClassMap<string>;
    let hasMatch = false;
    for (const [kClass, registrations] of Object.entries(itemMap) as [
      KarutaClass,
      Registration[]
    ][]) {
      if (registrations.length === 0) {
        chouseisanSummary[kClass] = '';
      } else {
        hasMatch = true;
        let body = ``;
        registrations.forEach((ev) => {
          body += `🔹${DateUtils.formatMD(ev.eventDate)}${ev.title}（${DateUtils.formatMD(
            ev.deadline
          )}〆切）\n`;
          if (o.showAttending) {
            body += `⭕参加:\n`;
            if (ev.participants.attending.length > 0) {
              body += ev.participants.attending.join('\n') + '\n';
            }
          }
          if (ev.participants.undecided.length > 0) {
            body += `❓未回答:\n`;
            body += ev.participants.undecided.join('\n') + '\n';
          }
        });
        chouseisanSummary[kClass] = body;
      }
    }

    const msg = new MessageBase().add(o.header);
    for (const [kClass, summaryText] of Object.entries(chouseisanSummary) as [
      KarutaClass,
      string
    ][]) {
      const fullText = [summaryText].filter(Boolean).join('\n');
      if (!fullText) continue;

      const header = `${KARUTA_CLASS_COLOR[kClass]}${kClass}級｜${Config.Chouseisan.urls[kClass]}`;
      msg.add(`${header}`).blank().add(`${fullText}`);
    }

    return { hasMatch, message: msg.toString() };
  }

  static deadlineExPractice(
    items: InternalDeadlineEvent[],
    opts: DeadlineMessageOptions = {}
  ): { hasExPractice: boolean; message: string } {
    if (!items?.length) return { hasExPractice: false, message: '' };

    const o = this.normWithToday({
      header: opts.header ?? '🔔近日の〆切(外部練)🔔',
      bullet: opts.bullet,
      showTargetClasses: opts.showTargetClasses,
      dayLabels: opts.dayLabels,
      today: opts.today,
    });

    const sorted = [...items]
      .filter((it) => it.isExternalPractice)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
    if (sorted.length === 0) return { hasExPractice: false, message: '' };

    const msg = new MessageBase().add(o.header);
    for (const it of sorted) {
      const ddays = DateUtils.signedDaysDiff(o.today, it.date);
      const tag =
        ddays === 0 ? '本日〆切' : ddays > 0 ? `〆切まであと${ddays}日` : `期限超過${-ddays}日`;
      msg.blank().add(`【${tag}】`).bullet(it.title, o.bullet);
    }
    return { hasExPractice: true, message: msg.toString() };
  }

  static clubPractice(events: ClubPracticeEvent[], opts: ClubPracticeMessageOptions = {}): string {
    const o = this.norm({
      header: opts.header ?? '🔵練習のお知らせ🔵',
      bullet: opts.bullet ?? '・',
      showTargetClasses: opts.showTargetClasses ?? true,
      dayLabels: opts.dayLabels,
    });
    return this.build(events, o, (ev, msg) => {
      msg.bullet(`${ev.timeRange} ${ev.location.shortenBuildingName}${ev.practiceType}`, o.bullet);
      if ((opts.showPersonInCharge ?? true) && ev.personInCharge) msg.indent(ev.personInCharge);
      if (o.showTargetClasses && ev.targetClasses?.length)
        msg.indent('対象: ' + StringUtils.stringfyKarutaClass(ev.targetClasses));
    });
  }

  static exPractice(events: ExPracticeEvent[], opts: ExPracticeMessageOptions = {}): string {
    const o = this.normWithToday({
      header: opts.header ?? '🟠外部練習のお知らせ🟠',
      bullet: opts.bullet ?? '・',
      showTargetClasses: opts.showTargetClasses ?? true,
      dayLabels: opts.dayLabels,
      today: opts.today,
    });

    return this.build(events, o, (ev, msg) => {
      msg.bullet(`${StringUtils.removeLeading(ev.title, '外部')}`, o.bullet);
      const ddays = DateUtils.signedDaysDiff(o.today, ev.deadline);
      const tag =
        ddays === 0
          ? '本日〆切！'
          : ddays > 0
          ? `〆切:${DateUtils.formatMDD(ev.deadline)}`
          : `※締切済`;
      msg.add(tag);
      msg.add(`時間: ${ev.timeRange}`);
      if (o.showTargetClasses && ev.targetClasses?.length)
        msg.add(`対象: ${StringUtils.stringfyKarutaClass(ev.targetClasses)}`);
      if ((opts.showDescription ?? true) && ev.description) msg.add(`${ev.description}`);
    });
  }

  static match(events: MatchEvent[], opts: MatchMessageOptions = {}): string {
    const o = this.norm({
      header: opts.header ?? '🟢近日大会のお知らせ🟢',
      bullet: opts.bullet ?? '・',
      showTargetClasses: opts.showTargetClasses ?? true,
      dayLabels: opts.dayLabels,
    });
    return this.build(events, o, (ev, msg) => {
      const cls =
        o.showTargetClasses && ev.targetClasses?.length
          ? `${StringUtils.stringfyKarutaClass(ev.targetClasses)}`
          : '';
      msg.bullet(`${ev.title}${cls}`, o.bullet);
    });
  }

  /* ========== ここから下は最小限の共通実装（private） ========== */
  private static norm(o: BaseOpts): Required<BaseOpts> {
    const labels = Array.isArray(o.dayLabels) && o.dayLabels.length === 7 ? o.dayLabels : WEEK_DAYS;
    return {
      header: o.header ?? '',
      bullet: o.bullet ?? '・',
      showTargetClasses: o.showTargetClasses ?? true,
      dayLabels: labels,
    };
  }

  // Deadline 用：norm + today 付与
  private static normWithToday(
    o: DeadlineMessageOptions
  ): Required<DeadlineMessageOptions> & Required<BaseOpts> {
    const base = this.norm(o);
    return {
      ...base,
      today: o.today ?? new Date(),
    };
  }



  private static build<T extends { date: Date }>(
    events: T[],
    o: Required<BaseOpts>,
    render: (ev: T, msg: MessageBase) => void
  ): string {
    if (!events?.length) return '';
    const sorted = [...events].sort(DateUtils.compareByDateThenStart);

    const msg = new MessageBase().add(o.header);
    let prev = '';
    for (const ev of sorted) {
      const d = ev.date;
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (key !== prev) {
        msg.blank().add(`【${DateUtils.formatMDD(d, o.dayLabels)}】`);
        prev = key;
      }
      render(ev, msg);
    }
    return msg.toString();
  }
}
