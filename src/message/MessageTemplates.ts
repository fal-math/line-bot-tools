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
import { Message } from './Message';

type BaseMessageOptions = {
  header?: string;
  bullet?: string;
  showTargetClasses?: boolean;
  dayLabels?: readonly string[];
};

export type ClubPracticeMessageOptions = BaseMessageOptions & {
  showPersonInCharge?: boolean;
};

export type ExPracticeMessageOptions = BaseMessageOptions & {
  showDescription?: boolean;
  today?: Date; // Δ日計算用。省略時は new Date()
};

export type MatchMessageOptions = BaseMessageOptions;

export type DeadlineExPracticeMessageOptions = BaseMessageOptions & {
  today?: Date; // Δ日計算用。省略時は new Date()
};
export type DeadlineMatchMessageOptions = BaseMessageOptions & {
  showAttending?: boolean;
};

export class MessageTemplates {
  static buildClasswiseDeadlineMessage(
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

    // --- クラスごとのサマリ構築 -----------------------------------------
    const { summaryMap, hasMatch } = Object.entries(itemMap).reduce(
      (acc, [kClass, registrations]) => {
        // 1. 各級ごとに実行される処理
        const text = this.buildSingleClassDeadline(registrations, o);
        if (text) acc.hasMatch = true;
        acc.summaryMap[kClass as KarutaClass] = text;
        // 2. 次のループに渡す値（accumulator）
        return acc;
      },
      // 3. 初期値（最初のaccumulator）
      { summaryMap: {} as ClassMap<string>, hasMatch: false }
    );

    // --- 全体メッセージ構築 ---------------------------------------------
    const msg = new Message().add(o.header);

    for (const [kClass, summaryText] of Object.entries(summaryMap)) {
      if (!summaryText) continue;

      const header = `${KARUTA_CLASS_COLOR[kClass as KarutaClass]}${kClass}級｜${
        Config.Chouseisan.urls[kClass as KarutaClass]
      }`;
      msg.add(header).add(summaryText);
    }

    return { hasMatch, message: msg.toString() };
  }

  // --- helper -------------------------------------------------------
  static buildSingleClassDeadline(
    registrations: Registration[],
    o: Required<DeadlineMatchMessageOptions>
  ): string {
    if (registrations.length === 0) return '';

    const m = new Message();
    registrations.forEach((ev) => {
      m.blank();
      m.add(
        `🔷${DateUtils.formatMD(ev.eventDate)}${ev.title}（${DateUtils.formatMD(ev.deadline)}会〆）`
      );

      if (o.showAttending) {
        m.add('⭕参加:');
        if (ev.participants.attending.length > 0) {
          m.add(ev.participants.attending.join('\n'));
        }
      }

      if (ev.participants.undecided.length > 0) {
        m.add('❓未回答:');
        m.add(ev.participants.undecided.join('\n'));
      }
    });

    return m.toString();
  }

  static buildEventwiseDeadlineMessage(
    itemMap: ClassMap<Registration[]>,
    opts: DeadlineMatchMessageOptions = {}
  ): { hasMatch: boolean; message: string } {
    const o = {
      ...this.norm({
        header: opts.header ?? '🧑‍💻〆切(大会別)🧑‍💻',
        bullet: opts.bullet,
        showTargetClasses: opts.showTargetClasses,
        dayLabels: opts.dayLabels,
      }),
      showAttending: opts.showAttending ?? true,
    };

    // --- 1️⃣ 大会タイトルごとに再グルーピング ------------------------------
    const eventMap = Object.entries(itemMap).reduce((acc, [kClass, registrations]) => {
      for (const reg of registrations) {
        const key = reg.title;
        if (!acc[key]) acc[key] = [];
        // どの級の登録かを付与（構造上 Registration には存在しないため合成）
        acc[key].push({ ...reg, _fromClass: kClass as KarutaClass });
      }
      return acc;
    }, {} as Record<string, (Registration & { _fromClass: KarutaClass })[]>);

    // --- 2️⃣ メッセージ生成 --------------------------------------------------
    const { summaryMap, hasMatch } = Object.entries(eventMap).reduce(
      (acc, [eventTitle, registrations]) => {
        const text = this.buildSingleEventDeadline(eventTitle, registrations, o);
        if (text) acc.hasMatch = true;
        acc.summaryMap[eventTitle] = text;
        return acc;
      },
      { summaryMap: {} as Record<string, string>, hasMatch: false }
    );

    // --- 3️⃣ 全体メッセージ組み立て -----------------------------------------
    const msg = new Message().add(o.header);
    for (const [eventTitle, summaryText] of Object.entries(summaryMap)) {
      if (!summaryText) continue;
      
      msg.blank().add(`🔷${eventTitle}`).add(summaryText);
    }

    return { hasMatch, message: msg.toString() };
  }

