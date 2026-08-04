export function CodeBlock({ code, language }: { code: string; language?: string }) { return <pre className="ds-code"><code data-language={language}>{code}</code></pre>; }
