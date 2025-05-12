import { Sidebar } from "@/components/common/sidebar";
import { MobileMenu } from "@/components/common/mobile-menu";

export default function TrainingPlanPage() {
  return (
    <div className="flex h-screen max-w-full overflow-hidden">
      <Sidebar />
      <MobileMenu />

      <main className="flex-1 overflow-y-auto bg-neutral-lighter pt-0 md:pt-4 pb-16 md:pb-4 px-4 md:px-6">
        {/* For mobile view padding to account for fixed header */}
        <div className="md:hidden pt-20"></div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold font-heading text-neutral-darker">Training Plan</h1>
            <p className="text-neutral-medium mt-1">View and manage your personalized training schedule</p>
          </div>
        </div>

        {/* Training Plan Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold mb-2">This page is under development</h3>
            <p className="text-neutral-medium">Training plan content will be available soon.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
