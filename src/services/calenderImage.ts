import Config from '../config/config';
import { ExternalPracticeEvent, ClubPracticeEvent, ImageUrls } from "../types/type";


// export function generateMonthlyCalendar_(
//   year: number = new Date().getFullYear(),
//   month: number = new Date().getMonth() + 1
// ): UrlPair | null {
//   const titleStr = `${year}年 ${month}月 ちはやふる富士見 カレンダー`;

//   // Calendar フォルダを取得 or 作成
//   const FOLDER_NAME = 'Calendar';
//   let folder: GoogleAppsScript.Drive.Folder;
//   const folders = DriveApp.getFoldersByName(FOLDER_NAME);
//   if (folders.hasNext()) {
//     folder = folders.next();
//   } else {
//     folder = DriveApp.createFolder(FOLDER_NAME);
//   }
//   const oldFiles = folder.getFilesByName(titleStr);
//   while (oldFiles.hasNext()) {
//     oldFiles.next().setTrashed(true);
//   }

//   // ① Slides で描画
//   const presentationId = buildCalendarSlide_(titleStr, folder, year, month);
//   // ② PNG 取得
//   const pngBlob = getSlideAsPng_(presentationId, titleStr);
//   // ③ Drive に保存＆公開 URL 取得
//   const urls = saveBlobToDrive_(pngBlob, folder, titleStr);
//   Logger.log(urls);
//   return null
//   // return saveBlobToDrive_(pngBlob, folder, titleStr);
// }

// /**
//  * カレンダーをGoogleスライドとして作成
//  * @param title スライド名（例: "2025年 5月 カレンダー"）
//  * @param year  西暦（例: 2025）
//  * @param month 月番号1〜12（例: 5）
//  * @returns 作成したプレゼンテーションのファイルID
//  */
// function buildCalendarSlide_(
//   title: string,
//   folder: GoogleAppsScript.Drive.Folder,
//   year: number,
//   month: number
// ): string {
//   const pres = SlidesApp.create(title);
//   const file = DriveApp.getFileById(pres.getId());
//   folder.addFile(file);
//   DriveApp.getRootFolder().removeFile(file);

//   const slide = pres.getSlides()[0];

//   //カレンダーからイベント取得
//   const firstDate = new Date(year, month - 1, 1)
//   const lastDate = new Date(year, month, 0);

//   const teamPracticeCalendar = CalendarApp.getCalendarById(GOOGLE_CALENDAR_ID_KAIRENSHU);
//   const teamPracticeEvents = teamPracticeCalendar.getEvents(firstDate, lastDate);
//   const teamPracticeList: TeamPracticeCalendarEvent[] = [];
//   teamPracticeEvents.forEach(ev => {
//     const result = formatToTeamPracticeEvent_(ev);
//     if (!result) return;
//     teamPracticeList.push(result);
//   });

//   const matchCalendar = CalendarApp.getCalendarById(GOOGLE_CALENDAR_ID_TAIKAI);
//   const matchEvents = matchCalendar.getEvents(firstDate, lastDate);
//   const matchList: MatchInfo[] = [];
//   matchEvents.forEach(ev => {
//     const result = formatToMatchInfo_(ev);
//     if (!result) return;
//     matchList.push(result);
//   });

//   /* 共通パラメータ */
//   const WIDTH = 720;
//   const HEIGHT = 405;
//   const margin = 5;
//   const titleH = 25;
//   const headerH = 15;
//   const weekendW = 180;
//   const weekdayW = (WIDTH - 2 * margin - 2 * weekendW) / 5;
//   const dateBoxW = 50;
//   const dateBoxH = 50;
//   const bodyRows = 5;

//   // カレンダータイトル 
//   const slideTitle = slide.insertTextBox(
//     title,
//     margin, 0,
//     WIDTH - 2 * margin, titleH
//   );
//   slideTitle.getText().getTextStyle().setBold(true).setFontSize(10);
//   slideTitle.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);

