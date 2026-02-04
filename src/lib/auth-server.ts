import { cookies } from "next/headers";

export interface AuthSession {
  userId: string;
  email: string;
  role: string;
  fullName: string;
}

export async function getAuthSession(): Promise<AuthSession | null> {
  try {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get("caveris_auth");

    if (!authCookie?.value) {
      return null;
    }

    // Decode and parse the cookie
    const decodedValue = decodeURIComponent(authCookie.value);
    const session = JSON.parse(decodedValue) as AuthSession;

    return session;
  } catch (error) {
    console.error("Error parsing auth session cookie:", error);
    return null;
  }
}
