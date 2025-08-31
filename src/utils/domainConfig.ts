// Domain configuration for app vs website separation

export const DOMAINS = {
  APP: 'https://app.pocketbanker.app',
  WEBSITE: 'https://pocketbanker.app'
} as const;

// App routes (should be on app subdomain)
export const APP_ROUTES = [
  '/auth',
  '/dashboard', 
  '/budget',
  '/transactions',
  '/goals',
  '/account',
  '/demo',
  '/conversational-ai',
  '/shared-budget',
  '/confirm',
  '/reset-password',
  '/email-confirmation'
] as const;

// Website routes (should be on main domain)
export const WEBSITE_ROUTES = [
  '/',
  '/privacy',
  '/terms',
  '/for-institutions',
  '/for-nonprofits'
] as const;

export const isAppRoute = (pathname: string): boolean => {
  return APP_ROUTES.some(route => pathname.startsWith(route));
};

export const isWebsiteRoute = (pathname: string): boolean => {
  return WEBSITE_ROUTES.some(route => route === pathname);
};

export const getCorrectDomain = (pathname: string): string => {
  if (isAppRoute(pathname)) {
    return DOMAINS.APP;
  }
  return DOMAINS.WEBSITE;
};

export const shouldRedirectToDomain = (currentHost: string, pathname: string): string | null => {
  const correctDomain = getCorrectDomain(pathname);
  const currentDomain = `https://${currentHost}`;
  
  if (currentDomain !== correctDomain) {
    return `${correctDomain}${pathname}`;
  }
  
  return null;
};