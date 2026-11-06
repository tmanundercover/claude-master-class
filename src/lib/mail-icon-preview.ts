import { PORTFOLIO_URL } from './resume-document.ts';

const iconRoots = [new URL('email-icons/', PORTFOLIO_URL).href, 'https://thehandsomestnerd.com/email-icons/'];

/** Embed only our own icons, including URLs retained in older email drafts. */
export function inlineEmailIcons(html: string, images: Readonly<Record<string, string>>): string {
  return html.replace(/\bsrc="(https:\/\/[^"\s]+\/email-icons\/([a-z0-9-]+)\.png)"/g, (attribute, url: string, name: string) => {
    if (!iconRoots.some(root => url === `${root}${name}.png`)) return attribute;
    const image = images[`../assets/mail-icons/${name}.png`];
    return image ? `src="${image}"` : attribute;
  });
}
