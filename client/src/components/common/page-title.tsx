interface PageTitleProps {
  title: string;
  description?: string;
}

export function PageTitle({ title, description }: PageTitleProps) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-neutral-darker">{title}</h1>
      {description && <p className="text-sm text-neutral-dark mt-1">{description}</p>}
    </div>
  );
}