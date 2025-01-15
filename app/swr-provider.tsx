'use client';

import { SWRConfig } from 'swr';

export const SWRProvider = ({ children }) => {
  return (
    <SWRConfig
      value={{
        refreshInterval: process.env.NODE_ENV === "development" ? 120000 : 1000,
        fetcher: (url) => fetch(url).then((res) => res.json())
      }}
    >
      {children}
    </SWRConfig>
  )
};
