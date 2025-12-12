"use client";

import { useState } from "react";
import {
  RefreshCw,
  Calendar,
  RotateCcw,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

export default function NDRPage() {
  const [awb, setAwb] = useState("");
  const [action, setAction] = useState("reattempt");
  const [date, setDate] = useState("");
  const [remarks, setRemarks] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  function getActionName() {
    if (action === "reattempt") return "Reattempt Delivery";
    if (action === "reschedule") return "Pickup Reschedule";
    if (action === "rto") return "Return to Sender";
  }

  async function submitNdr() {
    setLoading(true);
    const payload: any = { awb, action, remarks };
    if (action === "reschedule") payload.date = date;

    const r = await fetch("/api/admin/delhivery/ndr", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const j = await r.json();
    setResult(j);
    setLoading(false);
    setConfirmOpen(false);
  }

  const canSubmit = awb && action && (action !== "reschedule" || date);

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold tracking-tight">Delhivery – NDR Management</h1>

      {/* Main Card */}
      <div className="p-6 bg-white border rounded-xl shadow-sm space-y-5">

        {/* AWB Input */}
        <div>
          <label className="font-medium">AWB Number</label>
          <input
            className="input mt-1 w-full p-3 border rounded-lg"
            placeholder="Enter AWB Number"
            value={awb}
            onChange={(e) => setAwb(e.target.value)}
          />
        </div>

        {/* Action Selector */}
        <div>
          <label className="font-medium">Action</label>
          <select
            className="input mt-1 w-full p-3 border rounded-lg"
            value={action}
            onChange={(e) => setAction(e.target.value)}
          >
            <option value="reattempt">Reattempt Delivery</option>
            <option value="reschedule">Pickup Reschedule</option>
            <option value="rto">Return to Sender (RTO)</option>
          </select>
        </div>

        {/* Additional Fields */}
        {action === "reschedule" && (
          <div>
            <label className="font-medium flex items-center gap-2">
              <Calendar size={15} /> New Delivery Date
            </label>
            <input
              type="date"
              className="input mt-1 w-full p-3 border rounded-lg"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        )}

        <div>
          <label className="font-medium">Remarks (optional)</label>
          <textarea
            className="input mt-1 w-full p-3 border rounded-lg"
            placeholder="Reason or remark for this action"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          ></textarea>
        </div>

        {/* Submit Button */}
        <button
          disabled={!canSubmit || loading}
          onClick={() => setConfirmOpen(true)}
          className="px-5 py-3 bg-black text-white rounded-lg hover:bg-neutral-800 disabled:opacity-50 flex items-center gap-2"
        >
          <RefreshCw size={16} />
          {loading ? "Submitting…" : "Submit NDR Action"}
        </button>
      </div>

      {/* Result Panel */}
      {result && (
        <div className="p-5 bg-gray-50 border rounded-xl shadow-sm">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <CheckCircle className="text-green-600" size={18} />
            NDR Response
          </h2>
          <pre className="bg-white p-4 rounded-lg mt-3 text-sm border overflow-auto max-h-96">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-[380px] shadow-lg space-y-4">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle size={20} />
              <h3 className="text-lg font-semibold">Confirm Action</h3>
            </div>

            <p className="text-sm text-gray-700 leading-relaxed">
              You are about to apply <strong>{getActionName()}</strong> on AWB
              <br />
              <span className="font-mono">{awb}</span>
              <br />
              Are you sure you want to proceed?
            </p>

            <div className="flex justify-end gap-3 pt-3">
              <button
                onClick={() => setConfirmOpen(false)}
                className="px-4 py-2 border rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={submitNdr}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
              >
                <RotateCcw size={16} />
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}