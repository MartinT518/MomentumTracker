import { Sidebar } from "@/components/common/sidebar";
import { MobileMenu } from "@/components/common/mobile-menu";

export default function GoalsPage() {
  return (
    <div className="flex h-screen max-w-full overflow-hidden">
      <Sidebar />
      <MobileMenu />

      <main className="flex-1 overflow-y-auto bg-neutral-lighter pt-0 md:pt-4 pb-16 md:pb-4 px-4 md:px-6">
        {/* For mobile view padding to account for fixed header */}
        <div className="md:hidden pt-20"></div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold font-heading text-neutral-darker">Goals</h1>
            <p className="text-neutral-medium mt-1">Set and track your running goals</p>
          </div>
        </div>

        {/* Goals Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold mb-2">This page is under development</h3>
            <p className="text-neutral-medium">Goal setting and tracking will be available soon.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
