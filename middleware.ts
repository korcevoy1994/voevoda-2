import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';

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

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);

  const { isAdmin } = session;
  const { pathname } = req.nextUrl;

  // Если пользователь не авторизован и пытается зайти в админ-панель (не на страницу входа)
  if (!isAdmin && pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    return NextResponse.redirect(new URL('/admin/login', req.url));
  }

  // Если пользователь авторизован и пытается зайти на страницу входа
  if (isAdmin && pathname.startsWith('/admin/login')) {
    return NextResponse.redirect(new URL('/admin/scanner', req.url));
  }
  
  return res;
}

// Указываем, к каким путям применять этот middleware
export const config = {
  matcher: '/admin/:path*',
}; 