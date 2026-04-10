'use client';

import { useEffect } from 'react';
import posthog from 'posthog-js';

export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window !== 'undefined' && !posthog.__loaded) {
      posthog.init('phc_jWQXyGj2q1jvopQVU3NzJOrAeU3sjnAJUyY5bWtURlk', {
        api_host: 'https://eu.posthog.com',
        capture_pageview: true,
        loaded: (ph) => {
          console.log('PostHog loaded', ph);
        }
      });
    }
  }, []);

  return <>{children}</>;
}
