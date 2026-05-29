import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

const isDevPreview = createRouteMatcher(["/dev-preview(.*)"]);
const isDemo = createRouteMatcher(["/demo(.*)"]);

const isPublicRoute = createRouteMatcher([
  "/",
  "/onboarding",
  "/welcome",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/admin(.*)",
  "/studio(.*)",
  "/dev-preview(.*)",
  "/demo(.*)",
  "/terms",
  "/privacy",
  "/api/invitations/validate",
  "/api/provider-code/validate",
]);

const clerkHandler = clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect({
      unauthenticatedUrl: new URL("/sign-in", req.url).toString(),
    });
  }

  const response = NextResponse.next();
  response.headers.set("x-pathname", req.nextUrl.pathname);
  return response;
});

export function proxy(req: NextRequest, evt: Parameters<typeof clerkHandler>[1]) {
  // Bypass Clerk entirely for dev-preview routes — the preview browser
  // cannot reach Clerk's external API and aborts the request.
  if (isDevPreview(req)) {
    const response = NextResponse.next();
    response.headers.set("x-pathname", req.nextUrl.pathname);
    return response;
  }

  // Bypass Clerk for demo routes — no auth required for exploratory demo
  if (isDemo(req)) {
    const response = NextResponse.next();
    response.headers.set("x-pathname", req.nextUrl.pathname);
    return response;
  }

  return clerkHandler(req, evt);
}

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
