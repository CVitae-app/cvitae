export const getDotLevel = (level) => {
  if (level === undefined || level === null) return 0;

  if (typeof level === "number") {
    return Math.min(5, Math.max(0, level));
  }

  const normalized = level.toString().trim().toLowerCase();

  const levelMap = {
    // English
    beginner: 1,
    fair: 2,
    good: 3,
    "very good": 4,
    verygood: 4,
    fluent: 5,
    "native speaker": 5,
    native: 5,
    excellent: 5,

    // Dutch
    redelijk: 2,
    goed: 3,
    "zeer goed": 4,
    uitstekend: 5,
    vloeiend: 4,
    moedertaal: 5,
  };

  return levelMap[normalized] || Number(normalized) || 0;
};
