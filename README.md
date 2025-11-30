# Trabalho Prático Final - Sistema de Gestão Escolar

## 📋 Informações do Projeto

- **Nome:** Ítalo Eduardo Carneiro da Silva
- **Matrícula:** 898961
- **Proposta:** Organização e equipes - Escolas
- **Descrição:** Sistema completo de gestão escolar com painéis para alunos, professores e administradores, incluindo gerenciamento de eventos, pré-matrículas, notas e favoritos.

---

## 🚀 Como Iniciar o Projeto

### Pré-requisitos
- Node.js instalado (versão 14 ou superior)
- Navegador moderno (Chrome, Firefox, Edge)

### Passos para Iniciar

1. **Instalar dependências:**
   ```bash
   npm install
   ```

2. **Iniciar o servidor JSON:**
   ```bash
   npm start
   ```
   
   O servidor será iniciado em `http://localhost:3000`

3. **Acessar o site:**
   - Abra seu navegador
   - Acesse: `http://localhost:3000/index.html`
   - Ou simplesmente: `http://localhost:3000`

---

## 🔐 Dados de Login para Teste

### 👨‍🎓 **ALUNOS**

#### Aluno 1 - João Silva
- **Tipo:** Aluno
- **Matrícula:** `AL001`
- **Senha:** `joaozinho123`
- **Turma:** 1º Ano A
- **Notas:** Possui 3 bimestres de Matemática

#### Aluno 2 - Maria Oliveira
- **Tipo:** Aluno
- **Matrícula:** `AL002`
- **Senha:** `2009-08-20` (data de nascimento)
- **Turma:** 1º Ano A
- **Notas:** Possui 2 bimestres de Matemática

#### Aluno 3 - Pedro Santos
- **Tipo:** Aluno
- **Matrícula:** `AL003`
- **Senha:** `2010-03-12` (data de nascimento)
- **Turma:** 1º Ano A
- **Notas:** Possui 2 bimestres de Matemática

### 👨‍🏫 **PROFESSORES**

#### Professor 1 - Ana Costa (Matemática)
- **Tipo:** Professor
- **Matrícula:** `PROF001`
- **Senha:** `ana123`
- **Disciplina:** Matemática
- **Formação:** Mestre em Matemática Aplicada
- **Turma:** 1º Ano A (professorId: 1)

#### Professor 2 - Carlos Mendes (Português)
- **Tipo:** Professor
- **Matrícula:** `PROF002`
- **Senha:** `1982-07-25` (data de nascimento)
- **Disciplina:** Português
- **Formação:** Doutor em Letras
- **Turma:** 3º Ano B (professorId: 2)

### 👨‍💼 **ADMINISTRADOR**

#### Administrador
- **Tipo:** Administrador
- **Usuário:** `admin`
- **Senha:** `admin123`
- **Acesso:** Painel completo de administração

---

## 🧪 Guia de Teste das Funcionalidades

### 📱 **1. Página Inicial (Home)**

**Acesso:** `http://localhost:3000/index.html`

**Funcionalidades para testar:**
- ✅ Navegação pelo menu (Home, Sobre, Iniciação Científica, Contato)
- ✅ Carrossel de eventos
- ✅ Calendário de eventos
- ✅ Seção de pré-matrícula
- ✅ Busca de eventos
- ✅ Visualização de detalhes dos eventos
- ✅ Marcar eventos como favoritos (apenas quando logado como aluno)

---

### 👨‍🎓 **2. Painel do Aluno**

**Acesso:** 
1. Ir para `http://localhost:3000/login.html`
2. Selecionar tipo: **Aluno**
3. Fazer login com uma das credenciais de aluno acima

**Funcionalidades para testar:**

#### **Aba: Minhas Notas**
- ✅ Visualizar notas por disciplina e bimestre
- ✅ Filtrar por bimestre (1º, 2º, 3º, 4º)
- ✅ Filtrar por disciplina
- ✅ Ver média geral e situação (Aprovado/Recuperação/Reprovado)
- ✅ Ver estatísticas (disciplinas aprovadas, em recuperação, reprovadas)

#### **Aba: Desempenho**
- ✅ Gráfico de médias por disciplina
- ✅ Gráfico de evolução ao longo do ano
- ✅ Ranking de disciplinas

