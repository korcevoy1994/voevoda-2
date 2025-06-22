import { NextResponse } from 'next/server';
import { IronSession, getIronSession } from 'iron-session';
import { cookies } from 'next/headers';

// Определение структуры сессии
interface SessionData {
  isAdmin: boolean;
}

const sessionOptions = {
  password: process.env.SECRET_COOKIE_PASSWORD!,
  cookieName: 'admin-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
  },
};

export async function POST(request: Request) {
  const { username, password } = await request.json();

  const session = await getIronSession<SessionData>(cookies(), sessionOptions);

  if (
    username === process.env.ADMIN_USERNAME &&
    password === process.env.ADMIN_PASSWORD
  ) {
    session.isAdmin = true;
    await session.save();
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Неверные учетные данные' }, { status: 401 });
} 