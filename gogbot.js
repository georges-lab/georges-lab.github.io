/* ═══════════════════════════════════════════════
   GOGBOT — gogbot.js
   Powered by Google Gemini API
   georges-lab.github.io
   ═══════════════════════════════════════════════ */

const GB_API_KEY = "AIzaSyAYJ7jCjigXjSwzWEf3m3N9Wlke0ds3rMs";

/* ── Correct model name (no -latest suffix) ── */
const GB_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GB_API_KEY}`;
/* ── Fallback model if above fails ── */
const GB_API_URL_FALLBACK = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GB_API_KEY}`;

const GB_SYSTEM = `You are GogBot, the AI assistant on George Ndung'u's portfolio website (https://georges-lab.github.io/). Represent George professionally and help visitors learn about his services.

WHO GEORGE IS:
George Ndung'u is a skilled Kenyan web developer, UI/UX designer, and IT technician based in Nairobi, Kenya.

GEORGE'S SERVICES:
1. Web Design and Development - HTML, CSS, JavaScript, PHP, WordPress, eCommerce, landing pages
2. POS Software Development - Custom POS for Kenyan businesses, M-Pesa integration, inventory, receipts
3. M-Pesa API Integration - Daraja API, STK Push, C2B, B2C payments
4. Web Scraping - Python bots, BeautifulSoup, Scrapy, data extraction
5. Task Automation - Python scripts, office automation, report generation
6. Chatbot Creation - AI and rule-based chatbots for websites
7. Computer and IT Tech - Repairs, networking, hardware and software support

COMPLETED PROJECTS:
- delightinternational.co.ke (Events website)
- scotchandgin.delivery (eCommerce website)
- Custom POS System (demo on site)
- M-Pesa API Integration
- Task Automation Script
- Weather App in Python

CONTACT:
- WhatsApp: +254710823964
- Email: ndungugeorge065@gmail.com
- For pricing always direct to WhatsApp for a free custom quote

RULES:
- Be friendly and professional
- Use **bold** for key terms
- Keep answers short and practical
- Encourage contacting George for quotes`;

const GB_QR_SETS = {
  default : ["What services do you offer?",      "How do I contact George?",   "Tell me about the POS system"],
  pricing : ["Get a free WhatsApp quote",         "What affects the price?",    "What is included?"],
  pos     : ["Does it work offline?",             "Can it integrate M-Pesa?",   "How much does it cost?"],
  mpesa   : ["How long does integration take?",   "What is the cost?",          "Get started 🚀"],
  hire    : ["Chat on WhatsApp 💬",               "Send an email 📧",           "What services do you offer?"],
  web     : ["Do you do eCommerce?",              "How long does it take?",     "Can you redesign my site?"],
};

let gbHistory      = [];
let gbBusy         = false;
let gbOpen         = false;
let gbLeadCaptured = false;
let gbMsgCount     = 0;

/* ══════════════════════════════
   TOGGLE
══════════════════════════════ */
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
        `👋 Hi there! I am **GogBot**, George's AI assistant.\n\nI can help you with:\n- 🌐 Web design and development\n- 🛒 POS software solutions\n- 💳 M-Pesa API integration\n- 🤖 Web scraping and automation\n\nWhat are you looking to build today?`,
        'bot', 'hire'
      );
    }, 400);
  }
}

/* ══════════════════════════════
   CHIP SHORTCUT
══════════════════════════════ */
function gbChipSend(text) {
  document.getElementById('gbInput').value = text;
  document.getElementById('gbChips').style.display = 'none';
  gbSend();
}

