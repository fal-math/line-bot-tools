import { ImageUrls } from '../types/type';

export class DriveService {
  /**
   * 画像がDrive上に存在するか確認し、存在すればURLを返す
   * @param fileId 画像のファイルID
   * @returns 画像のURLペア
   */
  public getImageUrls(fileId: string): ImageUrls | null {
    try {
      const file = DriveApp.getFileById(fileId);
    } catch {
      return null;
    }
    return {
      original: `https://drive.google.com/uc?id=${fileId}`,
      preview: `https://drive.google.com/thumbnail?id=${fileId}`,
    };
  }
}
