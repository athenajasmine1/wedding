import { NextResponse } from "next/server";

export async function GET(req) {
  // Change "/" to any path later without reprinting the QR
  return NextResponse.redirect(new URL("/", req.url), 308);
}
