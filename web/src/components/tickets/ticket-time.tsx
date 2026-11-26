const dateFormat = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Kolkata",
});

export function TicketTime({ date }: { date: Date }) {
  return (
    <time dateTime={date.toISOString()} className="text-[var(--muted)]">
      {dateFormat.format(date)} IST
    </time>
  );
}