#### **Aba: Calendário**
- ✅ Visualizar eventos escolares no calendário
- ✅ Ver detalhes dos eventos

#### **Aba: Histórico**
- ✅ Ver histórico completo de todas as notas
- ✅ Filtrar e ordenar notas

#### **Favoritos (no painel do aluno)**
- ✅ Marcar eventos como favoritos na página inicial
- ✅ Ver favoritos no painel do aluno
- ✅ Remover favoritos

#### **Botão Sair**
- ✅ Clicar no botão "Sair" no canto superior direito
- ✅ Verificar se redireciona para a página inicial
- ✅ Verificar se limpa os dados de sessão

---

### 👨‍🏫 **3. Painel do Professor**

**Acesso:**
1. Ir para `http://localhost:3000/login.html`
2. Selecionar tipo: **Professor**
3. Fazer login com uma das credenciais de professor acima

**Funcionalidades para testar:**

#### **Aba: Minhas Turmas**
- ✅ Visualizar lista de turmas do professor
- ✅ Ver informações de cada turma (série, turno, ano letivo)
- ✅ Ver total de turmas

#### **Aba: Lançar Notas**
- ✅ Selecionar turma
- ✅ Selecionar bimestre
- ✅ Clicar em "Carregar Alunos"
- ✅ Ver lista de alunos da turma
- ✅ Inserir/editar notas (Nota 1, Nota 2, Nota 3)
- ✅ Ver média calculada automaticamente
- ✅ Salvar notas
- ✅ Verificar se as notas aparecem no painel do aluno

#### **Aba: Consultar Notas**
- ✅ Selecionar turma
- ✅ Selecionar bimestre (ou todos)
- ✅ Ver todas as notas dos alunos
- ✅ Ver situação de cada aluno (Aprovado/Recuperação/Reprovado)

#### **Botão Sair**
- ✅ Clicar no botão "Sair" no canto superior direito
- ✅ Verificar se redireciona para a página inicial
- ✅ Verificar se limpa os dados de sessão

---

### 👨‍💼 **4. Painel do Administrador**

**Acesso:**
1. Ir para `http://localhost:3000/admin-login.html`
2. Usuário: `admin`
3. Senha: `admin123`

**Funcionalidades para testar:**

#### **Aba: Eventos**
- ✅ Visualizar lista de eventos
- ✅ Criar novo evento
- ✅ Editar evento existente
- ✅ Excluir evento
- ✅ Ativar/desativar evento

#### **Aba: Pré-Matrículas**
- ✅ Visualizar lista de pré-matrículas
- ✅ Confirmar pré-matrícula
- ✅ Rejeitar pré-matrícula
- ✅ Ver detalhes da pré-matrícula

#### **Aba: Mensagens**
- ✅ Visualizar mensagens recebidas
- ✅ Responder mensagens
- ✅ Excluir mensagens

#### **Botão Sair**
- ✅ Clicar no botão "Sair" no canto superior direito
- ✅ Verificar se redireciona para a página inicial
- ✅ Verificar se limpa os dados de sessão

---

## 📊 Estrutura de Dados no db.json

### Alunos
- **3 alunos** cadastrados
- Todos na turma 1 (1º Ano A)
- Cada aluno possui notas de Matemática

### Professores
- **2 professores** cadastrados
- Ana Costa: Matemática (turma 1)
- Carlos Mendes: Português (turma 2)

### Turmas
- **2 turmas** cadastradas
- 1º Ano A (Manhã) - Professor: Ana Costa
- 3º Ano B (Tarde) - Professor: Carlos Mendes

### Notas
- **7 notas** cadastradas
- Distribuídas entre os 3 alunos
- Todas de Matemática (disciplina do professor Ana Costa)

---

## 🔍 Testes de API REST

Você pode testar diretamente as APIs REST usando o navegador ou ferramentas como Postman:

### Endpoints Disponíveis

#### Alunos
- `GET http://localhost:3000/alunos` - Listar todos os alunos
- `GET http://localhost:3000/alunos/1` - Buscar aluno por ID
- `GET http://localhost:3000/alunos?matricula=AL001` - Buscar aluno por matrícula
- `GET http://localhost:3000/alunos?turmaId=1` - Buscar alunos por turma

#### Professores
- `GET http://localhost:3000/professores` - Listar todos os professores
- `GET http://localhost:3000/professores/1` - Buscar professor por ID
- `GET http://localhost:3000/professores?matricula=PROF001` - Buscar professor por matrícula

