import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export function AppLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#F1F3F6] font-poppins text-[#111]">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="mx-auto max-w-[1600px] h-full flex flex-col">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
