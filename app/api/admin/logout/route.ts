import { NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';

interface SessionData {
  isAdmin: boolean;
}

const sessionOptions = {
  password: process.env.SECRET_COOKIE_PASSWORD!,
  cookieName: 'admin-session',
};

export async function POST() {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);
  session.destroy();
  return NextResponse.json({ ok: true });
} 