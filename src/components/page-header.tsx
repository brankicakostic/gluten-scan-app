import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: ReactNode; // Changed to ReactNode to allow components
  icon?: LucideIcon;
}

export function PageHeader({ title, description, icon: Icon }: PageHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-1">
        {Icon && <Icon className="h-7 w-7 text-primary" />}
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      </div>
      {description && <div className="text-muted-foreground">{description}</div>}
    </div>
  );
}
