export function fetchChoseisan_(url: string): string {
  return UrlFetchApp.fetch(url, { headers: { accept: 'text/plain' } }).getContentText('UTF-8');
}
