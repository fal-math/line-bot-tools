# LINE Bot 運用支援システム README

## 概要

このプロジェクトは、競技かるた関連のイベント／練習情報を
Google カレンダー・調整さん（CSV）・Gmail などから取得し、
LINE Bot を通じて参加者や運営に対して自動通知を行う運用支援システムです。

**主な機能**

* 毎週木曜の練習予定＆場所案内の定期通知
* 大会申込〆切（当日21時／来週分まとめ）のクラス別通知
* 今日の練習案内と札分け（カードシャッフル）
* 調整さん締切データ取得＆LINE通知
* Gmail 遅刻欠席連絡の検知＆LINE通知＋自動返信
* Webhook を用いた外部練習イベント登録
* WBGT（暑さ指数）の取得・通知

---

## ディレクトリ構成

```
├─ src/
│  ├─ main.ts                  // GAS エントリポイント
│  ├─ config.ts                // スクリプトプロパティ取得ユーティリティ
│  ├─ types/type.ts            // 型定義（KarutaClass など）
│  ├─ util/
│  │   ├─ DateUtils.ts         // 日付ユーティリティ
│  │   └─ StringUtils.ts       // 文字列ユーティリティ
│  ├─ services/
│  │   ├─ CalendarService.ts   // カレンダー取得・解析
│  │   ├─ ChouseisanService.ts // 調整さん CSV パース・集計
│  │   ├─ LineService.ts       // LINE Push API 呼び出し
│  │   ├─ CardShuffle.ts       // カード（札）シャッフル
│  │   └─ WbgtService.ts       // WBGT 取得・整形
│  └─ jobs/
│      ├─ Announcer.ts         // 定期通知ジョブ
│      ├─ Notify.ts            // 〆切通知・当日通知ジョブ
│      ├─ Attendance.ts        // Gmail 受付遅刻連絡ハンドラ
│      └─ setupTriggers.ts     // 全トリガー再作成スクリプト
└─ initial/
    └─ scriptProperties.template.gs // スクリプトプロパティ一括設定サンプル
```

---

### src/config.ts の解説

* **getRequiredProp\_(key)**
  指定キーのスクリプトプロパティを取得。未設定時は `Error` を投げる。

  ```js
  function getRequiredProp_(key) {
    const value = userProps.getProperty(key);
    if (!value) throw new Error(`Missing required property: ${key}`);
    return value;
  }
  ```

  ※元コードにて、`return value;` の後に閉じ中括弧 (`}`) が欠落している場合、文法エラーとなります。ご注意ください。
* **getOptionalProp\_(key)**
  空文字または未設定時は `undefined` を返し、それ以外は文字列を返す。
* **getJsonProp\_(key)**
  必須プロパティ値を `JSON.parse`。パース失敗時はエラー。
* **getPracticeLocations\_()**
  `PRACTICE_LOCATIONS` キーから JSON オブジェクトを取得・検証し、オブジェクトでない場合はエラー。
* 上記をまとめて `Config` オブジェクトに格納し、デフォルトエクスポート。

---

## 必要なスクリプトプロパティ

Google Apps Script の **スクリプトプロパティ** に以下キーを登録してください。

| キー                                  | 内容・形式                                                                                              |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `LINE_CHANNEL_ACCESS_TOKEN`           | LINE Messaging API のチャネルトークン                                                                   |
| `LINE_GROUP_ID_TAIKAI_MOUSHIKOMI` 他… | 送信先グループ／ユーザー ID（複数）                                                                     |
| `CALENDAR_URL`                        | カレンダー一覧や共有 URL                                                                                |
| `GOOGLE_CALENDAR_ID_TAIKAI` 他…       | 各種カレンダーのID（大会／練習／〆切用 合計5種）                                                        |
| `CHOUSEISAN_URLS`                     | 調整さん URL マップ(JSON)：`{"A":"…","B":"…",…}`                                                        |
| `CHOUSEISAN_CSVS`                     | 調整さん CSV URL マップ(JSON)：`{"A":"…","B":"…",…}`                                                    |
| `SPREADSHEET_ID`                      | CSV バックアップ用スプレッドシート ID                                                                   |
| `DRIVE_URL`                           | ドライブ共有フォルダ URL                                                                                |
| `MANAGERS_PORTAL_URL`                 | 運営用ポータル URL                                                                                      |
| `ATTENDANCE_ADDRESS`                  | 遅刻欠席連絡受信用 Gmail アドレス                                                                       |
| `PRACTICE_LOCATIONS`                  | 練習場所定義(JSON)：<br>`{"短縮名":{ "buildingName":"…", "shortenBuildingName":"…", "mapUrl":"…" }, …}` |
| `DEBUG_MODE` *(任意)*                 | `"true"` or `"false"`（省略時は `"false"`）                                                             |

---

## initial/scriptProperties.template.gs

実行することで上記キーの初期登録が可能です。
