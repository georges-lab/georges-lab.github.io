/* ═══════════════════════════════════════════════
   GOGBOT WIDGET — gogbot.js
   georges-lab.github.io
   ═══════════════════════════════════════════════ */

const GB_SYSTEM = `You are GogBot, the intelligent AI assistant embedded on George Ndung'u's professional portfolio website (https://georges-lab.github.io/). Your job is to represent George professionally, answer visitor questions intelligently, qualify leads, and guide interested clients toward contacting George.

## WHO GEORGE IS
George Ndung'u is a skilled Kenyan web developer, UI/UX designer, and IT technician based in Nairobi, Kenya. He crafts websites for ideas, businesses, and dreams — "one line of code at a time." He has real, verified clients and completed projects.

## GEORGE'S SERVICES

### 1. Web Design & Development
- Custom website design and development from scratch
- Responsive, mobile-first websites
- Uses HTML, CSS, JavaScript, PHP, and WordPress
- Builds everything from simple landing pages to complex web apps
- eCommerce websites (like scotchandgin.delivery)
- Events and business websites (like delightinternational.co.ke)

### 2. POS (Point of Sale) Software Development
- Custom POS systems tailored for Kenyan businesses
- Features: Sales tracking, inventory management, receipt generation, reporting dashboards
- M-Pesa payment integration built into POS
- Cloud and local deployment options
- Ideal for: retail shops, restaurants, supermarkets, pharmacies
- George has a working demo video on his site

### 3. M-Pesa API Integration (Daraja API)
- Integrates Safaricom's Daraja API into websites and apps
- STK Push (Lipa Na M-Pesa Online) — customer pays via phone prompt
- C2B (Customer to Business) and B2C (Business to Customer) payments
- Transaction confirmation and status callbacks
- Perfect for: eCommerce checkout, school fees, booking systems, SACCOs

### 4. Web Scraping
- Automated bots/scrapers to extract data from websites
- Use cases: price monitoring, lead generation, market research
- Uses Python (BeautifulSoup, Scrapy, Selenium)

### 5. Task Automation
- Automates repetitive business tasks using Python scripts
- File processing, data entry, email automation, report generation

### 6. Chatbot Creation
- Website visitor chatbots to improve conversion and sales
- AI-powered and rule-based chatbots

### 7. Computer & IT Tech
- Computer repair and maintenance
- Hardware/software troubleshooting, networking

## GEORGE'S SKILLS
- HTML: 99% | CSS: 99% | WordPress: 99%
- JavaScript: 87% | Python: 89% | PHP: 73%

## COMPLETED PROJECTS
1. delightinternational.co.ke — Events company website (WordPress)
2. scotchandgin.delivery — Full eCommerce website
3. Custom Chatbot — Website visitor chatbot
4. M-Pesa API Integration — Dynamic online payment system
5. Task Automation Script — Python office automation tool
6. Weather App — Python weather prediction app
7. Custom POS System — Full Point of Sale software (demo on site)

## CLIENT TESTIMONIALS
- Liz Atieno (Otiende, Nairobi): "Working with George was a pleasure! Responsive, visually appealing, user-friendly. Delivered on time."
- Mary Kavesu (Imara-daima, Nairobi): "The transformation was amazing! New design is sleek and modern. Already seeing increased traffic."

## CONTACT & PRICING
- WhatsApp: +254710823964
- Email: ndungugeorge065@gmail.com
- Location: 00200-52491, Nairobi, Kenya
- WhatsApp link: https://wa.me/254710823964?text=Hello%20George,%20I'm%20interested%20in%20your%20services.
- Pricing is custom per project — always direct visitors to WhatsApp or email for a free quote.

## BEHAVIOUR RULES
- Be friendly, professional, and confident
- Use **bold** for key terms, code blocks for code snippets
- When visitors ask about pricing, explain it depends on project scope and direct them to WhatsApp
- For hiring/contact intent, show the WhatsApp CTA button
- Qualify leads by asking about their project type and timeline
- Never make up projects or promise specific prices
- Keep replies focused and concise`;

const GB_QR_SETS = {
  default:  ["Tell me more 💬", "How do I contact George?", "See George's work"],
  pricing:  ["Get a free quote via WhatsApp", "What affects the price?", "What's included?"],
  pos:      ["Does it work offline?", "Can it integrate M-Pesa?", "See POS demo"],
  mpesa:    ["How long does integration take?", "What's the cost?", "Get started"],
  hire:     ["Chat on WhatsApp 💬", "Send an email 📧", "Tell me about your services first"],
  web:      ["Do you do eCommerce?", "How long does it take?", "Can you redesign my site?"],
};

