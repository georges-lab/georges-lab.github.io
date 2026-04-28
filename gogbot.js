/* ═══════════════════════════════════════════════
   GOGBOT — gogbot.js
   Powered by Google Gemini API (browser-safe)
   georges-lab.github.io

   SETUP:
   1. Go to aistudio.google.com
   2. Click "Get API Key" → "Create API key"
   3. Replace YOUR_GEMINI_API_KEY_HERE below
      with your actual key (starts with AIzaSy...)
   ═══════════════════════════════════════════════ */

const GB_API_KEY = "AIzaSyAYJ7jCjigXjSwzWEf3m3N9Wlke0ds3rMs";
const GB_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GB_API_KEY}`;

const GB_SYSTEM = `You are GogBot, the intelligent AI assistant embedded on George Ndung'u's professional portfolio website (https://georges-lab.github.io/). Your job is to represent George professionally, answer visitor questions intelligently, qualify leads, and guide interested clients toward contacting George.

WHO GEORGE IS:
George Ndung'u is a skilled Kenyan web developer, UI/UX designer, and IT technician based in Nairobi, Kenya. He crafts websites for ideas, businesses and dreams, one line of code at a time. He has real verified clients and completed projects.

GEORGE'S SERVICES:

1. Web Design & Development
- Custom website design and development from scratch
- Responsive, mobile-first websites
- Uses HTML, CSS, JavaScript, PHP, and WordPress
- Builds everything from simple landing pages to complex web apps
- eCommerce websites (like scotchandgin.delivery)
- Events and business websites (like delightinternational.co.ke)

2. POS (Point of Sale) Software Development
- Custom POS systems tailored for Kenyan businesses
- Features: Sales tracking, inventory management, receipt generation, reporting dashboards
- M-Pesa payment integration built into POS
- Cloud and local deployment options
- Ideal for: retail shops, restaurants, supermarkets, pharmacies
- George has a working demo video on his site

3. M-Pesa API Integration (Daraja API)
- Integrates Safaricom's Daraja API into websites and apps
- STK Push (Lipa Na M-Pesa Online) — customer pays via phone prompt
- C2B and B2C payments
- Transaction confirmation and status callbacks
- Perfect for: eCommerce checkout, school fees, booking systems, SACCOs

4. Web Scraping
- Automated bots/scrapers to extract data from websites
- Use cases: price monitoring, lead generation, market research
- Uses Python (BeautifulSoup, Scrapy, Selenium)

5. Task Automation
- Automates repetitive business tasks using Python scripts
- File processing, data entry, email automation, report generation

6. Chatbot Creation
- Website visitor chatbots to improve conversion and sales
- AI-powered and rule-based chatbots

7. Computer & IT Tech
- Computer repair and maintenance
- Hardware and software troubleshooting, networking

GEORGE'S SKILLS:
HTML: 99% | CSS: 99% | WordPress: 99% | JavaScript: 87% | Python: 89% | PHP: 73%

COMPLETED PROJECTS:
1. delightinternational.co.ke — Events company website (WordPress)
2. scotchandgin.delivery — Full eCommerce website
3. Custom Chatbot — Website visitor chatbot
4. M-Pesa API Integration — Dynamic online payment system
5. Task Automation Script — Python office automation
6. Weather App — Python weather prediction app
7. Custom POS System — Full Point of Sale software (demo on site)

CLIENT TESTIMONIALS:
- Liz Atieno (Otiende, Nairobi): "Working with George was a pleasure! Responsive, visually appealing, user-friendly. Delivered on time."
- Mary Kavesu (Imara-daima, Nairobi): "The transformation was amazing! New design is sleek and modern. Already seeing increased traffic."

CONTACT & PRICING:
- WhatsApp: +254710823964
- Email: ndungugeorge065@gmail.com
- Location: 00200-52491, Nairobi, Kenya
- WhatsApp link: https://wa.me/254710823964?text=Hello%20George,%20I'm%20interested%20in%20your%20services.
- Pricing is custom per project. Always direct visitors to WhatsApp or email for a free quote.

BEHAVIOUR RULES:
- Be friendly, professional, and confident
- Use **bold** for key terms
- Use code blocks (triple backticks) for code snippets
- When visitors ask about pricing, explain it depends on project scope and direct them to WhatsApp
- For hiring or contact intent, always include the WhatsApp CTA
- Qualify leads by asking about their project type and timeline
- Never make up projects or promise specific prices
- Keep replies concise and practical
- Do not use markdown headers (##). Use bold and bullet points only`;

/* ── Smart quick reply sets based on detected intent ── */
const GB_QR_SETS = {
  default : ["Tell me more 💬",           "How do I contact George?",    "See George's work"],
  pricing : ["Get a free quote on WhatsApp", "What affects the price?",  "What's included?"],
  pos     : ["Does it work offline?",      "Can it integrate M-Pesa?",   "See POS demo"],
  mpesa   : ["How long does it take?",     "What's the cost?",           "Get started 🚀"],
  hire    : ["Chat on WhatsApp 💬",        "Send an email 📧",           "Tell me about your services"],
  web     : ["Do you do eCommerce?",       "How long does it take?",     "Can you redesign my site?"],
};

/* ── App state ── */
let gbHistory      = [];   // Gemini format: { role: "user"|"model", parts: [{ text }] }
let gbBusy         = false;
let gbOpen         = false;
let gbLeadCaptured = false;
let gbMsgCount     = 0;

/* ══════════════════════════════
   TOGGLE OPEN / CLOSE
══════════════════════════════ */
function gbToggle() {
  gbOpen = !gbOpen;

  const win   = document.getElementById('gogbot-window');
  const btn   = document.getElementById('gogbot-toggle');
  const badge = document.getElementById('gbBadge');

  win.classList.toggle('open', gbOpen);
  btn.classList.toggle('open', gbOpen);

  if (badge) badge.remove();

  /* Show welcome message on first open */
  if (gbOpen && document.getElementById('gbMsgs').children.length === 0) {
    setTimeout(() => {
      gbAddMsg(
        `👋 Hi there! I'm **GogBot**, George's AI assistant.\n\nI can help you with:\n- 🌐 Web design & development\n- 🛒 POS software solutions\n- 💳 M-Pesa API integration\n- 🤖 Web scraping & automation\n\nWhat are you looking to build today?`,
        'bot',
        'hire'
      );
    }, 350);
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
   UTILITY FUNCTIONS
══════════════════════════════ */
function gbNow() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function gbEsc(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function gbFmt(t) {
  /* Code blocks */
  t = t.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, l, c) =>
    `<pre><code>${gbEsc(c.trim())}</code></pre>`);
  /* Inline code */
  t = t.replace(/`([^`]+)`/g, '<code>$1</code>');
  /* Bold */
  t = t.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  /* Bullet lists */
  t = t.replace(/^[-•*]\s+(.+)/gm, '<li>$1</li>');
  t = t.replace(/(<li>[\s\S]*?<\/li>\n?)+/g, m => `<ul>${m}</ul>`);
  /* Numbered lists */
  t = t.replace(/^\d+\.\s+(.+)/gm, '<li>$1</li>');
  /* Line breaks */
  t = t.replace(/\n/g, '<br>');
  return t;
}

function gbDetectIntent(text) {
  const t = text.toLowerCase();
  if (/price|cost|how much|rate|quote|budget|fee|charge/.test(t))               return 'pricing';
  if (/pos|point.of.sale|inventory|receipt|cashier|retail|shop|till/.test(t))   return 'pos';
  if (/mpesa|m-pesa|safaricom|daraja|stk push|lipa|payment/.test(t))            return 'mpesa';
  if (/hire|contact|whatsapp|email|work with|get started|start|project/.test(t)) return 'hire';
  if (/web|website|wordpress|ecommerce|landing|redesign|responsive/.test(t))    return 'web';
  return 'default';
}

/* ══════════════════════════════
   ADD MESSAGE BUBBLE
══════════════════════════════ */
function gbAddMsg(content, role, intentOverride) {
  const area = document.getElementById('gbMsgs');

  /* Remove previous quick replies */
  area.querySelectorAll('.gb-qrs').forEach(e => e.remove());

  /* Build row */
  const row = document.createElement('div');
  row.className = `gb-row ${role}`;

  /* Bot avatar */
  if (role === 'bot') {
    const av       = document.createElement('div');
    av.className   = 'gb-rav';
    av.textContent = '🤖';
    row.appendChild(av);
  }

  /* Bubble */
  const bub     = document.createElement('div');
  bub.className = 'gb-bub';

  const intent = intentOverride || gbDetectIntent(content);

  /* WhatsApp CTA for hire/pricing intent after first exchange */
  let ctaHtml = '';
  if (role === 'bot' && (intent === 'hire' || intent === 'pricing') && gbMsgCount > 1) {
    ctaHtml = `<br><a class="gb-cta" href="https://wa.me/254710823964?text=Hello%20George,%20I'm%20interested%20in%20your%20services." target="_blank">💬 Chat on WhatsApp</a>`;
  }

  bub.innerHTML = gbFmt(content) + ctaHtml + `<div class="ts">${gbNow()}</div>`;
  row.appendChild(bub);
  area.appendChild(row);

  /* Smart quick replies after every bot message */
  if (role === 'bot') {
    const qrs    = GB_QR_SETS[intent] || GB_QR_SETS.default;
    const qrDiv  = document.createElement('div');
    qrDiv.className = 'gb-qrs';

    qrs.forEach(q => {
      const b       = document.createElement('button');
      b.className   = 'gb-qr';
      b.textContent = q;
      b.onclick     = () => {
        document.getElementById('gbInput').value = q;
        gbSend();
      };
      qrDiv.appendChild(b);
    });

    area.appendChild(qrDiv);

    /* Show lead form after 3 bot messages */
    gbMsgCount++;
    if (gbMsgCount === 3 && !gbLeadCaptured) {
      setTimeout(gbShowLeadForm, 800);
    }
  }

  area.scrollTop = area.scrollHeight;
}

/* ══════════════════════════════
   LEAD CAPTURE FORM
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
    Looks like you're interested! Drop your details and George will reach out to you directly 👇
    <div class="gb-lead-form" style="margin-top:10px;">
      <p>Get a free callback from George</p>
      <input class="gb-lead-input" id="gbLeadName"    type="text" placeholder="Your name" />
      <input class="gb-lead-input" id="gbLeadContact" type="text" placeholder="Phone or email" />
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

  if (!name || !contact) {
    alert('Please fill in both fields.');
    return;
  }

  gbLeadCaptured = true;

  /* Open WhatsApp with pre-filled message */
  const msg   = encodeURIComponent(
    `Hello George! I'm ${name}. I found you via your website chatbot. My contact is: ${contact}. I'm interested in your services.`
  );
  window.open(`https://wa.me/254710823964?text=${msg}`, '_blank');

  /* Remove the form */
  document.querySelectorAll('.gb-lead-form').forEach(el => el.closest('.gb-row')?.remove());

  gbAddMsg(
    `✅ Thanks **${name}**! WhatsApp has been opened with your details pre-filled. George will get back to you shortly.\n\nFeel free to keep asking me anything! 😊`,
    'bot'
  );
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
   SEND MESSAGE → GEMINI API
══════════════════════════════ */
async function gbSend() {
  if (gbBusy) return;

  const input = document.getElementById('gbInput');
  const text  = input.value.trim();
  if (!text) return;

  /* Hide chips after first message */
  document.getElementById('gbChips').style.display = 'none';
  input.value        = '';
  input.style.height = 'auto';

  /* Show user message and typing indicator */
  gbAddMsg(text, 'user');
  gbHistory.push({ role: 'user', parts: [{ text }] });
  gbBusy = true;
  gbShowTyping();

  try {
    const res = await fetch(GB_API_URL, {
      method  : 'POST',
      headers : { 'Content-Type': 'application/json' },
      body    : JSON.stringify({
        /* System instruction tells Gemini who GogBot is */
        system_instruction: {
          parts: [{ text: GB_SYSTEM }]
        },
        /* Full conversation history for context */
        contents: gbHistory,
        generationConfig: {
          maxOutputTokens : 800,
          temperature     : 0.7,
          topP            : 0.9,
        }
      }),
    });

    const data = await res.json();
    gbRemoveTyping();

    /* Handle API errors gracefully */
    if (data.error) {
      console.error('Gemini API error:', data.error);
      gbAddMsg(
        `⚠️ API error: ${data.error.message || 'Unknown error'}.\n\nPlease check your API key or contact George directly:\n**WhatsApp:** +254710823964`,
        'bot', 'hire'
      );
      gbBusy = false;
      return;
    }

    /* Extract Gemini's reply */
    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "I'm sorry, I couldn't generate a response. Please try again!";

    /* Add model reply to history and display it */
    gbHistory.push({ role: 'model', parts: [{ text: reply }] });
    gbAddMsg(reply, 'bot', gbDetectIntent(text));

  } catch (err) {
    gbRemoveTyping();
    console.error('GogBot fetch error:', err);
    gbAddMsg(
      `⚠️ Connection error. Please check your internet and try again.\n\nOr reach George directly:\n**WhatsApp:** +254710823964\n**Email:** ndungugeorge065@gmail.com`,
      'bot', 'hire'
    );
  }

  gbBusy = false;
}

/* ══════════════════════════════
   TEXTAREA — AUTO RESIZE + ENTER
══════════════════════════════ */
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
