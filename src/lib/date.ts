export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function formatGermanDate(value: string) {
  return new Intl.DateTimeFormat("de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(`${value}T12:00:00`));
}
