
import { NextRequest, NextResponse } from 'next/server';

const locales = ['sr', 'en'];
const defaultLocale = 'sr';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Prevent internationalized routing for static files.
  // This checks if the path seems to be for a file (e.g., contains a dot).
  if (pathname.includes('.')) {
    return NextResponse.next();
  }

  // Check if there is any supported locale in the pathname
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith('/' + locale + '/') || pathname === ('/' + locale)
  );

  if (pathnameHasLocale) {
    return NextResponse.next();
  }

  // Redirect if there is no locale.
  // The locale is extracted from the Accept-Language header or defaults to 'sr'.
  // Try to get locale from cookie first, then header
  let locale = request.cookies.get('NEXT_LOCALE')?.value || defaultLocale;

  if (!locales.includes(locale)) {
     // Fallback to default if stored cookie locale is invalid
    locale = defaultLocale;
  }
  
  // If you want to detect from header (less explicit, might not always be desired):
  // const acceptLanguage = request.headers.get('accept-language');
  // if (acceptLanguage) {
  //   const headerLang = acceptLanguage.split(',')[0].split('-')[0];
  //   if (locales.includes(headerLang)) {
  //     locale = headerLang;
  //   }
  // }

  request.nextUrl.pathname = `/${locale}${pathname.startsWith('/') ? '' : '/'}${pathname}`;
  
  // Clone the URL to ensure headers are preserved for the redirect
  const newUrl = request.nextUrl.clone();

  return NextResponse.redirect(newUrl);
}

export const config = {
  matcher: [
    // Skip all internal paths (_next, images, api)
    '/((?!_next/static|_next/image|api|images|assets|favicon.ico|sw.js).*)'
  ],
};
