export const providerIcon = (key: string) => {
  switch (key) {
    case "dtdc":
      return "📦";
    case "delh":
    case "delhivery":
      return "🚚";
    case "xb":
    case "xpressbees":
      return "🐝";
    case "aramax":
      return "✈️";
    default:
      return "📍";
  }
};