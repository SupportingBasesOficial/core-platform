# SupportingBases Core Platform

Transactional multi-tenant core for SupportingBases.

This repository is the structural foundation for authentication, tenant isolation, permissions, events, auditability, and repository-aware architectural analysis.

## Purpose

This project exists to provide a reusable core that can be inherited by larger SupportingBases applications.

It is built around these principles:

- multi-tenant by design
- row-level security as a first-class rule
- repository as architectural source of truth
- migrations as the only valid path for structural database change
- no direct dependence on remote database access for AI-assisted structural analysis

## AI Bootstrap

For repository-aware analysis, read these files in this order:

1. `docs/repo/REPO_INDEX.md`
2. `docs/repo/REPO_EFFECTIVE_CONTRACTS.json`
3. `docs/repo/REPO_RUNTIME.json`
4. `docs/repo/REPO_TRUTH_BOUNDARY.json`
5. `docs/repo/REPO_CONTRACTS.json`
6. `docs/repo/REPO_FILES.json`
7. `docs/repo/REPO_TREE.json`
8. `docs/repo/DB_RUNTIME_STATE.json`

### AI Rules

- Treat repository migrations as the source of truth for database architecture.
- Treat `REPO_EFFECTIVE_CONTRACTS.json` as the effective structural contract derived from repository history.
- Do not assume remote database state from repository files alone.
- Do not invent tables, columns, policies, functions, routes, or paths that are not present in the repository.
- Use repository code, migrations, and generated manifests before making architectural decisions.
- Consider `DB_RUNTIME_STATE.json` unavailable for remote verification unless explicit remote access is intentionally configured.

## Source of Truth

The project uses a strict hierarchy of truth:

1. repository migrations
2. effective contracts derived from migrations
3. real repository code
4. logs and runtime symptoms
5. hypotheses

Remote database state is not treated as known unless explicitly verified by a secure, controlled process.

## Database Change Discipline

This repository assumes the following rules:

- every structural database change must be made through migrations
- applied migrations must never be rewritten
- any correction must be introduced through a new migration
- manual structural drift outside migrations is considered architectural regression

This discipline allows AI systems and engineers to reconstruct the database architecture faithfully from repository history without direct access to sensitive runtime data.

## Generated Repository Manifests

The repository manifest generator writes the following files to `docs/repo`:

- `REPO_TREE.json`
- `REPO_FILES.json`
- `REPO_CONTRACTS.json`
- `REPO_EFFECTIVE_CONTRACTS.json`
- `REPO_RUNTIME.json`
- `REPO_TRUTH_BOUNDARY.json`
- `DB_RUNTIME_STATE.json`
- `REPO_INDEX.md`

These files exist to make the repository self-descriptive for engineering and AI-assisted analysis.

## Truth Boundary

This repository intentionally separates:

- repository-verified structure
- effective contracts derived from repository history
- remote runtime state

That separation is mandatory for security and correctness.

The repository manifests are allowed to describe:

- schema declared in migrations
- policies declared in migrations
- functions and RPCs declared in migrations
- effective contracts derived from repository history
- repository runtime metadata
- repository file structure

The repository manifests are not allowed to pretend certainty about:

- remote database drift
- manually changed remote objects
- applied migration state on a remote environment
- sensitive runtime data

## Runtime

Current runtime expectations must stay aligned across:

- `package.json`
- `.nvmrc`
- GitHub Actions
- deployment platform configuration

When runtime changes, all of these must be updated together.

## Development

Install dependencies:

```bash
npm install