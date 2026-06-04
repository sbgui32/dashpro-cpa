const path = require('path');
let playwright;
const paths = [
  path.join(__dirname,'Despachantes','node_modules','playwright'),
  path.join(__dirname,'Despachantes','node_modules','@playwright','test'),
  'playwright',
];
for(const p of paths){ try{ playwright=require(p); break; }catch(e){} }
if(!playwright){ console.error('❌ Playwright não encontrado.'); process.exit(1); }

(async()=>{
  const htmlFile = path.join(__dirname,'dashpro-product-cover.html');
  const imgFile  = path.join(__dirname,'DashPRO-Product-Cover.png');

  console.log('\n╔═══════════════════════════════════════════╗');
  console.log('║   DashPRO CPA — Gerando capa do produto  ║');
  console.log('╚═══════════════════════════════════════════╝\n');

  const {chromium} = playwright;
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // 1200x628 — tamanho ideal para Kiwify/redes sociais
  await page.setViewportSize({ width: 1200, height: 628 });

  await page.goto(`file:///${htmlFile.replace(/\\/g,'/')}`, {
    waitUntil: 'networkidle',
    timeout: 30000,
  });

  await page.waitForTimeout(1500);

  await page.screenshot({
    path: imgFile,
    fullPage: false,
    clip: { x: 0, y: 0, width: 1200, height: 628 },
    type: 'png',
  });

  await browser.close();

  console.log('✅ Imagem gerada!');
  console.log(`🖼️  Arquivo: ${imgFile}\n`);

  require('child_process').exec(`start "" "${imgFile}"`);
})().catch(e=>{ console.error('❌ Erro:', e.message); process.exit(1); });
