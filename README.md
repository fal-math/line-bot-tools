# LINE Bot 運用支援ツール

競技かるたの練習/大会運営向けに、Google Apps Script と LINE Messaging API で通知を自動化するツール群です。Google カレンダー、調整さん、Gmail、スプレッドシートの情報を集約し、運営と参加者向けの連絡を省力化します。

## できること

- 週次の練習案内（会場案内・持ち物・カレンダーリンク）
- 大会/外部練習の締切アナウンス（当日/来週）
- 当日の練習リマインドと札シャッフル
- 調整さんの集計と CSV バックアップ（スプレッドシート保存）
- Gmail 受信の自動振り分け（欠席/遅刻連絡、予約 CSV など）
- LINE Webhook 経由で外部練習イベントの登録

## 構成

```
src/
  main.ts                    // GAS エントリポイント
  config/                    // スクリプトプロパティ読み込み/検証
  jobs/                      // 定期ジョブ（通知/バックアップ/メール）
  services/                  // 外部連携（LINE/Calendar/Chouseisan など）
  mailHandlers/              // Gmail 受信処理
  message/                   // メッセージ生成
  util/                      // 便利関数
  types/                     // 型定義
initial/
  scriptProperties.gs        // スクリプトプロパティ登録サンプル

dist/
  code.js                    // ビルド成果物（GAS に push）
```

## セットアップ

1. 依存関係をインストール

```
npm install
```

2. ビルド（`dist/code.js` を生成）

```
npm run build
```

3. clasp 設定（初回のみ）

```
clasp login
```

4. GAS へ反映

```
npm run push
```

5. スクリプトプロパティを設定（後述）

6. トリガー再作成（GAS の関数 `setupTriggers()` を実行）

## トリガー

`setupTriggers()` を実行すると既存トリガーを削除して再作成します。スケジュールは `src/jobs/setupTriggers.ts` を参照してください。主なものは以下です。

- 木曜定期便: 毎週木曜 16:00
- 木曜定期便（テスト）: 毎週水曜 16:00
- 大会締切まとめ: 毎週土曜 09:00
- 大会締切（当日）: 毎日 09:00 / 21:00
- 練習案内: 毎週月曜 16:00 / 当日 08:00
- 調整さんバックアップ: 毎週水曜 03:00
- メール受信処理: 毎分

## テスト

```
npm test
```
