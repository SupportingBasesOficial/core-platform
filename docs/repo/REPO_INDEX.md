# REPO REALITY INDEX

Gerado automaticamente a partir da realidade do repositório.

## Metadados

- generated_at: `2026-04-09T19:58:04.330Z`
- repository: `SupportingBasesOficial/core-platform`
- branch: `main`
- commit_sha: `f4c317be4472b627602a1d04bc8a953ab4720081`
- generator: `scripts/generate-repo-manifest.mjs`

## Contagem estrutural

- directories: 38
- files: 59

## Contagem por camada

- app: 17
- docs: 3
- github_workflow: 1
- root_or_other: 16
- scripts: 1
- server: 12
- supabase_migrations: 9

## Contagem por kind

- auth_module: 2
- event_module: 2
- file: 25
- layout: 1
- middleware: 1
- migration: 9
- node_version_file: 1
- package_manifest: 1
- page: 8
- readme: 1
- repository: 1
- route_handler: 3
- service: 1
- typescript_config: 1
- utility: 1
- workflow: 1

## Contratos SQL detectados

- tables: 8
- indexes: 2
- policies: 12
- functions: 3
- views: 0
- triggers: 0
- enums: 0
- rls_enabled_tables: 6

## Contratos efetivos

- effective_tables: 8
- effective_indexes: 2
- effective_policies: 12
- effective_functions: 3
- duplicate_functions: 0

## Runtime detectado

- env_references: 5
- workflows: 1
- nvmrc: 18.20.4

## Fronteira de verdade

- repo_files_verified: true
- remote_database_runtime_verified: false

## Rotas detectadas

- `/api/events/create-failing` — src/app/api/events/create-failing/route.ts
- `/api/events/process` — src/app/api/events/process/route.ts
- `/api/sales` — src/app/api/sales/route.ts
- `/login` — src/app/login/page.tsx
- `/logout` — src/app/logout/page.tsx
- `/` — src/app/page.tsx
- `/test-auth` — src/app/test-auth/page.tsx
- `/test-dead-events` — src/app/test-dead-events/page.tsx
- `/test-events` — src/app/test-events/page.tsx
- `/test-sale` — src/app/test-sale/page.tsx
- `/test-tenant` — src/app/test-tenant/page.tsx

## Workflows detectados

- `.github/workflows/generate-repo-manifest.yml`

## Arquivos gerados

- `docs/repo/REPO_TREE.json`
- `docs/repo/REPO_FILES.json`
- `docs/repo/REPO_CONTRACTS.json`
- `docs/repo/REPO_EFFECTIVE_CONTRACTS.json`
- `docs/repo/REPO_RUNTIME.json`
- `docs/repo/REPO_TRUTH_BOUNDARY.json`
- `docs/repo/DB_RUNTIME_STATE.json`
- `docs/repo/REPO_INDEX.md`

## Observações

- Tudo aqui é derivado apenas de arquivos reais do repositório.
- Estado remoto do banco não é inferido a partir das migrations.
- O que não estiver no repositório não entra como fato.
