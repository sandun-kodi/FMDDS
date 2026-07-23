import React, { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import Breadcrumbs from '../common/Breadcrumbs';
import Footer from './Footer';

const Layout = ({ children }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      backgroundColor: 'var(--surface-50, #f8fafc)',
      color: 'var(--text-main, #0f172a)'
    }}>
      <Header onToggleSidebar={() => setIsSidebarCollapsed(prev => !prev)} />

      <div style={{ display: 'flex', flex: 1 }}>
        <Sidebar isCollapsed={isSidebarCollapsed} />

        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
          <Breadcrumbs />

          <main style={{
            flex: 1,
            padding: '1.5rem',
            overflowY: 'auto'
          }}>
            {children}
          </main>

          <Footer />
        </div>
      </div>
    </div>
  );
};

export default Layout;
