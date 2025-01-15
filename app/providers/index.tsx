"use client"

import React from "react";
import { SessionProvider } from 'next-auth/react';
import { UserProvider } from "../context/UserContext"

type Props = {
  children?: React.ReactNode;
};

export function MyAppProvider({ children }: Props) {
  return (
    <SessionProvider>
      <UserProvider>
        {children}
      </UserProvider>
    </SessionProvider>
  )
}