//   //  カレンダーヘッダー(曜日)
//   const wnames = ['日', '月', '火', '水', '木', '金', '土'];
//   let headerX = margin;
//   for (let col = 0; col < 7; col++) {
//     const colW = (col === 0 || col === 6) ? weekendW : weekdayW;
//     const box = slide.insertShape(
//       SlidesApp.ShapeType.TEXT_BOX,
//       headerX, titleH,
//       colW, headerH
//     );
//     const textStyle = box.getText().setText(wnames[col]);
//     textStyle.getTextStyle().setFontSize(10);
//     textStyle.getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);
//     if (col === 0) textStyle.getTextStyle().setForegroundColor(`#FF2020`);
//     if (col === 6) textStyle.getTextStyle().setForegroundColor(`#2020FF`);
//     headerX += colW;
//   }

//   //  カレンダーの表
//   const bodyY = titleH + margin + headerH + margin;
//   const bodyH = HEIGHT - (titleH + margin + headerH + margin + margin);
//   const colW: number[] = [weekendW, weekdayW, weekdayW, weekdayW, weekdayW, weekdayW, weekendW];
//   const rowH: number[] = new Array(bodyRows).fill(bodyH / bodyRows);

//   const tables = [];
//   let tableX = margin;
//   for (let col = 0; col < 7; col++) {
//     const tbl = slide.insertTable(bodyRows, 1, tableX, bodyY, colW[col], bodyH);
//     tables.push(tbl);
//     tableX += colW[col];
//   }

//   let weekRow = 0;
//   for (let d = 1; d <= lastDate.getDate(); d++) {
//     const dateObj = new Date(year, month - 1, d);
//     const col = dateObj.getDay();

//     // 日付を描画
//     const dateBoxX = margin + subsum_(col, colW);
//     const dateBoxY = margin + titleH + headerH + subsum_(weekRow, rowH);
//     const dateBox = slide.insertShape(
//       SlidesApp.ShapeType.TEXT_BOX,
//       dateBoxX, dateBoxY,
//       dateBoxW, dateBoxH
//     );
//     const textStyle = dateBox.getText().setText(String(d)).getTextStyle();
//     textStyle.setFontSize(10).setBold(true);
//     if (col === 0) textStyle.setForegroundColor(`#FF2020`);
//     if (col === 6) textStyle.setForegroundColor(`#2020FF`);

//     // イベントリストを描画
//     const cell = tables[col].getCell(weekRow, 0);
//     let text = cell.getText();
//     text.clear();

//     const lines: string[] = [];
//     const indent = `        `;
//     // 会練習
//     teamPracticeList
//       .filter(info => info.date.getMonth() + 1 === month && info.date.getDate() === d)
//       .forEach(info => {
//         lines.push(`${indent}${info.timeRange} ${info.location.shortenLocation} (${info.targetClass})`);
//       });
//     // 大会情報
//     const matchLines = matchList
//       .filter(m => m.month === month && m.date === d)
//       .map(m => m.title);
//     if (matchLines.length)
//       lines.push(indent + matchLines.join('、'));

//     const content = lines.join('\n');
//     if (content) {
//       text.setText(content);
//       text.getTextStyle().setFontSize(8);
//     }

//     if (col === 6 && d !== lastDate.getDate()) weekRow++;
//   }
//   pres.saveAndClose();
//   return pres.getId();
// }

// function subsum_(n: number, arr: number[]): number {
//   if (n < 0 || n > arr.length) {
//     throw new RangeError(`n は 0 以上 ${arr.length} 以下で指定してください`);
//   }
//   return arr
//     .slice(0, n)
//     .reduce((acc, v) => acc + v, 0);
// }


// function formatToMatchInfo_(
//   event: GoogleAppsScript.Calendar.CalendarEvent
// ): MatchInfo | null {
//   const title = event.getTitle();
//   if (title.includes("*")) return null;

//   const dayTmp = event.getStartTime().getDay();
//   const wnames = ['日', '月', '火', '水', '木', '金', '土'];
//   const day = wnames[dayTmp];
//   return {
//     month: event.getStartTime().getMonth() + 1,
//     date: event.getStartTime().getDate(),
//     day,
//     title
//   };
// }

// /**
//  * 
//  * @param presentationId 
//  * @param title 
//  * @returns 
//  */
// function getSlideAsPng_(presentationId: string, title: string) {

