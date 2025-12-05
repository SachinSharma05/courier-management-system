"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

export default function RegisterPage() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    company_name: "",
    contact_person: "",
    phone: "",
  });

  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(form),
    });

    const json = await res.json();
    setLoading(false);

    if (json.ok) {
      toast.success("Account created successfully!");
      router.push("/auth/login");
    } else {
      toast.error(json.error || "Registration failed");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient from-gray-50 to-gray-200 p-4">
      <div className="w-full max-w-md bg-white shadow-xl rounded-2xl p-8 border border-gray-100">
        
        <h2 className="text-3xl font-bold text-center mb-2">Create an Account</h2>
        <p className="text-center text-gray-600 mb-8">
          Fill in the details below to get started.
        </p>

        <form onSubmit={submit} className="space-y-5">
          <div>
            <label className="text-sm text-gray-700 font-medium">Username</label>
            <Input
              placeholder="Enter username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm text-gray-700 font-medium">Email</label>
            <Input
              placeholder="Enter email address"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm text-gray-700 font-medium">Company Name</label>
            <Input
              placeholder="Enter company name"
              value={form.company_name}
              onChange={(e) => setForm({ ...form, company_name: e.target.value })}
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm text-gray-700 font-medium">Password</label>
            <Input
              placeholder="Enter password"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm text-gray-700 font-medium">Contact Person</label>
            <Input
              placeholder="Enter contact person name"
              value={form.contact_person}
              onChange={(e) => setForm({ ...form, contact_person: e.target.value })}
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm text-gray-700 font-medium">Phone</label>
            <Input
              placeholder="Enter phone number"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="mt-1"
            />
          </div>

          <Button
            type="submit"
            className="w-full py-2 text-[15px] font-semibold"
            disabled={loading}
          >
            {loading ? "Creating account..." : "Create account"}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          Already have an account?{" "}
          <a
            href="/auth/login"
            className="text-black font-medium hover:underline"
          >
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
