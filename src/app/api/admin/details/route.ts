import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/db/postgres";
import { consignments, trackingEvents } from "@/app/db/schema";
import { eq, asc, desc } from "drizzle-orm";

/* ----------------- Helpers (UNCHANGED) ----------------- */

function toIsoDateOrNull(v: any): string | null {
  if (!v) return null;
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "string") {
    if (v.includes(" ")) return new Date(v.replace(" ", "T")).toISOString();
    return new Date(v).toISOString();
  }
  return null;
}

function parseDateOnlyToISO(v: any): string | null {
  if (!v) return null;
  if (typeof v === "string") return new Date(v).toISOString().slice(0, 10);
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return null;
}

function safeString(v: any) {
  return v == null ? "" : String(v);
}

/* ----------------- TAT + Movement (LOGIC UNCHANGED) ----------------- */

const TAT_RULES: Record<string, number> = {
  D: 3,
  M: 5,
  N: 7,
  I: 10,
};

function computeTAT(bookedOn: string | null, awb?: string) {
  if (!bookedOn) return "Unknown";
  const prefix = (awb?.charAt(0) ?? "").toUpperCase();
  const allowed = TAT_RULES[prefix] ?? 5;

  const bookDate = new Date(bookedOn);
  if (isNaN(bookDate.getTime())) return "Unknown";

  const ageDays = Math.floor(
    (Date.now() - bookDate.getTime()) / (24 * 60 * 60 * 1000)
  );

  if (ageDays > allowed + 3) return "Very Critical";
  if (ageDays > allowed) return "Critical";
  if (ageDays >= Math.max(0, allowed - 1)) return "Warning";
  return "On Time";
}

function computeMovementFromTimeline(timeline: any[]) {
  if (!timeline.length) return "Unknown";

  const last = timeline[timeline.length - 1];
  const prev = timeline.length > 1 ? timeline[timeline.length - 2] : null;

  const lastTime = last.event_time
    ? new Date(last.event_time)
    : null;

  if (!lastTime || isNaN(lastTime.getTime())) return "Unknown";

  const hours =
    (Date.now() - lastTime.getTime()) / (1000 * 60 * 60);

  if (prev && prev.location && last.location && prev.location === last.location) {
    if (hours >= 72) return "No Movement (72+ hrs)";
    if (hours >= 48) return "No Movement (48 hrs)";
    if (hours >= 24) return "No Movement (24 hrs)";
    return "No Movement";
  }

  if (hours >= 72) return "Stuck (72+ hrs)";
  if (hours >= 48) return "Slow (48 hrs)";
  if (hours >= 24) return "Slow (24 hrs)";

  return "On Time";
}

/* ----------------- Route ----------------- */

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const awb = searchParams.get("awb");
    const clientId = searchParams.get("clientId");

    if (!awb) {
      return NextResponse.json(
        { success: false, message: "awb is required" },
        { status: 400 }
      );
    }

    // 1️⃣ Consignment
    const [c] = await db
      .select()
      .from(consignments)
      .where(eq(consignments.awb, awb))
      .limit(1);

    if (!c) {
      return NextResponse.json(
        { success: false, message: "No consignment found" },
        { status: 404 }
      );
    }

    if (clientId && Number(clientId) !== c.client_id) {
      return NextResponse.json(
        { success: false, message: "AWB does not belong to client" },
        { status: 403 }
      );
    }

    // 2️⃣ Timeline (FIXED JOIN)
    const timelineRows = await db
      .select()
      .from(trackingEvents)
      .where(eq(trackingEvents.consignment_id, c.id))
      .orderBy(asc(trackingEvents.event_time));

    // 4️⃣ Summary
    const summary = {
      awb: c.awb,
      origin: c.origin ?? null,
      destination: c.destination ?? null,
      bookedOn: parseDateOnlyToISO(c.booked_at),
      lastUpdatedOn: toIsoDateOrNull(c.last_status_at),
      currentStatus: c.current_status ?? null,
    };

    // Timeline mapping (NEW SHAPE → OLD CONSUMER LOGIC)
    const cleanTimeline = timelineRows.map((t) => ({
      status: safeString(t.status),
      event_time: t.event_time,
      location: safeString(t.location),
      remarks: safeString(t.remarks),
    }));

    const lastEvent = cleanTimeline.at(-1) ?? null;

    const currentStatus = {
      status: summary.currentStatus,
      date: lastEvent?.event_time ?? summary.bookedOn,
      time: null,
      location: lastEvent?.location ?? summary.origin,
      remarks: lastEvent?.remarks ?? null,
    };

    const tat = computeTAT(summary.bookedOn, c.awb);
    const movement = computeMovementFromTimeline(cleanTimeline);

    const reports = {
      delivered: (c.current_status ?? "").toLowerCase().includes("deliver"),
      outForDelivery: (c.current_status ?? "").toLowerCase().includes("out for delivery"),
      rto: (c.current_status ?? "").toLowerCase().includes("rto"),
      delayed:
        !!c.last_status_at &&
        new Date(c.last_status_at).getTime() <
          Date.now() - 3 * 24 * 60 * 60 * 1000,
      lastScanLocation: lastEvent?.location ?? summary.origin,
    };

    return NextResponse.json({
      success: true,
      awb,
      summary,
      currentStatus,
      tat,
      movement,
      timeline: cleanTimeline,
      reports,
      consignment: c,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message ?? String(err) },
      { status: 500 }
    );
  }
}
