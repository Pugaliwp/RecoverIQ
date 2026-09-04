import React from 'react';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';
import { Outlet } from 'react-router-dom';

export function Layout() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col min-w-0">
        <TopNav />
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