  // --- helper -------------------------------------------------------
  static buildSingleEventDeadline(
    eventTitle: string,
    registrations: (Registration & { _fromClass: KarutaClass })[],
    o: Required<DeadlineMatchMessageOptions>
  ): string {
    if (registrations.length === 0) return '';

    const m = new Message();
    // 同一大会に含まれる全クラスを昇順で表示
    const sorted = registrations.sort((a, b) => (a._fromClass > b._fromClass ? 1 : -1));

    for (const reg of sorted) {
      const color = KARUTA_CLASS_COLOR[reg._fromClass] ?? '';
      m.add(
        `${color}${reg._fromClass}級 ${DateUtils.formatMD(reg.eventDate)}（会〆${DateUtils.formatMD(
          reg.deadline
        )}）`
      );
      if (o.showAttending) {
        m.add('⭕参加:');
        if (reg.participants.attending.length > 0) {
          m.add(reg.participants.attending.join('\n'));
        }
      }

      if (reg.participants.undecided.length > 0) {
        m.add('❓未回答:');
        m.add(reg.participants.undecided.join('\n'));
      }
    }

    return m.toString();
  }

  static deadlineExPractice(
    items: InternalDeadlineEvent[],
    opts: DeadlineExPracticeMessageOptions = {}
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

    const msg = new Message().add(o.header);
    for (const it of sorted) {
      const daysDiff = DateUtils.signedDaysDiff(o.today, it.date);
      const tag =
        daysDiff === 0
          ? '本日〆切'
          : daysDiff > 0
          ? `〆切まであと${daysDiff}日`
          : `期限超過${-daysDiff}日`;
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
      msg.bullet(`${ev.timeRange} ${ev.location.shortName}${ev.practiceType}`, o.bullet);
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
  private static norm(opts: BaseMessageOptions): Required<BaseMessageOptions> {
    const labels =
      Array.isArray(opts.dayLabels) && opts.dayLabels.length === 7 ? opts.dayLabels : WEEK_DAYS;
    return {
      header: opts.header ?? '',
      bullet: opts.bullet ?? '・',
      showTargetClasses: opts.showTargetClasses ?? true,
      dayLabels: labels,
    };
  }

  // Deadline 用：norm + today 付与
  private static normWithToday(
    opts: DeadlineExPracticeMessageOptions
  ): Required<DeadlineExPracticeMessageOptions> & Required<BaseMessageOptions> {
    const base = this.norm(opts);
    return {
      ...base,
      today: opts.today ?? new Date(),
    };
  }

  private static build<T extends { date: Date }>(
    events: T[],
    opts: Required<BaseMessageOptions>,
    render: (event: T, msg: Message) => void
  ): string {
    if (!events?.length) return '';
    const sorted = [...events].sort(DateUtils.compareByDateThenStart);

    const msg = new Message().add(opts.header);
    let prev = '';
    for (const ev of sorted) {
      const d = ev.date;
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (key !== prev) {
        msg.blank().add(`【${DateUtils.formatMDD(d, opts.dayLabels)}】`);
        prev = key;
      }
      render(ev, msg);
    }
    return msg.toString();
  }
}
