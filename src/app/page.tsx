import { SidebarInset, SidebarRail } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/navigation/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { PageHeader } from '@/components/page-header';
import { FeatureCard } from '@/components/feature-card';
import { mainNavLinks } from '@/components/navigation/main-nav-links';
import { LayoutGrid } from 'lucide-react';

export default function HomePage() {
  const features = mainNavLinks.filter(link => link.href !== '/');

  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <SidebarRail />
      <SidebarInset>
        <SiteHeader />
        <main className="flex-1 p-6 md:p-8">
          <PageHeader 
            title="Welcome to Gluten Detective" 
            description="Your companion for navigating the world of gluten-free products."
            icon={LayoutGrid}
          />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <FeatureCard
                key={feature.href}
                title={feature.label}
                description={`Access the ${feature.label.toLowerCase()} feature to manage your gluten-free journey.`}
                href={feature.href}
                icon={feature.icon}
              />
            ))}
          </div>
        </main>
      </SidebarInset>
    </div>
  );
}
