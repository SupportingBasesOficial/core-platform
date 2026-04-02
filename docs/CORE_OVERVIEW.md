# CORE PLATFORM OVERVIEW

## O que é

O `core-platform` é a engine base da SupportingBases para construção de sistemas multi-tenant com backend seguro, rastreável e evolutivo.

Este repositório não representa um produto final específico.  
Ele representa a base estrutural que pode ser reutilizada para criar produtos reais, como:

- PDV
- Caixa
- ERP
- CRM
- SaaS multi-tenant
- módulos operacionais internos

---

## Objetivo

Garantir uma base técnica que não precise ser reescrita a cada novo sistema.

A proposta do core é concentrar os elementos mais críticos e difíceis de acertar:

- autenticação SSR
- resolução de tenant
- autorização
- validação de input
- transação
- idempotência
- eventos
- auditoria
- worker
- dead letter queue
- observabilidade básica

---

## Princípios

### 1. Repo é fonte de verdade
Toda mudança estrutural de banco deve nascer em migration versionada no repositório.

### 2. Sem lógica crítica no client
Frontend não decide autorização, tenant, transação ou regras centrais.

### 3. Banco com responsabilidade real
RLS, RPC e constraints fazem parte da segurança e consistência do sistema.

### 4. Service layer obrigatório
Toda regra de negócio passa pelo backend.

### 5. Eventos duráveis
Eventos não podem sumir silenciosamente. Eles precisam ser persistidos, processados e, se falharem, rastreados.

### 6. Evolução sem reescrita
O core deve ser expandido, não refeito.

---

## O que já está validado

### Auth
- login/logout
- leitura de usuário autenticado via SSR

### Tenant
- resolução do tenant atual por membership

### Permission
- checagem básica de permissão por ação

### Sales flow
- criação de venda funcional
- validação de tenant
- validação de permissão
- auditoria

### Transação
- criação de venda via RPC transacional

### Idempotência
- proteção contra duplicação de venda por repetição de request

### Eventos
- persistência de eventos
- processamento por worker
- retry básico
- DLQ

### Observabilidade
- logs estruturados
- request correlation
- métricas básicas por request

---

## Estrutura principal

```txt
src/
  app/
    api/
  server/
    auth/
    db/
    services/
    repositories/
    permissions/
    events/
    security/
    audit/
    errors/
    utils/
  modules/
  shared/
  infra/

supabase/
  migrations/

docs/