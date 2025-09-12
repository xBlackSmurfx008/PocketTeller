import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { metaConfig } from '@/config/environment';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  noIndex?: boolean;
  canonical?: string;
}

export function SEOHead({ 
  title = metaConfig.title,
  description = metaConfig.description,
  keywords = metaConfig.keywords,
  ogImage = metaConfig.ogImage,
  noIndex = false,
  canonical
}: SEOHeadProps) {
  const location = useLocation();
  const canonicalUrl = canonical || metaConfig.canonical(location.pathname);

  useEffect(() => {
    // Update document title
    document.title = title;

    // Update or create meta tags
    const updateMetaTag = (name: string, content: string, property?: string) => {
      const selector = property ? `meta[property="${property}"]` : `meta[name="${name}"]`;
      let element = document.querySelector(selector) as HTMLMetaElement;
      
      if (!element) {
        element = document.createElement('meta');
        if (property) {
          element.setAttribute('property', property);
        } else {
          element.setAttribute('name', name);
        }
        document.head.appendChild(element);
      }
      
      element.setAttribute('content', content);
    };

    // Update link tags
    const updateLinkTag = (rel: string, href: string) => {
      let element = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;
      
      if (!element) {
        element = document.createElement('link');
        element.setAttribute('rel', rel);
        document.head.appendChild(element);
      }
      
      element.setAttribute('href', href);
    };

    // Basic meta tags
    updateMetaTag('description', description);
    updateMetaTag('keywords', keywords);
    
    // Robots
    updateMetaTag('robots', noIndex ? 'noindex,nofollow' : 'index,follow');
    
    // Open Graph
    updateMetaTag('og:title', title, 'og:title');
    updateMetaTag('og:description', description, 'og:description');
    updateMetaTag('og:image', ogImage, 'og:image');
    updateMetaTag('og:url', canonicalUrl, 'og:url');
    updateMetaTag('og:type', 'website', 'og:type');
    updateMetaTag('og:site_name', 'Pocket Banker', 'og:site_name');
    
    // Twitter
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', title);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:image', ogImage);
    updateMetaTag('twitter:site', metaConfig.twitterHandle);
    
    // Canonical URL
    updateLinkTag('canonical', canonicalUrl);
    
    // Performance and security
    updateMetaTag('viewport', 'width=device-width,initial-scale=1');
    updateMetaTag('format-detection', 'telephone=no');
    
  }, [title, description, keywords, ogImage, canonicalUrl, noIndex]);

  return null; // This component doesn't render anything
}

// Pre-configured SEO components for common pages
export function HomeSEO() {
  return (
    <SEOHead 
      title="Pocket Banker - AI-Powered Personal Finance Management"
      description="Transform your financial future with AI-powered budgeting, smart transaction tracking, and personalized financial insights. Join thousands taking control of their finances."
    />
  );
}

export function InstitutionsSEO() {
  return (
    <SEOHead 
      title="Pocket Banker for Financial Institutions - White-Label Finance Platform"
      description="Empower your members with AI-powered personal finance tools. White-label solution with advanced analytics, custom branding, and enterprise-grade security."
      keywords="financial institutions, white-label finance, member engagement, banking platform, credit unions"
    />
  );
}

export function NonProfitsSEO() {
  return (
    <SEOHead 
      title="Pocket Banker for Non-Profits - Financial Literacy Programs"
      description="Empower communities with financial literacy through our comprehensive education platform. Custom programs, impact analytics, and mobile-first accessibility."
      keywords="financial literacy, non-profit programs, community development, financial education"
    />
  );
}

export function PrivacySEO() {
  return (
    <SEOHead 
      title="Privacy Policy - Pocket Banker"
      description="Learn how Pocket Banker protects your personal and financial data. Transparent privacy practices with bank-level security."
      noIndex={true}
    />
  );
}

export function TermsSEO() {
  return (
    <SEOHead 
      title="Terms of Service - Pocket Banker"
      description="Terms and conditions for using Pocket Banker's personal finance management platform."
      noIndex={true}
    />
  );
}