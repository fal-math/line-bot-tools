export class StringUtils {
  static stripCss(text: string): string {
    return text.replace(/([^\{]+)\s*\{[^}]*}/g, '').replace(/[\n\r]*\s*[\n\r]+/g, '\n')
  };
}