export interface MailHandler {
  handle(message: GoogleAppsScript.Gmail.GmailMessage): void;
}