let gbHistory      = [];
let gbBusy         = false;
let gbOpen         = false;
let gbLeadCaptured = false;
let gbMsgCount     = 0;

/* ── Toggle open/close ── */
function gbToggle() {
  gbOpen = !gbOpen;
  const win   = document.getElementById('gogbot-window');
  const btn   = document.getElementById('gogbot-toggle');
  const badge = document.getElementById('gbBadge');

  win.classList.toggle('open', gbOpen);
  btn.classList.toggle('open', gbOpen);
  if (badge) badge.remove();

  if (gbOpen && document.getElementById('gbMsgs').children.length === 0) {
    setTimeout(() => {
      gbAddMsg(
        `👋 Hi there! I'm **GogBot**, George's AI assistant.\n\nI'm here to help you learn about George's services, answer your tech questions, or get you connected with George directly.\n\nWhat can I help you with today?`,
        'bot', 'hire'
      );
    }, 350);
  }
}

/* ── Chip shortcut ── */
function gbChipSend(text) {
  document.getElementById('gbInput').value = text;
  document.getElementById('gbChips').style.display = 'none';
  gbSend();
}

/* ── Helpers ── */
function gbNow() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function gbEsc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function gbFmt(t) {
  t = t.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, l, c) =>
    `<pre><code>${gbEsc(c.trim())}</code></pre>`);
  t = t.replace(/`([^`]+)`/g, '<code>$1</code>');
  t = t.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  t = t.replace(/^[-•*]\s+(.+)/gm, '<li>$1</li>');
  t = t.replace(/(<li>[\s\S]*?<\/li>\n?)+/g, m => `<ul>${m}</ul>`);
  t = t.replace(/^\d+\.\s+(.+)/gm, '<li>$1</li>');
  t = t.replace(/\n/g, '<br>');
  return t;
}

function gbDetectIntent(text) {
  const t = text.toLowerCase();
  if (/price|cost|how much|rate|quote|budget|fee|charge/.test(t))           return 'pricing';
  if (/pos|point.of.sale|inventory|receipt|cashier|retail|shop|till/.test(t)) return 'pos';
  if (/mpesa|m-pesa|safaricom|daraja|stk|lipa|payment/.test(t))             return 'mpesa';
  if (/hire|contact|whatsapp|email|work with|get started|start|project/.test(t)) return 'hire';
  if (/web|website|wordpress|ecommerce|landing|redesign|responsive/.test(t)) return 'web';
  return 'default';
}

/* ── Add a message bubble ── */
function gbAddMsg(content, role, intentOverride = null) {
  const area = document.getElementById('gbMsgs');
  area.querySelectorAll('.gb-qrs').forEach(e => e.remove());

  const row = document.createElement('div');
  row.className = `gb-row ${role}`;

  if (role === 'bot') {
    const av = document.createElement('div');
    av.className = 'gb-rav';
    av.textContent = '🤖';
    row.appendChild(av);
  }

  const bub = document.createElement('div');
  bub.className = 'gb-bub';

  const intent = intentOverride || gbDetectIntent(content);
  let ctaHtml = '';
  if (role === 'bot' && (intent === 'hire' || intent === 'pricing') && gbMsgCount > 1) {
    ctaHtml = `<br><a class="gb-cta" href="https://wa.me/254710823964?text=Hello%20George,%20I'm%20interested%20in%20your%20services." target="_blank">💬 Chat on WhatsApp</a>`;
  }

  bub.innerHTML = gbFmt(content) + ctaHtml + `<div class="ts">${gbNow()}</div>`;
  row.appendChild(bub);
  area.appendChild(row);

  /* Smart quick replies */
  if (role === 'bot') {
    const qrs   = GB_QR_SETS[intent] || GB_QR_SETS.default;
    const qrDiv = document.createElement('div');
    qrDiv.className = 'gb-qrs';
    qrs.forEach(q => {
      const b = document.createElement('button');
      b.className = 'gb-qr';
      b.textContent = q;
      b.onclick = () => { document.getElementById('gbInput').value = q; gbSend(); };
      qrDiv.appendChild(b);
    });
    area.appendChild(qrDiv);

    gbMsgCount++;
    if (gbMsgCount === 3 && !gbLeadCaptured) {
      setTimeout(gbShowLeadForm, 800);
    }
  }

  area.scrollTop = area.scrollHeight;
}

/* ── Lead capture form ── */
function gbShowLeadForm() {
  const area = document.getElementById('gbMsgs');
  area.querySelectorAll('.gb-qrs').forEach(e => e.remove());

  const row = document.createElement('div');
  row.className = 'gb-row bot';

  const av = document.createElement('div');
  av.className = 'gb-rav';
  av.textContent = '🤖';

  const bub = document.createElement('div');
  bub.className = 'gb-bub';
  bub.innerHTML = `
    Looks like you're interested! Drop your name and contact so George can reach you 👇
    <div class="gb-lead-form" style="margin-top:10px;">
      <p>Get a free callback from George</p>
      <input class="gb-lead-input" id="gbLeadName"    type="text" placeholder="Your name"/>
      <input class="gb-lead-input" id="gbLeadContact" type="text" placeholder="Phone or email"/>
      <button class="gb-lead-submit" onclick="gbSubmitLead()">Send to George 🚀</button>
    </div>
    <div class="ts">${gbNow()}</div>`;

  row.appendChild(av);
  row.appendChild(bub);
  area.appendChild(row);
  area.scrollTop = area.scrollHeight;
}

function gbSubmitLead() {
  const name    = document.getElementById('gbLeadName')?.value.trim();
  const contact = document.getElementById('gbLeadContact')?.value.trim();
  if (!name || !contact) { alert('Please fill in both fields.'); return; }

  gbLeadCaptured = true;
  const msg   = encodeURIComponent(`Hello George! I'm ${name}. I found you via your website chatbot. My contact is: ${contact}. I'm interested in your services.`);
  const waUrl = `https://wa.me/254710823964?text=${msg}`;
  window.open(waUrl, '_blank');

  document.querySelectorAll('.gb-lead-form').forEach(el => el.closest('.gb-row')?.remove());
  gbAddMsg(`✅ Thanks **${name}**! WhatsApp has been opened with your details pre-filled. George will get back to you shortly.\n\nFeel free to keep asking me anything! 😊`, 'bot');
}

