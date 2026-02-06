# Prisma Migration Research

## Motivation

Prisma's schema DSL has limited support for advanced PostgreSQL features:

- No `CHECK` constraints
- No partial indexes
- No triggers or stored functions/procedures
- No custom PostgreSQL types
- Functions like `duplicate_tile` require manual raw SQL files and a separate `db:push-functions` script

## Current Setup

- **24 models** across 11 modular Prisma schema files with a polymorphic tile system (base `Tile` + 8 type-specific tables)
- **4 custom `$extends` extensions** computing virtual fields: image CDN URLs, hex color conversion from `ByteA`, gradient/background parsing, and theme property grouping
- **80+ `$transaction` blocks** across 42 query files
- **4 raw SQL files** including a 152-line PL/pgSQL `duplicate_tile` function
- **No migration history** — uses `prisma db push` for schema sync
- Uses Prisma's `typedSql` preview feature for type-safe raw queries

## Recommendation: Kysely + dbmate

### Kysely (query builder)

**Why Kysely over Drizzle:**

1. **Plugin system replaces Prisma extensions.** Kysely's plugin API supports query transformation (pre-execution) and result transformation (post-execution) — structurally equivalent to `$extends`. Drizzle has no plugin/middleware system, so the 4 extensions computing ~10+ virtual fields would need manual transformation at every call site.

2. **Stronger type safety.** Kysely validates query _construction_ at compile time, not just results. Column references, join conditions, and where clauses are all validated. In Drizzle, structurally invalid queries (e.g., referencing columns from the wrong table) compile without errors.

3. **Natural fit for existing SQL patterns.** The codebase already uses raw SQL for complex operations (fractional indexing, `LATERAL` joins, `duplicate_tile` function). Kysely maps 1:1 to SQL with a `sql` template tag available everywhere.

4. **Full transaction support** with savepoints (needed for 80+ transaction blocks).

5. **Minimal overhead** — pure string concatenation, no binary engine (~5kb vs Prisma's ~15MB+ Rust engine).

**Why not Drizzle:**

- No plugin/extension system (significant DX regression for computed fields).
- Migration pitfalls: rename + modify in the same migration silently drops the modification. No down-migration support.
- Triggers/functions still require raw SQL escape hatches.
- Type safety is result-only, not construction-time.

### dbmate (schema migrations)

1. **Zero PostgreSQL DDL limitations.** Migrations are plain `.sql` files — `CHECK` constraints, partial indexes, triggers, stored functions, custom types, RLS policies all supported.

2. **Simple and battle-tested.** Single Go binary, up/down migrations, auto-generates `schema.sql` dump via `pg_dump`.

3. **Versioned migration history** — replaces the current `prisma db push` approach with proper tracked migrations.

4. **Replaceable.** Can be swapped for graphile-migrate or another tool without touching query code.

### Type generation

Use `kysely-codegen` to generate TypeScript types from the live database:

```bash
dbmate up
kysely-codegen --dialect postgres --out-file src/generated/db-types.ts
```

This replaces `prisma generate`.

## Migration Path

### Phase 1: Baseline migration

- Create an initial dbmate migration from the current schema (via `pg_dump` or by converting the Prisma schema to SQL).
- Move `duplicate_tile` and other functions into proper migration files.
- Add any desired `CHECK` constraints, partial indexes, etc.

### Phase 2: Set up Kysely

- Initialize the Kysely client with the existing `pg` connection.
- Build plugins to replicate the 4 Prisma extensions (images, colors, backgrounds, themes).
- Generate types with `kysely-codegen`.

### Phase 3: Migrate queries incrementally

- Convert route files one at a time, starting with simpler routes (bookmarks, folders) and working toward complex ones (tables, tiles).
- Prisma and Kysely can coexist during the transition (same database).

### Phase 4: Remove Prisma

- Remove `@prisma/client`, `@prisma/adapter-pg`, `prisma`, and the schema files.
- Update `pnpm generate` to run `kysely-codegen` instead of `prisma generate`.

## Comparison

| Concern | Current (Prisma) | Recommended (Kysely + dbmate) |
|---|---|---|
| Constraints, functions, custom types | Limited / raw SQL workaround | Full PostgreSQL DDL support |
| Schema migrations | `db push` (no history) | Versioned SQL files with up/down |
| Query type safety | Result types only | End-to-end (construction + results) |
| Computed fields / extensions | `$extends` (4 extensions) | Plugin API (equivalent capability) |
| Query overhead | Rust binary engine | Zero overhead (string building) |
| Transactions | Supported | Supported (with savepoints) |
| Raw SQL | `$queryRawTyped` | `sql` tag everywhere |
| Bundle / cold start | ~15MB+ engine binary | ~5kb, zero binary deps |