/* ══════════════════════════════
   HELPERS
══════════════════════════════ */
function gbNow() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function gbEsc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function gbFmt(t) {
  t = t.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, l, c) =>
    `<pre><code>${gbEsc(c.trim())}</code></pre>`);
  t = t.replace(/`([^`]+)`/g,      '<code>$1</code>');
  t = t.replace(/\*\*(.+?)\*\*/g,  '<strong>$1</strong>');
  t = t.replace(/^[-•*]\s+(.+)/gm, '<li>$1</li>');
  t = t.replace(/(<li>[\s\S]*?<\/li>\n?)+/g, m => `<ul>${m}</ul>`);
  t = t.replace(/\n/g, '<br>');
  return t;
}

function gbDetectIntent(text) {
  const t = text.toLowerCase();
  if (/price|cost|how much|rate|quote|budget|fee/.test(t))                 return 'pricing';
  if (/pos|point.of.sale|inventory|receipt|cashier|retail|shop/.test(t))   return 'pos';
  if (/mpesa|m-pesa|safaricom|daraja|stk|lipa|payment/.test(t))            return 'mpesa';
  if (/hire|contact|whatsapp|email|work with|get started|project/.test(t)) return 'hire';
  if (/web|website|wordpress|ecommerce|landing|redesign/.test(t))          return 'web';
  return 'default';
}

/* ══════════════════════════════
   ADD MESSAGE BUBBLE
══════════════════════════════ */
function gbAddMsg(content, role, intentOverride) {
  const area = document.getElementById('gbMsgs');
  area.querySelectorAll('.gb-qrs').forEach(e => e.remove());

  const row = document.createElement('div');
  row.className = `gb-row ${role}`;

  if (role === 'bot') {
    const av       = document.createElement('div');
    av.className   = 'gb-rav';
    av.textContent = '🤖';
    row.appendChild(av);
  }

  const bub     = document.createElement('div');
  bub.className = 'gb-bub';

  const intent = intentOverride || gbDetectIntent(content);
  let ctaHtml = '';
  if (role === 'bot' && (intent === 'hire' || intent === 'pricing') && gbMsgCount > 1) {
    ctaHtml = `<br><a class="gb-cta" href="https://wa.me/254710823964?text=Hello%20George,%20I'm%20interested%20in%20your%20services." target="_blank">💬 Chat on WhatsApp</a>`;
  }

  bub.innerHTML = gbFmt(content) + ctaHtml + `<div class="ts">${gbNow()}</div>`;
  row.appendChild(bub);
  area.appendChild(row);

  if (role === 'bot') {
    const qrs   = GB_QR_SETS[intent] || GB_QR_SETS.default;
    const qrDiv = document.createElement('div');
    qrDiv.className = 'gb-qrs';
    qrs.forEach(q => {
      const b       = document.createElement('button');
      b.className   = 'gb-qr';
      b.textContent = q;
      b.onclick     = () => { document.getElementById('gbInput').value = q; gbSend(); };
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

/* ══════════════════════════════
   LEAD FORM
══════════════════════════════ */
function gbShowLeadForm() {
  const area = document.getElementById('gbMsgs');
  area.querySelectorAll('.gb-qrs').forEach(e => e.remove());

  const row      = document.createElement('div');
  row.className  = 'gb-row bot';

  const av       = document.createElement('div');
  av.className   = 'gb-rav';
  av.textContent = '🤖';

  const bub     = document.createElement('div');
  bub.className = 'gb-bub';
  bub.innerHTML = `
    Looks like you are interested! Leave your details and George will reach out 👇
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
  const msg = encodeURIComponent(
    `Hello George! I'm ${name}. I found you via your website chatbot. My contact is: ${contact}. I'm interested in your services.`
  );
  window.open(`https://wa.me/254710823964?text=${msg}`, '_blank');
  document.querySelectorAll('.gb-lead-form').forEach(el => el.closest('.gb-row')?.remove());
  gbAddMsg(`✅ Thanks **${name}**! WhatsApp opened with your details. George will be in touch soon! 😊`, 'bot');
}

/* ══════════════════════════════
   TYPING INDICATOR
══════════════════════════════ */
function gbShowTyping() {
  const area    = document.getElementById('gbMsgs');
  const row     = document.createElement('div');
  row.className = 'gb-row bot';
  row.id        = 'gbTyping';

  const av       = document.createElement('div');
  av.className   = 'gb-rav';
  av.textContent = '🤖';

  const bub     = document.createElement('div');
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

/* ══════════════════════════════
   SEND → GEMINI API
══════════════════════════════ */
async function gbSend() {
  if (gbBusy) return;

  const input = document.getElementById('gbInput');
  const text  = input.value.trim();
  if (!text) return;

  document.getElementById('gbChips').style.display = 'none';
  input.value        = '';
  input.style.height = 'auto';

  gbAddMsg(text, 'user');
  gbHistory.push({ role: 'user', parts: [{ text }] });
  gbBusy = true;
  gbShowTyping();

  try {
    /* Try primary model first, fall back to gemini-2.5-flash-lite if 404 */
    let res = await fetch(GB_API_URL, {
      method  : 'POST',
      headers : { 'Content-Type': 'application/json' },
      body    : JSON.stringify({
        system_instruction: { parts: [{ text: GB_SYSTEM }] },
        contents          : gbHistory,
        generationConfig  : { maxOutputTokens: 600, temperature: 0.75 }
      }),
    });

    /* If primary model not found, try fallback */
    if (res.status === 404) {
      res = await fetch(GB_API_URL_FALLBACK, {
        method  : 'POST',
        headers : { 'Content-Type': 'application/json' },
        body    : JSON.stringify({
          contents        : [{ role: 'user', parts: [{ text: GB_SYSTEM + '\n\nUser: ' + text }] }],
          generationConfig: { maxOutputTokens: 600, temperature: 0.75 }
        }),
      });
    }

    const data = await res.json();
    gbRemoveTyping();

    if (data.error) {
      const code = data.error.code;
      const msg  = data.error.message;
      let friendly = `⚠️ API Error (${code}): ${msg}`;
      if (code === 400) friendly = '⚠️ Invalid API key. Check gogbot.js — key should have no extra quotes or semicolons.';
      if (code === 403) friendly = '⚠️ API key has no permission. Check aistudio.google.com.';
      if (code === 429) friendly = '⚠️ Too many requests. Please wait a moment and try again.';
      if (code === 404) friendly = '⚠️ Model not found. Please get a new API key from aistudio.google.com.';
      gbAddMsg(friendly + '\n\n**WhatsApp:** +254710823964', 'bot', 'hire');
      gbBusy = false;
      return;
    }

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Sorry, I could not generate a response. Please try again!";

    gbHistory.push({ role: 'model', parts: [{ text: reply }] });
    gbAddMsg(reply, 'bot', gbDetectIntent(text));

  } catch (err) {
    gbRemoveTyping();
    gbAddMsg(
      `⚠️ Network error: ${err.message}.\n\nPlease check your internet or reach George:\n**WhatsApp:** +254710823964\n**Email:** ndungugeorge065@gmail.com`,
      'bot', 'hire'
    );
  }

  gbBusy = false;
}

/* ══════════════════════════════
   TEXTAREA — DOM READY
══════════════════════════════ */
document.addEventListener('DOMContentLoaded', function () {
  const ta = document.getElementById('gbInput');
  if (!ta) return;

  ta.addEventListener('input', function () {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 80) + 'px';
  });

  ta.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      gbSend();
    }
  });
});