#### Turmas
- `GET http://localhost:3000/turmas` - Listar todas as turmas
- `GET http://localhost:3000/turmas/1` - Buscar turma por ID
- `GET http://localhost:3000/turmas?professorId=1` - Buscar turmas por professor

#### Notas
- `GET http://localhost:3000/notas` - Listar todas as notas
- `GET http://localhost:3000/notas?alunoId=1` - Buscar notas por aluno
- `GET http://localhost:3000/notas?turmaId=1` - Buscar notas por turma
- `GET http://localhost:3000/notas?alunoId=1&bimestre=1` - Buscar notas por aluno e bimestre
- `POST http://localhost:3000/notas` - Criar nova nota
- `PUT http://localhost:3000/notas/1` - Atualizar nota existente

#### Eventos
- `GET http://localhost:3000/eventos` - Listar todos os eventos
- `GET http://localhost:3000/eventos?ativo=true` - Listar apenas eventos ativos
- `POST http://localhost:3000/eventos` - Criar novo evento
- `PUT http://localhost:3000/eventos/1` - Atualizar evento
- `DELETE http://localhost:3000/eventos/1` - Excluir evento

---

## 🐛 Solução de Problemas

### Erro: "API_URL has already been declared"
- **Solução:** Limpe o cache do navegador (Ctrl+Shift+R ou Ctrl+F5)
- Se persistir, feche todas as abas do navegador e abra novamente

### Dados não aparecem no painel
- **Verifique:** Se o servidor JSON está rodando (`npm start`)
- **Verifique:** Se há erros no console do navegador (F12)
- **Verifique:** Se os dados estão no `db.json`

### Botão de logout não funciona
- **Solução:** Os botões foram corrigidos para limpar o localStorage e redirecionar corretamente

### Erro de CORS
- **Solução:** Certifique-se de que está acessando pelo `http://localhost:3000` e não por `file://`

---

## 📝 Notas Importantes

1. **Servidor JSON:** O servidor deve estar rodando para que o site funcione corretamente
2. **Cache do Navegador:** Sempre limpe o cache após fazer alterações nos arquivos JavaScript
3. **Dados Mockados:** Todos os dados estão no arquivo `db/db.json`
4. **Favoritos:** A funcionalidade de favoritos está disponível apenas para alunos e aparece no painel do aluno
5. **Logout:** Foi removido da navbar principal, permanecendo apenas nos painéis de usuário

---

## 🎯 Checklist de Teste para Avaliação

### ✅ Funcionalidades Básicas
- [ ] Login de aluno funciona
- [ ] Login de professor funciona
- [ ] Login de administrador funciona
- [ ] Logout funciona em todos os painéis
- [ ] Dados do aluno são exibidos corretamente
- [ ] Dados do professor são exibidos corretamente
- [ ] Turmas do professor são carregadas
- [ ] Alunos da turma são carregados

### ✅ Funcionalidades do Aluno
- [ ] Visualizar notas
- [ ] Filtrar notas por bimestre
- [ ] Filtrar notas por disciplina
- [ ] Ver gráficos de desempenho
- [ ] Ver calendário de eventos
- [ ] Ver histórico de notas
- [ ] Marcar eventos como favoritos
- [ ] Ver favoritos no painel

### ✅ Funcionalidades do Professor
- [ ] Ver lista de turmas
- [ ] Carregar alunos para lançar notas
- [ ] Inserir notas (Nota 1, 2, 3)
- [ ] Ver média calculada automaticamente
- [ ] Salvar notas
- [ ] Consultar notas dos alunos
- [ ] Filtrar notas por bimestre

### ✅ Funcionalidades do Administrador
- [ ] Visualizar eventos
- [ ] Criar novo evento
- [ ] Editar evento
- [ ] Excluir evento
- [ ] Visualizar pré-matrículas
- [ ] Confirmar/rejeitar pré-matrículas
- [ ] Visualizar mensagens

---

## 📞 Suporte

Em caso de problemas:
1. Verifique se o servidor está rodando
2. Verifique o console do navegador (F12) para erros
3. Certifique-se de que todas as dependências foram instaladas (`npm install`)

---

**Desenvolvido por:** Ítalo Eduardo Carneiro da Silva  
**Data:** 30/11/2025
