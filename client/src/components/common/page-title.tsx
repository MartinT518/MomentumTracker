interface PageTitleProps {
  title: string;
  description?: string;
}

export function PageTitle({ title, description }: PageTitleProps) {
  return (
    <div className="mb-6 -ml-4">
      <h1 className="text-2xl font-bold text-white drop-shadow-sm">{title}</h1>
      {description && <p className="text-sm text-white/80 mt-1 drop-shadow-sm">{description}</p>}
    </div>
  );
}