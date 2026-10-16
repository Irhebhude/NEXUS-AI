// Lightweight markdown-to-HTML renderer with code block syntax highlighting.

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const KEYWORDS = new Set([
  'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while',
  'do', 'switch', 'case', 'break', 'continue', 'class', 'extends', 'super',
  'this', 'new', 'try', 'catch', 'finally', 'throw', 'import', 'export',
  'default', 'from', 'as', 'async', 'await', 'yield', 'typeof', 'instanceof',
  'in', 'of', 'delete', 'void', 'null', 'undefined', 'true', 'false', 'static',
  'get', 'set', 'public', 'private', 'protected', 'readonly', 'interface',
  'type', 'enum', 'namespace', 'declare', 'abstract', 'implements', 'def',
  'print', 'elif', 'lambda', 'with', 'pass', 'raise', 'None', 'True', 'False',
  'and', 'or', 'not', 'is', 'fn', 'mut', 'pub', 'struct', 'impl',
  'match', 'use', 'crate', 'mod', 'ref', 'move', 'box', 'where', 'select',
  'insert', 'into', 'values', 'update', 'create', 'table', 'alter', 'drop',
  'index', 'join', 'left', 'right', 'inner', 'outer', 'group', 'by', 'order',
  'having', 'limit', 'offset',
]);

const TYPES = new Set([
  'string', 'number', 'boolean', 'object', 'Array', 'Promise', 'Map', 'Set',
  'Date', 'RegExp', 'Error', 'JSON', 'Math', 'Object', 'Number', 'String',
  'Boolean', 'Symbol', 'BigInt', 'Uint8Array', 'Response', 'Request', 'URL',
  'int', 'float', 'double', 'char', 'void', 'bool', 'byte', 'long', 'short',
  'str', 'list', 'dict', 'tuple', 'Vec', 'Option', 'Result',
  'i32', 'i64', 'u32', 'u64', 'f32', 'f64', 'usize', 'isize',
]);

function highlightCode(code: string): string {
  const escaped = escapeHtml(code);
  return escaped.replace(
    /(\b[A-Za-z_]\w*\b)(\s*)(\()?|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|(\b\d+(?:\.\d+)?\b)|(\/\/.*?$|#.*?$|\/\*[\s\S]*?\*\/)/gm,
    (match, word, space, paren, str, num, comment) => {
      if (comment) return `<span class="syn-comment">${comment}</span>`;
      if (str) return `<span class="syn-string">${str}</span>`;
      if (num) return `<span class="syn-number">${num}</span>`;
      if (word) {
        if (KEYWORDS.has(word)) return `<span class="syn-keyword">${word}</span>${space}${paren || ''}`;
        if (TYPES.has(word)) return `<span class="syn-type">${word}</span>${space}${paren || ''}`;
        if (paren) return `<span class="syn-function">${word}</span>${space}${paren}`;
        return word + space + (paren || '');
      }
      return match;
    }
  );
}

function renderInline(text: string): string {
  let result = escapeHtml(text);
  result = result.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
  result = result.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  result = result.replace(/\*(.+?)\*/g, '<em>$1</em>');
  result = result.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer" class="md-link">$1</a>'
  );
  result = result.replace(
    /(?<!["'>])(?<!\]\()(https?:\/\/[^\s<]+)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer" class="md-link">$1</a>'
  );
  return result;
}

export function renderMarkdown(text: string): string {
  if (!text) return '';

  const lines = text.split('\n');
  let html = '';
  let inCodeBlock = false;
  let codeLang = '';
  let codeContent = '';
  let inList = false;
  let listType: 'ul' | 'ol' = 'ul';
  let inBlockquote = false;

  const closeList = () => {
    if (inList) {
      html += `</${listType}>`;
      inList = false;
    }
  };

  const closeBlockquote = () => {
    if (inBlockquote) {
      html += '</blockquote>';
      inBlockquote = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('```')) {
      if (!inCodeBlock) {
        closeList();
        closeBlockquote();
        inCodeBlock = true;
        codeLang = line.slice(3).trim();
        codeContent = '';
      } else {
        const highlighted = codeLang ? highlightCode(codeContent) : escapeHtml(codeContent);
        html += `<pre class="code-block"><div class="code-header"><span class="code-lang">${escapeHtml(codeLang || 'text')}</span><button class="code-copy" data-code="${encodeURIComponent(codeContent)}">Copy</button></div><code>${highlighted}</code></pre>`;
        inCodeBlock = false;
        codeLang = '';
      }
      continue;
    }

    if (inCodeBlock) {
      codeContent += line + '\n';
      continue;
    }

    if (line.startsWith('> ')) {
      closeList();
      if (!inBlockquote) {
        html += '<blockquote>';
        inBlockquote = true;
      }
      html += renderInline(line.slice(2));
      continue;
    } else {
      closeBlockquote();
    }

    if (/^---+$/.test(line.trim())) {
      closeList();
      html += '<hr />';
      continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      closeList();
      const level = headingMatch[1].length;
      const text = renderInline(headingMatch[2]);
      html += `<h${level}>${text}</h${level}>`;
      continue;
    }

    const olMatch = line.match(/^\d+\.\s+(.+)$/);
    if (olMatch) {
      if (!inList || listType !== 'ol') {
        closeList();
        html += '<ol>';
        inList = true;
        listType = 'ol';
      }
      html += `<li>${renderInline(olMatch[1])}</li>`;
      continue;
    }

    const ulMatch = line.match(/^[-*]\s+(.+)$/);
    if (ulMatch) {
      if (!inList || listType !== 'ul') {
        closeList();
        html += '<ul>';
        inList = true;
        listType = 'ul';
      }
      html += `<li>${renderInline(ulMatch[1])}</li>`;
      continue;
    }

    closeList();

    if (line.trim() === '') {
      html += '<br />';
      continue;
    }

    html += `<p>${renderInline(line)}</p>`;
  }

  if (inCodeBlock) {
    html += `<pre class="code-block"><code>${escapeHtml(codeContent)}</code></pre>`;
  }
  closeList();
  closeBlockquote();

  return html;
}
