"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function DeleteProviderButton({ id, className = "" }: { id: number; className?: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  async function deleteProvider() {
    const res = await fetch(`/api/admin/providers/${id}/delete`, {
      method: "DELETE",
    });

    const json = await res.json();
    if (json.ok) {
      setOpen(false);
      router.refresh();
    } else {
      alert(json.error || "Failed to delete provider");
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-red-600 hover:text-red-800 flex items-center gap-1"
      >
        <Trash2 size={16} /> Delete
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded p-6 w-80 space-y-4 shadow-lg">
            <h2 className="text-lg font-semibold">Delete Provider?</h2>
            <p className="text-sm text-gray-600">
              This action cannot be undone. Are you sure you want to delete this provider?
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                onClick={deleteProvider}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
