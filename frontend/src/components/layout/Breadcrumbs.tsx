import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
  return (
    <nav className="flex items-center space-x-2 text-xs text-slate-500 font-medium">
      <Link to="/dashboard" className="hover:text-navy-900 text-slate-600 transition-colors">
        Console
      </Link>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <React.Fragment key={index}>
            <ChevronRight className="h-3 w-3 text-slate-400 shrink-0" />
            {isLast || !item.path ? (
              <span className="font-semibold text-navy-950 truncate max-w-[240px]">
                {item.label}
              </span>
            ) : (
              <Link
                to={item.path}
                className="hover:text-navy-900 text-slate-600 transition-colors truncate max-w-[180px]"
              >
                {item.label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

