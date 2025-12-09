export function statusBadgeUI(status?: string | null) {
  if (!status)
    return (
      <span className="px-3 py-1 text-sm rounded bg-gray-200 text-gray-700">
        -
      </span>
    );

  const s = status.trim().toLowerCase();

  // ---------- Strict matching first ----------
  if (s === "delivered")
    return <span className="px-3 py-1 text-sm rounded bg-green-200 text-green-800">
      Delivered
    </span>;

  if (s === "rto" || s === "return to origin")
    return <span className="px-3 py-1 text-sm rounded bg-red-200 text-red-800">
      RTO
    </span>;

  if (s === "in transit")
    return <span className="px-3 py-1 text-sm rounded bg-yellow-200 text-yellow-800">
      In Transit
    </span>;

  if (s === "out for delivery")
    return <span className="px-3 py-1 text-sm rounded bg-blue-200 text-blue-800">
      Out For Delivery
    </span>;

  if (s === "received at delivery centre")
    return <span className="px-3 py-1 text-sm rounded bg-purple-200 text-purple-800">
      Received at Delivery Centre
    </span>;

  if (s === "reached at destination")
    return <span className="px-3 py-1 text-sm rounded bg-orange-200 text-orange-800">
      Reached at Destination
    </span>;

  if (s === "weekly off")
    return <span className="px-3 py-1 text-sm rounded bg-gray-300 text-gray-800">
      Weekly Off
    </span>;

  if (s === "undelivered")
    return <span className="px-3 py-1 text-sm rounded bg-rose-200 text-rose-800">
      Undelivered
    </span>;

  if (s === "pending")
    return <span className="px-3 py-1 text-sm rounded bg-amber-200 text-amber-900">
      Pending
    </span>;

  // ---------- Default fallback ----------
  return (
    <span className="px-3 py-1 text-sm rounded bg-yellow-100 text-yellow-700">
      {status}
    </span>
  );
}