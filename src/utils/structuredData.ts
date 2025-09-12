import { metaConfig } from '@/config/environment';

/**
 * Structured data generators for better SEO
 */

export function generateWebsiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Pocket Banker",
    "description": metaConfig.description,
    "url": metaConfig.canonical(''),
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${metaConfig.canonical('')}/search?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  };
}

export function generateSoftwareApplicationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Pocket Banker",
    "description": metaConfig.description,
    "url": metaConfig.canonical(''),
    "applicationCategory": "FinanceApplication",
    "operatingSystem": "Web Browser",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "author": {
      "@type": "Organization",
      "name": "Pocket Banker"
    },
    "featureList": [
      "AI-powered budgeting",
      "Automated transaction tracking",
      "Financial goal setting",
      "Bank account integration",
      "Spending insights and analytics",
      "Bill reminders and management"
    ]
  };
}

export function generateOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Pocket Banker",
    "description": "AI-powered personal finance management platform",
    "url": metaConfig.canonical(''),
    "logo": `${metaConfig.canonical('')}/og-image.png`,
    "foundingDate": "2024",
    "sameAs": [
      metaConfig.twitterHandle ? `https://twitter.com/${metaConfig.twitterHandle.replace('@', '')}` : ''
    ].filter(Boolean)
  };
}

export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": metaConfig.canonical(item.url)
    }))
  };
}

export function generateFAQSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };
}