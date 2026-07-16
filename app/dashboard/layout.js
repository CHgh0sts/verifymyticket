import DashboardNav from "@/components/DashboardNav";

export default function DashboardLayout({ children }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row lg:gap-10">
      <div className="flex items-center justify-between lg:hidden">
        <a href="/" className="text-lg font-semibold tracking-tight">
          Verify<span className="text-[var(--accent)]">My</span>Ticket
        </a>
      </div>
      <DashboardNav />
      <main className="min-w-0 flex-1 pb-12">{children}</main>
    </div>
  );
}
