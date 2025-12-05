"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });

    const json = await res.json();
    setLoading(false);

    if (json.ok) {
      toast.success("Logged in");

      if (json.user.role === "super_ admin"){
        router.push("/admin");
      } 
      else{
        router.push("/client");
      } 
    } else {
      toast.error(json.error || "Login failed");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient from-gray-50 to-gray-200 p-4">
      <div className="w-full max-w-md bg-white shadow-xl rounded-2xl p-8 border border-gray-100">
        
        {/* Logo / System Title */}
        <h1 className="text-3xl font-bold text-center mb-2">
          Courier Management System <span className="text-gray-600">(VIS)</span>
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Please enter your credentials to continue.
        </p>

        {/* Form */}
        <form onSubmit={submit} className="space-y-5">
          <div>
            <label className="text-sm font-medium text-gray-700">Username</label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="mt-1"
            />
          </div>

          <Button
            type="submit"
            className="w-full py-2 text-[15px] font-semibold"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} VIS Logistics — All Rights Reserved
        </div>
      </div>
    </div>
  );
}
