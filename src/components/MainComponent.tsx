"use client";

import { SessionProvider } from 'next-auth/react';
import NavBar from './NavBar';

export default function MainComponent(props: any) {
  return (
    <>
      <SessionProvider>
        <div className="min-h-full">
          <NavBar />

          <main>
            <div className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
              {props.children}
            </div>
          </main>
        </div>
      </SessionProvider>
    </>
  );
}
