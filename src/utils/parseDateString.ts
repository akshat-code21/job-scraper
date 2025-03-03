export default function parseDateString(dateString: string) {
  if (!dateString) return null;
  const currentDate = new Date();
  const daysAgoMatch = dateString.match(/(\d+)\s*days?\s*ago/i);
  if (daysAgoMatch) {
    const daysAgo = parseInt(daysAgoMatch[1]);
    const date = new Date(currentDate);
    date.setDate(currentDate.getDate() - daysAgo);
    return date;
  }
  return null;
}
