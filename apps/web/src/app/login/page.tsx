import { Badge, Card, CardBody, CardHeader, CardTitle, Container } from '@leucent/ui';
import { SiteShell } from '@/components/SiteShell';
import { LoginForm } from './login-form';

export const metadata = { title: 'Sign in' };

// SiteShell reads the session via Neon Auth, which requires dynamic rendering.
export const dynamic = 'force-dynamic';

export default function LoginPage() {
  return (
    <SiteShell>
      <section className="relative overflow-hidden">
        <div className="leucent-glow pointer-events-none absolute inset-0" />
        <Container size="lg" className="grid gap-10 py-20 md:grid-cols-[1.1fr_1fr]">
          <div className="hidden flex-col justify-center md:flex">
            <Badge tone="accent" dot>
              Interviewer access
            </Badge>
            <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight text-surface-50">
              Welcome back.
            </h1>
            <p className="mt-3 max-w-md text-surface-400">
              Open your dashboard, schedule an interview, or join one that is already running—all
              from one place.
            </p>
            <ul className="mt-8 flex flex-col gap-3 text-sm text-surface-300">
              {[
                'See the same code and drawings the candidate sees, as they work',
                'Follow assistant messages in order, like a simple transcript',
                'Adjust the exercise with short notes instead of interrupting out loud',
              ].map((line) => (
                <li key={line} className="flex items-start gap-3">
                  <span className="mt-1 h-1.5 w-1.5 flex-none rounded-full bg-accent-500 shadow-[0_0_6px_rgba(47,116,255,0.8)]" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>

          <Card tone="raised">
            <CardHeader>
              <CardTitle>Sign in</CardTitle>
              <Badge tone="info">Email + password</Badge>
            </CardHeader>
            <CardBody>
              <LoginForm />
            </CardBody>
          </Card>
        </Container>
      </section>
    </SiteShell>
  );
}
