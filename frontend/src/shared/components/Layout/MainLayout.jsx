import { useSelector } from 'react-redux';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function MainLayout({ children }) {
  const { sidebarOpen } = useSelector((s) => s.ui);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A] transition-colors duration-300">
      <Navbar />
      <Sidebar />
      <main className={`transition-all duration-300 pt-14 ${sidebarOpen ? 'lg:ml-56' : 'lg:ml-14'}`}>
        <div className="p-4 lg:p-6 min-h-[calc(100vh-3.5rem)]">
          {children}
        </div>
      </main>
    </div>
  );
}
