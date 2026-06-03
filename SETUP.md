# DashPRO CPA — Setup de Lançamento

## PASSO 1 — Supabase (5 min)

1. Acesse supabase.com → New Project
   - Nome: dashpro-cpa
   - Região: South America (São Paulo)

2. Após criar, vá em **SQL Editor** e cole o conteúdo de `supabase-setup.sql` → Run

3. Vá em **Authentication → Settings**:
   - "Confirm email" → **OFF** (para onboarding imediato)

4. Anote as credenciais em **Settings → API**:
   - Project URL
   - anon public key
   - service_role key

---

## PASSO 2 — Stripe (5 min)

1. Acesse stripe.com → Products → Add product
   - Nome: DashPRO CPA
   - Tipo: Recurring
   - Preço: R$ 34,90 → BRL → Monthly
   - Free trial: 3 days
   - Salvar e copiar o **Price ID** (price_...)

2. Developers → Webhooks → Add endpoint
   - URL: https://SEU-PROJETO.vercel.app/api/webhook
   - Events: selecione:
     - checkout.session.completed
     - customer.subscription.updated
     - customer.subscription.deleted
     - invoice.payment_failed
   - Copiar o **Webhook Secret** (whsec_...)

---

## PASSO 3 — Preencher credenciais no app (2 min)

Edite `app.html` e preencha o bloco no topo:
```javascript
const DASHPRO = {
  supabaseUrl:  'https://SEU-PROJETO.supabase.co',
  supabaseKey:  'eyJ...',      // anon public key
  checkoutUrl:  'https://SEU-PROJETO.vercel.app/api/checkout',
  price:        'R$ 34,90/mês'
};
```

---

## PASSO 4 — Deploy no Vercel (3 min)

1. Crie repositório no GitHub e faça push desta pasta:
   ```
   git init
   git add .
   git commit -m "DashPRO CPA initial commit"
   git remote add origin https://github.com/SEU-USER/dashpro-cpa.git
   git push -u origin main
   ```

2. Acesse vercel.com → New Project → importe o repositório

3. Adicione as variáveis de ambiente em **Settings → Environment Variables**:
   ```
   SUPABASE_URL          = https://xxx.supabase.co
   SUPABASE_ANON_KEY     = eyJ...
   SUPABASE_SERVICE_ROLE_KEY = eyJ...
   STRIPE_SECRET_KEY     = sk_live_...
   STRIPE_WEBHOOK_SECRET = whsec_...
   STRIPE_PRICE_ID       = price_...
   APP_URL               = https://dashprocpa.vercel.app
   ```

4. Deploy → aguardar URL ficar disponível

---

## PASSO 5 — Atalho no desktop (Windows)

Após o deploy, execute este comando no PowerShell para criar o atalho:
```powershell
$shell=New-Object -ComObject WScript.Shell
$lnk=$shell.CreateShortcut("$env:USERPROFILE\Desktop\DashPRO CPA.lnk")
$lnk.TargetPath="C:\Program Files\Google\Chrome\Application\chrome.exe"
$lnk.Arguments='--app="https://dashprocpa.vercel.app/app.html" --window-size=1400,860'
$lnk.Description="DashPRO CPA"
$lnk.Save()
```

---

## CHECKLIST FINAL

- [ ] Supabase: projeto criado e SQL executado
- [ ] Supabase: confirmação de email desabilitada
- [ ] Stripe: produto criado com trial de 3 dias
- [ ] Stripe: webhook configurado
- [ ] app.html: credenciais preenchidas
- [ ] Vercel: variáveis de ambiente configuradas
- [ ] Vercel: deploy feito e URL funcionando
- [ ] Teste: criar conta → ver tela de pagamento → assinar → ver o app
