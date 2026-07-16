import DashboardPlayground from "@/components/dashboard/DashboardPlayground";

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-stone-50">
        Generate a site
      </h1>
      <p className="mt-2 max-w-2xl text-stone-400">
        Describe your business and Empyr will draft a brand-ready layout for
        you. Preview updates live as soon as generation finishes.
      </p>

      <div id="site-generator-playground" className="mt-8">
        <DashboardPlayground />
      </div>
    </div>
  );
}
