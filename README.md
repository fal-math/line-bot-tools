# line-bot-tools

## 概要

line-bot-toolsは、調整さんCSV解析、Googleカレンダー連携、Google スライドによるカレンダー画像生成、Gmailからの遅刻欠席連絡自動処理などを一括で行い、LINEへ通知する Google Apps Script プロジェクトです。

## 主な機能

* **調整さん申込状況解析**: 調整さんのCSVを取得し、参加・未回答状況をクラス別に集計（`src/services/chouseisanHelper.ts`）
* **LINE通知**:

  * 週次・当日・来週〆切リマインド（`src/jobs/announcer.ts`）
  * 今週の活動カレンダーURLや申込URL一覧通知
* **カレンダー画像生成**: Google スライドで当月カレンダーを作成し、PNG化してLINEに送信（`src/services/calenderImage.ts`）
* **Gmail 遅刻欠席連絡処理**: 指定メールアドレス宛の未読メールを検知し、LINEへ転送＆自動返信（`src/jobs/attendance.ts`）
* **トリガー設定**: 毎週・毎日の定期実行トリガーを一括セットアップ（`src/jobs/setupTriggers.ts`）

## 環境設定

1. **Google Apps Script API** と **Advanced Slides API (Slides)** を有効化
2. プロパティ値の設定(下記1,2のいずれか)
   * `LINE_CHANNEL_ACCESS_TOKEN`
   * `LINE_USER_ID_MAINTAINER`
   * `LINE_GROUP_ID_TAIKAI_MOUSHIKOMI`
   * `LINE_GROUP_ID_UNNEI_HOMBU`
   * `LINE_GROUP_ID_UNNEI_SHIFT`
   * `LINE_GROUP_ID_ZENTAI`
   * `LINE_GROUP_ID_TEST`
   * `GOOGLE_CALENDER_ID_TAIKAI`
   * `GOOGLE_CALENDER_ID_KAIRENSHU`
   * `GOOGLE_CALENDER_ID_KAISHIME`
   * `GOOGLE_CALENDER_ID_HONSHIME`
   * `DRIVE_URL`
   * `CALENDER_URL`
   * `ATTENDANCE_ADDRESS`
   * `CHOUSEISAN_URLS` (JSON 形式)
   * `CHOUSEISAN_CSVS` (JSON 形式)

   1. `initial/scriptProperties.template.gs` を参考に, 上記プロパティ値を埋め, 手動でアップし, `scriptProperties`を実行する.
   2. GAS プロジェクトのスクリプト プロパティ（オンラインエディタの「プロジェクトのプロパティ」）に上記を設定する.

## インストール／デプロイ手順

```bash
# プロジェクト作成済みGoogle Apps Scriptへ接続
clasp clone <GAS_PROJECT_ID>

# コードをプッシュ
clasp push
```

## トリガーのセットアップ

スクリプトエディタから関数 `setupTriggers` を実行するか、GASのトリガー設定画面で以下を登録:

| 関数名                   | 実行タイミング |
| ------------------------ | -------------- |
| announceWeekly           | 毎週木曜 16:00 |
| announceDeadlineNextWeek | 毎週土曜 09:00 |
| announceDeadlineToday    | 毎日 09:00     |
| announceChouseisanToday  | 毎日 17:00     |
| announceFinalToday       | 毎日 07:00     |
| attandanceHandler        | 毎分           |

## 関数一覧と呼び出し例

* `announceWeekly()` — 今週の練習予定＆申込URL一覧をLINEグループへ通知
* `announceDeadlineToday()` — 本日〆切の大会申込状況をLINEグループへ通知
* `announceDeadlineNextWeek()` — 来週〆切の大会申込リマインド
* `announceChouseisanToday()` — 調整さん申込締切当日状況を通知
* `sendMonthlyCalendar()` — 当月カレンダーPNGをLINEへ送信
* `attandanceHandler()` — Gmail未読メールをLINEへ通知＆自動返信
* `setupTriggers()` — 上記トリガーを一括登録

## ディレクトリ構成

```text
src/
├─ config.ts                # スクリプトプロパティ読み込み
├─ initial/
│  └─ scriptProperties.template.gs # プロパティ値の設定
├─ util/
│  ├─ date.ts               # 日付操作ユーティリティ
│  └─ string.ts             # 文字列ユーティリティ
├─ services/
│  ├─ line.ts               # LINEメッセージ送信
│  ├─ chouseisan.ts         # 調整さんCSV取得
│  ├─ chouseisanHelper.ts   # 申込状況解析
│  ├─ kaishimeHelper.ts     # 大会リマインド解析
│  └─ calenderImage.ts      # カレンダー画像生成
├─ jobs/
│  ├─ announcer.ts          # 各種通知関数
│  ├─ setupTriggers.ts      # トリガー設定
│  └─ attendance.ts         # Gmail連絡処理
└─ main.ts                  # Clasp エントリーポイント
```

## 注意事項

* トリガー実行時刻は Asia/Tokyo（JST）基準です
* Slides API が有効化されていないとカレンダーPNG生成でエラーになります
* `CHOUSEISAN_URLS` と `CHOUSEISAN_CSVS` は正しい JSON 形式で設定してください

---
