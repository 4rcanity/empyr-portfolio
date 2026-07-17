import { NextResponse, type NextRequest } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/api/generate(.*)",
]);

const secretKey = process.env.CLERK_SECRET_KEY;
const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const hasClerk = Boolean(
  secretKey &&
    publishableKey &&
    !publishableKey.includes("placeholder") &&
    !secretKey.includes("placeholder"),
);

const clerkHandler = clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

function fallbackMiddleware(req: NextRequest) {
  if (isProtectedRoute(req)) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }
  return NextResponse.next();
}

export default hasClerk ? clerkHandler : fallbackMiddleware;

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
