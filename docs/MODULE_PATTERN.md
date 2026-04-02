# MODULE PATTERN

## Objetivo

Padronizar como novos módulos devem ser construídos em cima do `core-platform`.

Isso evita:

- lógica espalhada
- duplicação de padrão
- inconsistência entre módulos
- bagunça arquitetural

---

## Regra geral

Todo módulo novo deve respeitar a divisão:

- schema
- service
- route
- permissions
- events
- página de teste
- migrations, quando necessário

---

## Estrutura recomendada

Exemplo para um módulo chamado `caixa`:

    src/modules/caixa/
      schema.ts
      types.ts
      permissions.ts
      events.ts

    src/server/services/
      caixaService.ts

    src/app/api/caixa/
      route.ts

    src/app/test-caixa/
      page.tsx

---

## Responsabilidade de cada parte

### `schema.ts`

Define e valida input/output do módulo com Zod.

Exemplo:
- abrir caixa
- fechar caixa
- registrar movimentação

### `types.ts`

Tipos auxiliares do domínio.

Exemplo:
- `CashSession`
- `CashStatus`
- `OpenCashInput`

### `permissions.ts`

Lista as ações do módulo.

Exemplo:
- `caixa:open`
- `caixa:close`
- `caixa:read`

### `events.ts`

Define nomes de eventos gerados pelo módulo.

Exemplo:
- `cash_opened`
- `cash_closed`

### `service.ts`

Implementa a regra de negócio real.

Aqui entra:
- auth
- tenant
- permission
- chamada de repository ou RPC
- auditoria
- emissão de evento
- logs

### `route.ts`

Camada HTTP.

Responsável por:
- receber request
- parsear body
- validar schema
- chamar service
- retornar resposta padronizada

### `test page`

Página simples para validar o módulo em ambiente de desenvolvimento.

---

## Fluxo obrigatório de módulo

Todo fluxo novo deve seguir esta ordem:

### 1. Validar input
Usar Zod no schema do módulo.

### 2. Resolver usuário
Usar `getUser()`.

### 3. Resolver tenant
Usar `getCurrentOrg()`.

### 4. Validar permissão
Usar `checkPermission()`.

### 5. Executar regra
Via service + repository ou RPC.

### 6. Auditar
Registrar ação relevante.

### 7. Emitir evento
Persistir evento do domínio, quando fizer sentido.

### 8. Logar
Gerar log estruturado do fluxo.

---

## Checklist obrigatório

Antes de considerar um módulo “pronto”, confirmar:

- [ ] schema validado
- [ ] tenant validado
- [ ] permission validada
- [ ] lógica crítica fora do client
- [ ] banco alterado apenas via migration
- [ ] auditoria implementada
- [ ] evento implementado quando necessário
- [ ] página de teste criada
- [ ] logs básicos do fluxo presentes

---

## O que NÃO fazer

### Não colocar regra de negócio no client
Client só coleta input, exibe estado e chama API.

### Não acessar banco direto de qualquer lugar
Acesso deve passar por service/repository/RPC conforme o caso.

### Não criar módulo sem página de teste
Cada módulo precisa de um ponto claro de validação.

### Não alterar banco “na mão” como fluxo principal
Toda mudança estrutural vai para migration.

### Não misturar concern
Auth, permission, service, route e schema têm papéis diferentes.

---

## Exemplo de fluxo ideal

### Caso: criar venda

1. Client envia request
2. Route recebe e valida com Zod
3. Service resolve user
4. Service resolve tenant
5. Service valida permissão
6. Service chama RPC transacional
7. Service grava auditoria
8. Evento é persistido
9. Worker processa evento
10. Logs registram o fluxo

---

## Regra final

Se um novo módulo não segue este padrão, ele não entra como padrão do core.