import sanitizeHtml from 'sanitize-html';
export function safeEmailDocument(html: string, remoteImages = false): string {
  const clean = sanitizeHtml(html, {
    allowedTags: ['p','br','div','span','strong','b','em','i','u','s','blockquote','pre','code','ul','ol','li','h1','h2','h3','h4','table','thead','tbody','tr','td','th','hr','a', ...(remoteImages ? ['img'] : [])],
    allowedAttributes: { a: ['href','target','rel'], img: ['src','alt','width','height'] },
    allowedSchemes: ['https','http','mailto'], allowProtocolRelative: false,
    transformTags: { a: (_name, attrs) => ({ tagName: 'a', attribs: { href: attrs.href ?? '', target: '_blank', rel: 'noopener noreferrer nofollow' } }) },
  });
  return `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${remoteImages ? 'https: http:' : "'none'"}; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"><style>body{font:16px/1.6 system-ui;color:#17202a;overflow-wrap:anywhere}img{max-width:100%;height:auto}table{max-width:100%}pre{white-space:pre-wrap}</style></head><body>${clean}</body></html>`;
}
