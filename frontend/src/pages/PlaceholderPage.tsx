interface PlaceholderPageProps {
  title: string;
}

export function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <section className="min-h-96 p-6">
      <div>
        <p className="text-sm uppercase text-muted-foreground">Workspace module</p>
        <h1 className="mt-2 text-3xl font-semibold text-foreground">{title}</h1>
      </div>
    </section>
  );
}
