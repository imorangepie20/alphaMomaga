import "server-only";

import type { SessionData } from "@auth0/nextjs-auth0/types";
import { redirect } from "next/navigation";

import { auth0 } from "@/lib/auth0";

export async function requireSession(): Promise<SessionData> {
  const session = await auth0.getSession();

  if (!session) {
    redirect("/login");
  }

  return session;
}
