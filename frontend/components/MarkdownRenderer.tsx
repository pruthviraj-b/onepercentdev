'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';

interface Props {
  content: string;
  components?: any;
}

const customSchema = {
  ...defaultSchema,
  tagNames: [
    ...(defaultSchema.tagNames || []),
    'div', 'span', 'iframe', 'embed'
  ],
  attributes: {
    ...defaultSchema.attributes,
    '*': [
      ...(defaultSchema.attributes?.['*'] || []),
      'className', 'class', 'style'
    ]
  }
};

function processCallouts(md: string): string {
  if (!md) return '';
  return md.replace(
    /^>\s*\[\!(NOTE|TIP|INFO|IMPORTANT|WARNING|CAUTION|BEST PRACTICE)\]\s*(.*(?:\n>\s*.*)*)/gim,
    (match, type, body) => {
      const cleanBody = body
        .split('\n')
        .map((line: string) => line.replace(/^>\s?/, ''))
        .join('\n')
        .trim();

      const t = type.toUpperCase();
      let alertClass = 'info';
      let icon = 'ℹ️';
      let label = 'INFO';

      if (t === 'TIP') { alertClass = 'tip'; icon = '💡'; label = 'TIP'; }
      else if (t === 'IMPORTANT') { alertClass = 'important'; icon = '⚠️'; label = 'IMPORTANT'; }
      else if (t === 'WARNING' || t === 'CAUTION') { alertClass = 'warning'; icon = '⚠️'; label = 'WARNING'; }
      else if (t === 'BEST PRACTICE') { alertClass = 'best-practice'; icon = '⭐'; label = 'BEST PRACTICE'; }

      return `<div class="callout-box callout-${alertClass}">
  <div class="callout-header">
    <span class="callout-icon">${icon}</span>
    <span class="callout-title">${label}</span>
  </div>
  <div class="callout-body">

${cleanBody}

  </div>
</div>`;
    }
  );
}

export default function MarkdownRenderer({ content, components }: Props) {
  const processedContent = processCallouts(content);
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw, [rehypeSanitize as any, customSchema]]}
      components={components}
    >
      {processedContent}
    </ReactMarkdown>
  );
}
