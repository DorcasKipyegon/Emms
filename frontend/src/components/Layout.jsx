import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import AIChatWidget from './AIChatWidget';

export default function Layout({ children }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 overflow-hidden font-sans">
      <Sidebar isCollapsed={isSidebarCollapsed} />
      <div className="flex flex-col flex-1 overflow-hidden transition-all duration-300">
        <Header 
          toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
          isSidebarCollapsed={isSidebarCollapsed} 
        />
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
      <AIChatWidget />
    </div>
  );
}