//   if (!Slides.Presentations || !Slides.Presentations.Pages) {
//     throw new Error('Advanced Slides service (Slides) が有効になっていません');
//   }
//   const meta = Slides.Presentations.get(presentationId);
//   const slideId = meta.slides![0].objectId!;

//   const thumb = Slides.Presentations.Pages.getThumbnail(
//     presentationId,
//     slideId,
//     {
//       'thumbnailProperties.mimeType': 'PNG',
//       'thumbnailProperties.thumbnailSize': 'LARGE'
//     }
//   );
//   return UrlFetchApp.fetch(thumb.contentUrl!).getBlob().setName(`${title}.png`);
// }
// /**
//  * Blob を Calendar フォルダに保存／上書きして共有リンクを返す
//  * @param blob   PNG 等の Blob
//  * @param title  ファイル名（例: "2025-05-09_calendar.png"）
//  * @returns { original: ダウンロードURL, preview: サムネイルURL }
//  */
// function saveBlobToDrive_(
//   blob: GoogleAppsScript.Base.BlobSource,
//   folder: GoogleAppsScript.Drive.Folder,
//   title: string,
// ): { original: string; preview: string } {
//   const file = folder.createFile(blob).setName(title);
//   file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
//   const id = file.getId();
//   Logger.log(`Created file in Calendar/: ${id}`);

//   return {
//     original: `https://drive.google.com/uc?id=${id}`,
//     preview: `https://drive.google.com/thumbnail?id=${id}`
//   };
// }

// /**
//  * 指定年月のカレンダーを TableChart で作成し、
//  * PNG として Drive に保存する
//  *
//  * @param year  西暦（例: 2025）
//  * @param month 月番号1～12（例: 5）
//  * @returns { original: string; preview: string } または null
//  */
// export function generateMonthlyCalendar_(
//   year: number = new Date().getFullYear(),
//   month: number = new Date().getMonth() + 1
// ): UrlPair | null {

//   const titleStr = `${year}年 ${month}月 カレンダー`;

//   // 1) データ行列を作成 (HTMLタグ込みの文字列)
//   const header = ['日', '月', '火', '水', '木', '金', '土'];
//   const firstDay = new Date(year, month - 1, 1).getDay();
//   const lastDate = new Date(year, month, 0).getDate();

//   const rows: string[][] = [];
//   let row: string[] = Array(7).fill('');
//   let weekday = firstDay;
//   for (let d = 1; d <= lastDate; d++) {
//     // 各日付を left-top で配置し、日曜は赤、土曜は青に
//     const baseStyle = 'text-align:left;vertical-align:top;';
//     let cellText: string;
//     if (weekday === 0) {
//       cellText = `<div style="${baseStyle}color:red">${d}</div>`;
//     } else if (weekday === 6) {
//       cellText = `<div style="${baseStyle}color:blue">${d}</div>`;
//     } else {
//       cellText = `<div style="${baseStyle}">${d}</div>`;
//     }
//     row[weekday] = cellText;
//     weekday++;
//     if (weekday === 7 || d === lastDate) {
//       rows.push(row);
//       row = Array(7).fill('');
//       weekday = 0;
//     }
//   }

//   // 2) DataTableBuilder を組み立て
//   const dataTableBuilder = Charts.newDataTable();
//   header.forEach(h => dataTableBuilder.addColumn(Charts.ColumnType.STRING, h));
//   rows.forEach(r => dataTableBuilder.addRow(r));

//   // 3) TableChartBuilder を生成
//   const chartBuilder = Charts.newTableChart()
//     .setDataTable(dataTableBuilder)
//     .setDimensions(800, 600)
//     .setOption('allowHtml', true)
//     .setOption('alternatingRowStyle', false)

//   // 4) Chart をビルドし PNG Blob として取得
//   const chart = chartBuilder.build();
//   const pngBlob = chart.getAs('image/png').setName(`${titleStr}.png`);
//   // 5) Drive に保存＆公開 URL 取得
//   const urls = saveBlobToDrive_(pngBlob, titleStr);
//   Logger.log(urls);
//   return null
//   // return saveBlobToDrive_(pngBlob, folder, titleStr);
// }
