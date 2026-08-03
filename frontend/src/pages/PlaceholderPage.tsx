interface PlaceholderPageProps {
  title: string;
}

export function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <section className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-6">
      <div>
        <p className="text-sm uppercase text-muted-foreground">Workspace module</p>
        <h1 className="mt-2 text-3xl font-semibold text-foreground">{title}</h1>
      </div>
    </section>
  );
}
