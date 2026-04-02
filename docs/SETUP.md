# SETUP

## Objetivo

Este documento explica como subir o `core-platform` do zero, usando Codespaces ou outro ambiente compatível com Node e Supabase.

---

## Pré-requisitos

- conta no GitHub
- conta no Supabase
- acesso ao repositório `core-platform`
- ambiente com Node e npm
- preferência por GitHub Codespaces

---

## Modelo recomendado de ambiente

### Recomendado
- VS Code conectado ao GitHub Codespaces
- projeto rodando em ambiente cloud

### Alternativa
- ambiente local com Node instalado

---

## 1. Clonar ou abrir o repositório

Se estiver usando Codespaces, abra o repositório diretamente em um codespace.

Se estiver local:

    git clone https://github.com/SupportingBasesOficial/core-platform.git
    cd core-platform

---

## 2. Instalar dependências

    npm install

---

## 3. Travar versão do Node

Este projeto usa `.nvmrc`.

Verifique:

    cat .nvmrc

Valor esperado:

    18.20.4

---

## 4. Criar `.env.local`

Crie o arquivo:

    .env.local

Preencha com:

    NEXT_PUBLIC_SUPABASE_URL=
    NEXT_PUBLIC_SUPABASE_ANON_KEY=

Se houver necessidade de operações administrativas futuras:

    SUPABASE_SERVICE_ROLE_KEY=

### Regra
Nunca expor service role no client.

---

## 5. Inicializar Supabase CLI no projeto

Se ainda não estiver configurado:

    npx supabase@latest init

---

## 6. Login no Supabase CLI

    npx supabase@latest login

Cole o access token da sua conta Supabase.

---

## 7. Linkar com o projeto remoto

    npx supabase@latest link --project-ref SEU_PROJECT_REF

---

## 8. Aplicar migrations

    npx supabase@latest db push

Esse comando aplica no banco remoto todas as migrations pendentes do repositório.

---

## 9. Rodar o projeto

    npm run dev

Abrir no navegador a porta do ambiente.

---

## 10. Testes básicos esperados

Depois de subir o projeto, estes fluxos devem funcionar:

### Auth
- `/login`
- `/logout`
- `/test-auth`

### Tenant
- `/test-tenant`

### Sales
- `/test-sale`

### Events
- `/test-events`

### Dead events
- `/test-dead-events`

---

## 11. Fluxo padrão para mudança de banco

Nunca usar o painel do Supabase como fluxo principal.

Sempre fazer:

### Criar migration

    npx supabase@latest migration new nome_da_mudanca

### Editar migration
Adicionar o SQL necessário.

### Aplicar no banco remoto

    npx supabase@latest db push

### Validar
Testar no app e no banco.

### Versionar

    git add .
    git commit -m "feat: descricao_da_mudanca"
    git push

---

## 12. Convenções do projeto

### Banco
- toda mudança estrutural via migration
- repo é fonte de verdade

### Backend
- regra crítica no server
- service layer obrigatória

### Frontend
- client simples
- sem lógica crítica

### Logs
- usar logger estruturado

### Eventos
- persistir
- processar
- reprocessar
- mover para DLQ quando exceder tentativas

---

## 13. Versão estável

A versão congelada atual é:

    v1.0.0-core-stable

Essa tag representa a primeira base estável e reutilizável do core.

---

## 14. Como usar este core em novos produtos

### Modelo mental
- `core-platform` = engine
- `novo-produto` = aplicação usando a engine

### Recomendação prática
Criar novo repositório para cada produto real, mantendo o core como base oficial da arquitetura.

---

## 15. Regra final

Se surgir dúvida entre rapidez e consistência, priorize consistência.

Este core existe para evitar retrabalho estrutural no futuro.