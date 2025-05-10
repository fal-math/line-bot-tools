export const joinLines_ = (...lines: (string | undefined)[]): string => lines.filter(Boolean).join('\n');
export const stripCss_ = (text: string): string => text.replace(/([^\{]+)\s*\{[^}]*}/g, '').replace(/[\n\r]*\s*[\n\r]+/g, '\n');
