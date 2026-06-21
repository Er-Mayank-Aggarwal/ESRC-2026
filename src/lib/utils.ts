export function getTodayDateIST(): string {
  // IST is UTC+5:30
  const d = new Date();
  d.setMinutes(d.getMinutes() + 330);
  return d.toISOString().split("T")[0];
}
