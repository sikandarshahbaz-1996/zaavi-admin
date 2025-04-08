import { NextResponse } from 'next/server';

export async function POST(req) {
  const { username, password } = await req.json();

  if (
    username === process.env.BASIC_AUTH_USERNAME &&
    password === process.env.BASIC_AUTH_PASSWORD
  ) {
    const res = NextResponse.json({ message: "Logged in successfully" });

    res.cookies.set('session', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24, // 1 day
      path: '/',
    });

    return res;
  }

  return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
}
