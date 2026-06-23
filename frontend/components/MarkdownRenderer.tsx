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

export default function MarkdownRenderer({ content, components }: Props) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw, [rehypeSanitize as any, customSchema]]}
      components={components}
    >
      {content}
    </ReactMarkdown>
  );
}
