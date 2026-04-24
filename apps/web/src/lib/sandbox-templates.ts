/** Allowlisted sandbox template keys sent to the provisioner (must stay in sync with Python allowlist). */
export const SANDBOX_TEMPLATE_KEYS = ['nodejs', 'python_ds', 'rust'] as const;
export type SandboxTemplateKey = (typeof SANDBOX_TEMPLATE_KEYS)[number];

export const DEFAULT_SANDBOX_TEMPLATE: SandboxTemplateKey = 'nodejs';

export const SANDBOX_TEMPLATE_LABELS: Record<SandboxTemplateKey, string> = {
  nodejs: 'Node.js sandbox',
  python_ds: 'Python data science sandbox',
  rust: 'Rust systems sandbox',
};

export function isSandboxTemplateKey(v: string): v is SandboxTemplateKey {
  return (SANDBOX_TEMPLATE_KEYS as readonly string[]).includes(v);
}

export function normalizeSandboxTemplate(v: string | undefined): SandboxTemplateKey {
  if (v && isSandboxTemplateKey(v)) return v;
  return DEFAULT_SANDBOX_TEMPLATE;
}
