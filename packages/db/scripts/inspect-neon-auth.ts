/**
 * One-shot inspector that prints the column types of the `neon_auth.user`
 * and `neon_auth.organization` tables, plus leucent's FK constraints, so
 * leucent's FK columns can be typed to match.
 *
 * Pass `--fks` to include the constraint listing. Not wired into the normal
 * workflow — only used when migrating or auditing.
 */
import postgres from 'postgres';

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  const client = postgres(url, { max: 1 });
  const args = new Set(process.argv.slice(2));
  try {
    const tables = ['user', 'organization'] as const;
    for (const table of tables) {
      const rows = await client<
        { column_name: string; data_type: string; udt_name: string; is_nullable: string }[]
      >`
        SELECT column_name, data_type, udt_name, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'neon_auth' AND table_name = ${table}
        ORDER BY ordinal_position
      `;
      console.log(`\nneon_auth.${table} (${rows.length} columns):`);
      for (const r of rows) {
        console.log(
          `  ${r.column_name.padEnd(24)} ${r.data_type.padEnd(16)} udt=${r.udt_name} null=${r.is_nullable}`,
        );
      }
    }

    if (args.has('--fks')) {
      // info_schema.constraint_column_usage hides cross-schema FKs on some
      // PG versions, so we query pg_constraint directly.
      const fks = await client<{ table: string; column: string; references: string }[]>`
        SELECT
          cn.nspname || '.' || cl.relname AS "table",
          att.attname                      AS "column",
          fn.nspname || '.' || fl.relname || '(' || fatt.attname || ')' AS "references"
        FROM pg_constraint c
        JOIN pg_class    cl  ON cl.oid  = c.conrelid
        JOIN pg_namespace cn ON cn.oid  = cl.relnamespace
        JOIN pg_class    fl  ON fl.oid  = c.confrelid
        JOIN pg_namespace fn ON fn.oid  = fl.relnamespace
        JOIN unnest(c.conkey)  WITH ORDINALITY AS ck(attnum, ord)  ON TRUE
        JOIN unnest(c.confkey) WITH ORDINALITY AS fk(attnum, ord)  ON fk.ord = ck.ord
        JOIN pg_attribute att  ON att.attrelid  = c.conrelid  AND att.attnum  = ck.attnum
        JOIN pg_attribute fatt ON fatt.attrelid = c.confrelid AND fatt.attnum = fk.attnum
        WHERE c.contype = 'f'
          AND cn.nspname = 'public'
        ORDER BY cl.relname, att.attname
      `;
      console.log(`\npublic.* foreign keys (${fks.length}):`);
      for (const fk of fks) {
        console.log(`  ${fk.table}.${fk.column} -> ${fk.references}`);
      }
    }
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
