import React, { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  rightContent?: ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  icon,
  rightContent,
}) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0 pb-4 mb-4 border-b">
      <div className="flex items-center space-x-3">
        {icon && (
          <div className="p-2 rounded-md bg-primary/10 text-primary">
            {icon}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground max-w-2xl">
              {description}
            </p>
          )}
        </div>
      </div>
      {rightContent && (
        <div className="flex items-center space-x-2 mt-2 sm:mt-0">
          {rightContent}
        </div>
      )}
    </div>
  );
};