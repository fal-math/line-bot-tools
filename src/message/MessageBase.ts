export class MessageBase {
  private lines: string[] = [];
  add(line?: string | null): this {
    if (line != null && line !== '') this.lines.push(line);
    return this;
  }
  blank(): this {
    this.lines.push('');
    return this;
  }
  section(title: string, prefix = '【', suffix = '】'): this {
    if (this.lines.length) this.blank();
    this.add(`${prefix}${title}${suffix}`);
    return this;
  }
  bullet(text: string, bullet = '・'): this {
    this.add(`${bullet}${text}`);
    return this;
  }
  indent(text: string, prefix = '  '): this {
    this.add(`${prefix}${text}`);
    return this;
  }
  toString(): string {
    return this.lines.join('\n');
  }
}
