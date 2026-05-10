interface LastUpdatedProps {
  date: string;
  className?: string;
}

export default function LastUpdated({
  date,
  className = "",
}: LastUpdatedProps) {
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateString; // Return original string if parsing fails
    }
  };

  return (
    <p className={`text-[11px] uppercase tracking-[0.28em] text-foreground/50 ${className}`}>
      Last updated: <time dateTime={date}>{formatDate(date)}</time>
    </p>
  );
}
