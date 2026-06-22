export function getTodayDateIST(): string {
  // IST is UTC+5:30
  const d = new Date();
  d.setMinutes(d.getMinutes() + 330);
  const dateStr = d.toISOString().split("T")[0];
  
  // Cap the date at the final day of the competition (June 21, 2026)
  // so the dashboard doesn't empty out after the event ends.
  if (dateStr > "2026-06-21") {
    return "2026-06-21";
  }
  return dateStr;
}
