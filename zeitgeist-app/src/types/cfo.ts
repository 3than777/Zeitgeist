import type { UIMessage } from 'ai';

export interface Conversation {
  id: string;
  title: string;
  updated_at: string;
}

export interface DbMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

/** Extract the plain text from a UIMessage's parts. */
export function uiMessageText(message: UIMessage | undefined): string {
  if (!message) return '';
  return message.parts
    .filter((part): part is Extract<typeof part, { type: 'text' }> => part.type === 'text')
    .map((part) => part.text)
    .join('');
}

/** Convert stored DB rows into UIMessages for useChat's initial state. */
export function uiMessagesFromDb(rows: DbMessage[]): UIMessage[] {
  return rows.map((row) => ({
    id: row.id,
    role: row.role,
    parts: [{ type: 'text', text: row.content }],
  }));
}
