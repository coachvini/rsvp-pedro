# Confirmação de Presença - Aniversário do Pedro

Página de RSVP do aniversário do Pedro (27/09/2026 às 12:00, Fest Kids) com tema
dourado sobre fundo escuro seguindo o convite.

Arquitetura: **site 100% estático** (HTML/CSS/JS) hospedado no **GitHub Pages**,
com os dados de confirmação guardados no **Supabase** (tabela + auth). O
formulário público só pode inserir; o painel admin (protegido por login) é o
único que lê/exclui as confirmações.

## Estrutura

```
public/                 -> site (o que vai para o GitHub Pages)
  index.html            -> formulário público
  admin.html            -> painel admin (login Supabase Auth)
  app.js / admin.js     -> lógica
  config.js             -> URL/chave do Supabase + dados da festa
  style.css             -> tema (cores nas variáveis CSS)
  images/invite.webp    -> imagem do convite
server.js               -> (opcional) servidor para preview local
supabase-setup.sql      -> script de setup do banco
.github/workflows/      -> deploy automático para GitHub Pages
```

## Configuração do Supabase

1. Crie um projeto em https://supabase.com
2. No **SQL Editor**, cole e execute o conteúdo de `supabase-setup.sql`
   (cria a tabela `responses`, ativa Row Level Security e cria a função de
   confirmação)
3. Em **Authentication > Users**, clique em **Add user** e crie um usuário com
   e-mail e senha. Esse será o seu login no painel admin
4. Em **Project Settings > API**, copie o **Project URL** e a **anon public key**
   e cole em `public/config.js` (o anon key é público por design e pode ficar
   no repositório)

> NUNCA coloque a `service_role key` no site (ela dá acesso total ao banco).

## Hospedar no GitHub Pages

1. Crie um repositório no GitHub e suba este projeto (ou use `gh repo create`)
2. Em **Settings > Pages**, escolha como fonte **GitHub Actions**
3. No primeiro push para `main`, o workflow `.github/workflows/pages.yml`
   publica a pasta `public/` automaticamente

O site fica em `https://<seu-usuario>.github.io/<nome-do-repo>/`.

## Preview local

```bash
npm install
npm start
```

Abre em `http://localhost:3000` (formulário) e `/admin.html` (painel). O
`server.js` serve apenas os arquivos estáticos — os dados vão para o Supabase.

## Editar dados da festa e cores

- **Data, horário, local e prazo:** `public/config.js` (campo `party`)
- **Cores:** variáveis no topo de `public/style.css`
- **Imagem do convite:** `public/images/invite.webp`
