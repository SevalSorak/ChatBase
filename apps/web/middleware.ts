import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('accessToken')
  const { pathname } = request.nextUrl

  // Kimlik doğrulama gerektirmeyen public sayfalar
  const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password']

  // Eğer path public değilse ve token yoksa, login sayfasına yönlendir
  if (!publicPaths.some(path => pathname.startsWith(path)) && !token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Eğer kullanıcı zaten giriş yapmışsa ve login/register gibi sayfalara erişmeye çalışıyorsa
  // ana sayfaya yönlendir
  if (publicPaths.some(path => pathname.startsWith(path)) && token) {
    return NextResponse.redirect(new URL('/agents', request.url))
  }

  return NextResponse.next()
}

// Sadece aşağıdaki path'ler hariç tüm isteklerde middleware çalışır:
// - /api/*           → API route'ları
// - /_next/static/*  → Next.js statik dosyaları
// - /_next/image/*   → Next.js image optimizasyon dosyaları
// - /favicon.ico     → Favicon dosyası
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
} 