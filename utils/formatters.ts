export function formatTags(values: string[] | string | null, fallback = '정보 없음') {
  const items = Array.isArray(values) ? values : (values ?? '').split(',');
  const cleaned = items.map(item => item.trim()).filter(Boolean);
  return cleaned.length ? cleaned.map(item => `#${item}`).join(' ') : fallback;
}
