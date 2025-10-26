import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const REALM = "RapportBuilder";

function resolveCredentials() {
  const username = process.env.BASIC_AUTH_USER ?? "rapport";
  const password = process.env.BASIC_AUTH_PASSWORD ?? "builder9000";
  return { username, password };
}

export function middleware(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  if (authorization?.startsWith("Basic ")) {
    try {
      const encoded = authorization.slice(6).trim();
      const decoded = atob(encoded);
      const [candidateUser, ...rest] = decoded.split(":");
      const candidatePassword = rest.join(":");
      const { username, password } = resolveCredentials();
      if (candidateUser === username && candidatePassword === password) {
        return NextResponse.next();
      }
    } catch (error) {
      console.warn("Invalid basic auth header:", error);
    }
  }

  const response = new NextResponse("Authentication required", { status: 401 });
  response.headers.set("WWW-Authenticate", `Basic realm="${REALM}", charset="UTF-8"`);
  return response;
}

export const config = {
  matcher: "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
};
