import dayjs from "dayjs";

/* ---------------------------------------------------
   1️⃣ DELIVERY DETECTION (Bulletproof)
--------------------------------------------------- */

export function isDelivered(status?: string | null): boolean {
  if (!status) return false;

  const s = status.trim().toLowerCase();

  // Exclude misleading statuses
  if (s.includes("attempt")) return false; // Delivered Attempted ≠ Delivered
  if (s.includes("not delivered")) return false;

  // Strong positive checks
  return (
    s === "delivered" ||
    s.startsWith("delivered") ||             // Delivered On / Delivered Successfully
    s.endsWith(" delivered") ||
    (s.includes("delivered") && !s.includes("attempt"))
  );
}

/* ---------------------------------------------------
   2️⃣ TAT RULE ENGINE
--------------------------------------------------- */

// 4-day TAT → Warning 5, Critical 6, Sensitive 7
const TAT_4D = ["M", "X", "V", "7X", "7V"];

// 6-day TAT → Warning 7, Critical 8, Sensitive 9
const TAT_6D = ["D", "7D", "I"];

// Default rule = 5 days
function resolveTATSeriesRule(awb: string): number {
  if (!awb) return 5;

  // first 2 chars cover 7X, 7D, 7V etc
  const prefix2 = awb.substring(0, 2).toUpperCase();
  if (TAT_4D.includes(prefix2)) return 4;
  if (TAT_6D.includes(prefix2)) return 6;

  // fallback to single letter groups
  const prefix1 = awb.charAt(0).toUpperCase();
  if (TAT_4D.includes(prefix1)) return 4;
  if (TAT_6D.includes(prefix1)) return 6;

  return 5;
}

/**
 * computeTAT()
 * - ALWAYS returns: On Time | Warning | Critical | Sensitive | Delivered
 */
export function computeTAT(awb: string, bookedOn?: string | null, lastStatus?: string | null) {
  if (isDelivered(lastStatus)) return "Delivered";
  if (!bookedOn) return "On Time";

  const days = dayjs().diff(dayjs(bookedOn), "day");
  const rule = resolveTATSeriesRule(awb);

  if (days >= rule + 3) return "Sensitive";
  if (days >= rule + 2) return "Critical";
  if (days >= rule + 1) return "Warning";
  return "On Time";
}

/* ---------------------------------------------------
   3️⃣ MOVEMENT STATUS ENGINE
--------------------------------------------------- */

/**
 * computeMovement()
 * - Uses last tracking event timestamp
 * - Thresholds:
 *   - 24 hrs → Warning
 *   - 48 hrs → Critical
 *   - 72 hrs → Sensitive
 */
export function computeMovement(lastEventDate?: string | null, lastEventTime?: string | null, lastStatus?: string | null) {
  if (isDelivered(lastStatus)) return "Delivered";

  if (!lastEventDate) return "On Time";

  const ts = new Date(`${lastEventDate}T${lastEventTime ?? "00:00:00"}`).getTime();
  const hours = (Date.now() - ts) / (1000 * 60 * 60);

  if (hours >= 72) return "Sensitive";
  if (hours >= 48) return "Critical";
  if (hours >= 24) return "Warning";
  return "On Time";
}

/* ---------------------------------------------------
   4️⃣ BADGE RENDERERS (Optional)
--------------------------------------------------- */

export function tatBadge(tat: string) {
  const t = tat.toLowerCase();

  if (t === "delivered")
    return "Delivered";

  if (t === "sensitive")
    return "Sensitive";

  if (t === "critical")
    return "Critical";

  if (t === "warning")
    return "Warning";

  return "On Time";
}

export function movementBadge(mov: string) {
  const m = mov.toLowerCase();

  if (m === "delivered")
    return "Delivered";

  if (m === "sensitive")
    return "Sensitive";

  if (m === "critical")
    return "Critical";

  if (m === "warning")
    return "Warning";

  return "On Time";
}