/* ── Typing indicator ── */
function gbShowTyping() {
  const area = document.getElementById('gbMsgs');
  const row  = document.createElement('div');
  row.className = 'gb-row bot';
  row.id = 'gbTyping';

  const av = document.createElement('div');
  av.className  = 'gb-rav';
  av.textContent = '🤖';

  const bub = document.createElement('div');
  bub.className = 'gb-bub';
  bub.innerHTML = '<div class="gb-typing-bub"><span></span><span></span><span></span></div>';

  row.appendChild(av);
  row.appendChild(bub);
  area.appendChild(row);
  area.scrollTop = area.scrollHeight;
}

function gbRemoveTyping() {
  document.getElementById('gbTyping')?.remove();
}

/* ── Send message ── */
async function gbSend() {
  if (gbBusy) return;
  const input = document.getElementById('gbInput');
  const text  = input.value.trim();
  if (!text) return;

  document.getElementById('gbChips').style.display = 'none';
  input.value = '';
  input.style.height = 'auto';

  gbAddMsg(text, 'user');
  gbHistory.push({ role: 'user', content: text });
  gbBusy = true;
  gbShowTyping();

  try {
    const res  = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model:      'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system:     GB_SYSTEM,
        messages:   gbHistory,
      }),
    });

    const data  = await res.json();
    gbRemoveTyping();
    const reply = data?.content?.[0]?.text || 'Something went wrong. Please try again!';
    gbHistory.push({ role: 'assistant', content: reply });
    gbAddMsg(reply, 'bot', gbDetectIntent(text));

  } catch (e) {
    gbRemoveTyping();
    gbAddMsg('⚠️ Connection error. Please try again or reach George on WhatsApp.', 'bot', 'hire');
  }

  gbBusy = false;
}

/* ── Auto-resize textarea ── */
const gbTa = document.getElementById('gbInput');

gbTa.addEventListener('input', function () {
  this.style.height = 'auto';
  this.style.height = Math.min(this.scrollHeight, 80) + 'px';
});

gbTa.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    gbSend();
  }
});
okay