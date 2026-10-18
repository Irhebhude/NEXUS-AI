import type { Conversation, ChatMessage } from './types';

export function conversationToMarkdown(conversation: Conversation, messages: ChatMessage[]): string {
  const lines: string[] = [
    `# ${conversation.title}`,
    '',
    `> Exported from NEXUS AI on ${new Date().toLocaleString()}`,
    '',
  ];

  for (const msg of messages) {
    const meta = msg.metadata || {};
    const speaker = msg.role === 'user' ? 'You' : 'NEXUS AI';
    lines.push(`## ${speaker}`);
    if (!meta.cancelled && msg.role === 'assistant' && meta.model) {
      lines.push(`*Model: ${meta.model}*`);
      lines.push('');
    }
    lines.push(msg.content);
    lines.push('');
  }

  return lines.join('\n');
}

export function downloadMarkdown(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
