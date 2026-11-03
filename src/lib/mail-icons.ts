// Preview uses bundled PNG data; sent HTML points to the same assets on the portfolio.
const images = import.meta.glob<string>('../assets/mail-icons/*.png', { eager: true, query: '?inline', import: 'default' });
export function emailIconName(value: string): string { return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
export function previewEmailIcons(html: string): string {
  return html.replace(/https:\/\/thehandsomestnerd\.com\/email-icons\/([a-z0-9-]+)\.png/g, (url, name: string) => images[`../assets/mail-icons/${name}.png`] ?? url);
}
