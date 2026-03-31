import Sidebar from './Sidebar';
import Header from './Header';

export default function AppShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#f5f6fa' }}>
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto px-6 pt-6 pb-2 mesh-bg animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
