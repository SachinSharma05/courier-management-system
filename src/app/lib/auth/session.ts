import type { SessionOptions } from "iron-session";

export const sessionOptions: SessionOptions = {
  cookieName: "cms_session",
  password: process.env.SESSION_SECRET || "8PlTcWW0807JfJGELH4tpzSKSLvGsdzH",

  cookieOptions: {
    secure: process.env.NODE_ENV === "production",  // REQUIRED FOR VERCEL
    sameSite: "lax",
    path: "/",                                      // REQUIRED so all routes receive it
  },
};
