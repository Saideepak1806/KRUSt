import React from 'react';
import { 
  Code, Database, Palette, Shield, Briefcase, Server, LineChart, Compass, LucideProps 
} from 'lucide-react';

const ICON_MAP: Record<string, React.ComponentType<LucideProps>> = {
  Code,
  Database,
  Palette,
  Shield,
  Briefcase,
  Server,
  LineChart,
  Compass
};

/**
 * Returns a suitable Lucide icon name for a given career/domain name.
 */
export function getDomainIconName(name: string): string {
  const lowercaseName = name.toLowerCase();
  
  if (lowercaseName.includes('software') || lowercaseName.includes('engineer') || lowercaseName.includes('developer') || lowercaseName.includes('code') || lowercaseName.includes('programming')) {
    if (lowercaseName.includes('cloud') || lowercaseName.includes('infrastructure')) {
      return 'Server';
    }
    return 'Code';
  }
  if (lowercaseName.includes('data') || lowercaseName.includes('analyst') || lowercaseName.includes('scientist') || lowercaseName.includes('analytics') || lowercaseName.includes('sql') || lowercaseName.includes('database')) {
    return 'Database';
  }
  if (lowercaseName.includes('design') || lowercaseName.includes('ui') || lowercaseName.includes('ux') || lowercaseName.includes('creative') || lowercaseName.includes('product vision') || lowercaseName.includes('artist') || lowercaseName.includes('palette')) {
    return 'Palette';
  }
  if (lowercaseName.includes('security') || lowercaseName.includes('cyber') || lowercaseName.includes('threat') || lowercaseName.includes('protect')) {
    return 'Shield';
  }
  if (lowercaseName.includes('product manager') || lowercaseName.includes('pm') || lowercaseName.includes('project') || lowercaseName.includes('agile') || lowercaseName.includes('scrum') || lowercaseName.includes('management') || lowercaseName.includes('strategy')) {
    return 'Briefcase';
  }
  if (lowercaseName.includes('cloud') || lowercaseName.includes('infrastructure') || lowercaseName.includes('devops')) {
    return 'Server';
  }
  if (lowercaseName.includes('finance') || lowercaseName.includes('financial') || lowercaseName.includes('investment') || lowercaseName.includes('money') || lowercaseName.includes('portfolio')) {
    return 'LineChart';
  }
  if (lowercaseName.includes('marketing') || lowercaseName.includes('growth') || lowercaseName.includes('seo') || lowercaseName.includes('advertising') || lowercaseName.includes('sales')) {
    return 'LineChart';
  }
  
  return 'Compass';
}

/**
 * Resolves an icon name to its Lucide Component.
 */
export function getDomainIconComponent(iconName: string | undefined): React.ComponentType<LucideProps> {
  if (!iconName) return Compass;
  return ICON_MAP[iconName] || Compass;
}
