export default function parseDateString(dateString: string): Date | null {
  if (!dateString) return null;
  
  const currentDate = new Date();
  
  // Case 1: Microsoft format ("today", "2 days ago")
  const todayMatch = /today/i.test(dateString);
  if (todayMatch) {
    return currentDate;
  }
  
  const daysAgoMatch = dateString.match(/(\d+)\s*days?\s*ago/i);
  if (daysAgoMatch) {
    const daysAgo = parseInt(daysAgoMatch[1]);
    const date = new Date(currentDate);
    date.setDate(currentDate.getDate() - daysAgo);
    return date;
  }

  // Case 2: Amazon format ("M/D/YYYY")
  const amazonDateMatch = dateString.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (amazonDateMatch) {
    const [_, month, day, year] = amazonDateMatch;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }

  // Case 3: Google format (timestamp)
  if (!isNaN(Date.parse(dateString))) {
    return new Date(dateString);
  }

  return null;
}
