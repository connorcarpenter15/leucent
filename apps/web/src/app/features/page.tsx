import Link from 'next/link';
import { Badge, Button, Card, CardBody, CardHeader, CardTitle, Container } from '@leucent/ui';
import { SiteShell } from '@/components/SiteShell';
import { FEATURES_PAGE_INTRO, MARKETING_FEATURES } from '@/lib/marketing-features';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Features' };

export default function FeaturesPage() {
  const { eyebrow, title, subtitle } = FEATURES_PAGE_INTRO;

  return (
    <SiteShell activeNav="features">
      <section className="border-b border-surface-800/80 py-16 sm:py-20">
        <Container size="xl">
          <div className="mb-12 max-w-2xl">
            <Badge tone="accent">{eyebrow}</Badge>
            <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight text-surface-50 sm:text-4xl">
              {title}
            </h1>
            <p className="mt-3 text-lg text-surface-400">{subtitle}</p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {MARKETING_FEATURES.map((f) => (
              <Card key={f.title} className="h-full">
                <CardHeader>
                  <CardTitle>{f.title}</CardTitle>
                  <Badge tone="accent">{f.badge}</Badge>
                </CardHeader>
                <CardBody className="text-sm text-surface-300">{f.body}</CardBody>
              </Card>
            ))}
          </div>

          <div className="mt-14 flex flex-wrap items-center gap-4">
            <Link href="/signup">
              <Button size="lg">Get started</Button>
            </Link>
            <Link href="/">
              <Button size="lg" variant="outline">
                Back to home
              </Button>
            </Link>
          </div>
        </Container>
      </section>
    </SiteShell>
  );
}
