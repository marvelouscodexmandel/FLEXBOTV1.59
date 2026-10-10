import { sendTelegram } from './telegram.js';
import { sendWhatsApp } from './whatsapp.js';

const CORE_COMMANDS = [
  ['menu', 'Show the command menu'], ['help', 'Show help'], ['ping', 'Check that the bot responds'],
  ['alive', 'Check bot status'], ['status', 'Check bot status'], ['owner', 'Show bot owner'],
  ['info', 'About FlexBot'], ['about', 'About FlexBot'], ['time', 'Current server time'],
  ['date', 'Current date'], ['joke', 'Tell a joke'], ['meme', 'Get a meme idea'],
  ['calc', 'Calculate an arithmetic expression'], ['privacy', 'Privacy guidance'], ['terms', 'Terms of use'],
  ['bible', 'Bible lookup status'], ['verse', 'Bible lookup status'], ['weather', 'Weather service status'],
  ['news', 'News service status'], ['translate', 'Translation helper'], ['remindme', 'Reminder setup status'],
  ['wordcount', 'Count words and characters'], ['uppercase', 'Convert text to uppercase'],
  ['lowercase', 'Convert text to lowercase'], ['titlecase', 'Convert text to title case'],
  ['reverse', 'Reverse text'], ['choose', 'Choose randomly from options'], ['poll', 'Draft a poll'],
  ['quote', 'Share a motivational quote'], ['motivate', 'Get a motivational message']
];

const GROUPS = {
  study: ['plan','explain','quiz','flashcards','summary','notes','examples','revision','timetable','homework','maths','physics','chemistry','biology','english','economics','geography','history','civics','vocabulary','spelling','essay','debate','exam-tips','teach'],
  writing: ['email','letter','apology','thankyou','invitation','announcement','caption','bio','story','poem','speech','essay','rewrite','proofread','headline','slogan','script','proposal','report','review','complaint','application','cover-letter','birthday','goodnight'],
  productivity: ['todo','plan','goals','priorities','schedule','routine','focus','breakdown','checklist','decision','pros-cons','meeting','agenda','minutes','project','deadline','habit','tracker','weekly-review','daily-review','budget','saving','shopping-list','meal-plan','travel-plan'],
  business: ['idea','business-plan','pitch','marketing','branding','customer-reply','product-description','pricing','sales-script','promotion','content-calendar','competitor-checklist','market-research','customer-survey','faq','invoice-note','follow-up','negotiation','launch-plan','risk-checklist','team-brief','job-post','interview','resume','presentation'],
  social: ['greeting','reply','conversation','friendship','compliment','congratulations','condolence','encouragement','boundary','respectful-no','conflict','make-peace','group-rules','group-description','group-poll','event-invite','thank-admin','welcome-member','status-update','relationship-advice','icebreaker','fun-question','party-game','team-name','nickname'],
  tech: ['debug-checklist','code-explain','javascript','html','css','nodejs','api-plan','database-plan','git-help','github-help','vscode-help','website-plan','app-plan','security-checklist','password-tips','backup-plan','troubleshoot','regex-explain','json-example','sql-example','command-line','project-readme','test-plan','deployment-checklist','learn-coding'],
  wellbeing: ['mood-check','stress-reset','breathing','journal','confidence','self-care','sleep-routine','study-break','kind-self-talk','gratitude','calm-down','motivation','procrastination','healthy-boundaries','ask-for-help','positive-habit','screen-break','reflection','small-step','problem-solve','listen','encourage','reset-day','energy-check','support-message'],
  creativity: ['brainstorm','song-idea','chorus','rap-idea','brand-name','logo-brief','video-idea','short-video','podcast-idea','character','worldbuild','plot','plot-twist','scene','dialogue','game-idea','game-quest','challenge','meme-caption','funny-line','tagline','visual-prompt','ad-script','story-prompt','creative-block'],
  language: ['define','synonym','antonym','sentence','grammar','tense','punctuation','pronunciation-tips','vocabulary-list','word-of-day','paraphrase','simplify','formal-tone','casual-tone','pidgin-rephrase','translate-help','reading-practice','conversation-practice','comprehension','idiom','metaphor','simile','spelling-quiz','sentence-fix','learn-english'],
  daily: ['check-in','quick-plan','decision-helper','reminder-text','thank-you-note','apology-text','birthday-wish','good-morning','good-night','affirmation','quote-of-day','random-choice','pros-and-cons','estimate','percentage','unit-conversion','time-management','packing-list','cleaning-plan','study-motivation','workout-plan','water-break','digital-detox','weekend-plan','goal-review']
};

const ACTIONS = Object.entries(GROUPS).flatMap(([group, actions]) =>
  actions.map(action => ({ name: group + '-' + action, group, action }))
);
const CORE = CORE_COMMANDS.map(([name, description]) => ({ name, group: 'core', action: name, description }));
const ALL = [...CORE, ...ACTIONS];
const COMMANDS = new Map(ALL.map(c => ['!' + c.name, c]));
const jokes = [
  'Why did the computer go to the doctor? It caught a virus. 💻',
  'Why was the maths book sad? It had too many problems. 📘',
  'I told my phone I needed space. It showed me storage settings. 📱',
  'Why do programmers prefer dark mode? Because light attracts bugs. 🐛'
];
const quotes = [
  'Small progress is still progress. Keep moving. 🌱',
  'You do not have to do everything today; do the next right thing. ✨',
  'Discipline makes tomorrow easier. Start with one small step. 💪',
  'A mistake is information. Learn from it, then try again. 📘'
];

function calculate(expression) {
  const input = String(expression || '').trim();
  if (!input || input.length > 80 || !/^[0-9+\-*/%.()\s]+$/.test(input)) return null;
  try {
    const result = Function('"use strict"; return (' + input + ')')();
    if (typeof result !== 'number' || !Number.isFinite(result)) return null;
    return Number(result.toPrecision(12)).toString();
  } catch { return null; }
}

function titleCase(text) {
  return text.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}
function clean(text) { return String(text || '').trim().slice(0, 2500); }
function askForDetails(label, example) {
  return '📝 **' + label + '**\nSend me a few details and I’ll tailor it for you.\n\nExample: ' + example;
}
function makeMenu(page = '') {
  if (page) {
    const group = page.toLowerCase().replace(/^!/, '');
    const matches = ACTIONS.filter(c => c.group === group);
    if (matches.length) return '🤖 FLEXBOT — ' + group.toUpperCase() + ' COMMANDS\n' + matches.map(c => '!' + c.name).join('  •  ') + '\n\nUse a command with details after it. Example: !' + matches[0].name + ' help me with my goal';
  }
  return '🤖 FLEXBOT COMMAND MENU\n' +
    'Core: ' + CORE.map(c => '!' + c.name).join('  •  ') +
    '\n\nCategories (25 commands each):\n' + Object.keys(GROUPS).map(g => '• !' + g + ' — ' + g + ' tools').join('\n') +
    '\n\nTotal command triggers: ' + ALL.length + '.\nTry !study for study commands, !writing for writing commands, !productivity for planning, or !menu business.';
}

function groupReply(command, args) {
  const { group, action } = command;
  const detail = clean(args);
  const subject = detail || '[add your topic or details]';
  if (group === 'study') {
    const map = {
      plan: 'Create a realistic study plan for: ' + subject + '. Break it into short sessions, learning goals, practice questions and review time.',
      explain: 'Explain "' + subject + '" in simple language, then give an example, a common mistake and a short recap.',
      quiz: 'Quick quiz request: ' + subject + '. Ask one question at a time, wait for my answer, then explain the solution.',
      flashcards: 'Make flashcards for ' + subject + ' in Q → A format, focusing on definitions, key facts and examples.',
      summary: 'Summarise ' + subject + ' into key points, important terms and a 3-line recap.',
      notes: 'Make clear class notes on ' + subject + ' with headings, definitions, worked examples and a short review.',
      timetable: 'Build a weekly timetable for ' + subject + '. Ask for available hours, deadlines and other subjects if needed.',
      homework: 'Help me understand this homework: ' + subject + '. Show each step and explain why it works.',
      maths: 'Maths helper for ' + subject + ': show the formula, substitute values, calculate step by step, then check the answer.',
      'exam-tips': 'Give an exam strategy for ' + subject + ': what to revise, how to practise, time management and common errors.'
    };
    return '📚 ' + (map[action] || 'Study tool: ' + action + '\nTopic: ' + subject + '\n\nI can help you learn it with simple explanations, examples and practice. Send the exact topic or question.');
  }
  if (group === 'writing') {
    const prompts = {
      email: 'Draft an email about ' + subject + '. Include a clear subject, polite opening, main point and next step.',
      letter: 'Draft a well-structured letter about ' + subject + '. Choose a suitable tone and leave placeholders for missing facts.',
      caption: 'Create 5 short, memorable captions about ' + subject + ' with different vibes.',
      bio: 'Create 3 bio options based on ' + subject + ': simple, confident and creative.',
      poem: 'Write an original poem about ' + subject + ' with vivid imagery and a memorable ending.',
      speech: 'Draft a speech about ' + subject + ' with a strong opening, 3 main points and a clear closing.',
      rewrite: 'Rewrite this clearly while keeping the original meaning: ' + subject,
      proofread: 'Proofread this text for grammar, spelling and clarity. Explain important changes: ' + subject,
      'cover-letter': 'Create a tailored cover letter for ' + subject + '. Highlight relevant skills without inventing experience.',
      script: 'Create a short script about ' + subject + ' with a hook, natural dialogue and a strong ending.'
    };
    return '✍️ ' + (prompts[action] || 'Writing helper: ' + action + '\nBrief: ' + subject + '\n\nShare the audience, tone and length you want. I can prepare a copy-ready draft using only the details you provide.');
  }
  if (group === 'productivity') {
    const prompts = {
      todo: 'Turn this into a prioritised to-do list: ' + subject,
      plan: 'Create a practical action plan for: ' + subject + '. Include the first step, sequence, time estimate and definition of done.',
      goals: 'Turn this goal into a specific, measurable goal with milestones: ' + subject,
      priorities: 'Rank these tasks by urgency and importance, and suggest what to do first: ' + subject,
      checklist: 'Create a step-by-step checklist for: ' + subject,
      'pros-cons': 'Compare the advantages, disadvantages, risks and unknowns of: ' + subject,
      budget: 'Create a simple budget outline for: ' + subject + '. Ask for income and costs if amounts are missing.',
      'weekly-review': 'Weekly review for ' + subject + ': wins, unfinished work, lessons, next priorities and one thing to stop doing.'
    };
    return '✅ ' + (prompts[action] || 'Productivity helper: ' + action + '\nFocus: ' + subject + '\n\nI’ll help break it into clear, manageable steps. Add your deadline and available time for a more precise plan.');
  }
  if (group === 'business') {
    const prompts = {
      idea: 'Develop this business idea: ' + subject + '. Cover the customer, problem, solution, low-cost test and main risks.',
      'business-plan': 'Create a lean business plan for ' + subject + ': customer, value proposition, product, channels, costs, revenue and first 30 days.',
      pitch: 'Build a 30-second pitch for ' + subject + ': problem, solution, audience, advantage and ask.',
      marketing: 'Make a practical marketing plan for ' + subject + ' with audience, message, content ideas, channel and metrics.',
      branding: 'Create a brand brief for ' + subject + ': purpose, audience, personality, name direction, colours and tagline ideas.',
      'customer-reply': 'Draft a helpful customer response for this situation: ' + subject + '. Be polite, specific and honest.',
      resume: 'Help improve a CV for ' + subject + '. Use truthful achievements and measurable results; do not invent qualifications.'
    };
    return '💼 ' + (prompts[action] || 'Business helper: ' + action + '\nProject: ' + subject + '\n\nI can help with a practical outline, sample wording, checklist or launch steps. Tell me your audience and budget if relevant.');
  }
  if (group === 'social') {
    const prompts = {
      greeting: 'Create a warm greeting for: ' + subject,
      reply: 'Suggest 3 natural replies to this message: "' + subject + '". Give friendly, neutral and playful options.',
      compliment: 'Write a sincere, respectful compliment about: ' + subject,
      'respectful-no': 'Help me say no respectfully about: ' + subject + '. Keep it kind, clear and firm.',
      conflict: 'Help handle this disagreement: ' + subject + '. Separate facts from assumptions and suggest a calm message.',
      'group-rules': 'Draft fair group rules for: ' + subject + ' including respect, spam, privacy and consequences.',
      icebreaker: 'Give 10 friendly conversation starters for: ' + subject,
      'relationship-advice': 'Think through this relationship situation: ' + subject + '. Focus on respect, boundaries, honest communication and safety.'
    };
    return '💬 ' + (prompts[action] || 'Social helper: ' + action + '\nSituation: ' + subject + '\n\nI’ll keep the wording natural, respectful and appropriate. Share who it is for and the tone you want.');
  }
  if (group === 'tech') {
    const prompts = {
      'debug-checklist': 'Debug this issue: ' + subject + '. Check the exact error, reproduce it, inspect inputs, isolate the cause and test the fix.',
      'code-explain': 'Explain this code or technical concept in beginner-friendly steps: ' + subject,
      javascript: 'JavaScript helper for: ' + subject + '. Include a minimal example, explanation and common pitfall.',
      html: 'HTML helper for: ' + subject + '. Show accessible semantic markup and explain each element.',
      css: 'CSS helper for: ' + subject + '. Give a responsive example and explain the key rules.',
      nodejs: 'Node.js helper for: ' + subject + '. Include setup, code, run command and error checks.',
      'api-plan': 'Design an API for: ' + subject + '. Define routes, inputs, outputs, validation, authentication and error responses.',
      'security-checklist': 'Security checklist for: ' + subject + '. Cover secrets, input validation, access control, logging and updates.',
      'deployment-checklist': 'Deployment checklist for: ' + subject + '. Check environment variables, build/start commands, health route, logs and rollback.'
    };
    return '🛠️ ' + (prompts[action] || 'Tech helper: ' + action + '\nTask: ' + subject + '\n\nShare your language, framework, exact error and what you expected. Never send passwords, access tokens or private keys.');
  }
  if (group === 'wellbeing') {
    const prompts = {
      'mood-check': 'Pause for a quick check-in: what are you feeling, what might have triggered it, and what is one small thing that could help right now?',
      'stress-reset': 'Try a gentle reset: relax your shoulders, take a few slow comfortable breaths, name one thing you can control, then choose one small next step.',
      breathing: 'Take a comfortable, unforced breath in and a slow breath out. Repeat gently for about a minute; stop if you feel dizzy or uncomfortable.',
      journal: 'Journal prompts for ' + subject + ': What happened? What did I feel? What do I need? What is one kind next step?',
      confidence: 'Confidence practice for ' + subject + ': name one strength, one skill you can practise and one small action you can take today.',
      'ask-for-help': 'A simple way to ask for help: “I’m dealing with [situation], and I could use help with [specific need]. Are you available to talk?”'
    };
    return '🌿 ' + (prompts[action] || 'Wellbeing helper: ' + action + '\n' + (detail ? 'Your note: ' + detail + '\n' : '') + '\nChoose one small, realistic step rather than trying to fix everything at once. If you may be in immediate danger, contact local emergency help or a trusted person nearby.');
  }
  if (group === 'creativity') {
    const prompts = {
      brainstorm: 'Brainstorm 10 distinct ideas for: ' + subject + '. Include safe, low-cost and unusual options.',
      'song-idea': 'Create a song concept for ' + subject + ': title, emotion, central image, chorus hook and verse direction.',
      chorus: 'Suggest 5 original chorus hooks about ' + subject + '. Keep each one memorable and easy to sing.',
      'brand-name': 'Generate 15 original name directions for ' + subject + ', with a short meaning for each.',
      'video-idea': 'Create 5 video concepts for ' + subject + ' with a first-3-second hook, main scene and ending.',
      plot: 'Build a story plot for ' + subject + ' with a goal, obstacle, turning point, climax and ending.',
      'visual-prompt': 'Write a detailed visual-generation prompt for ' + subject + ' including subject, composition, lighting, mood and aspect ratio.'
    };
    return '🎨 ' + (prompts[action] || 'Creative helper: ' + action + '\nConcept: ' + subject + '\n\nI’ll help turn it into a more original, clear idea. Tell me the style, audience and mood.');
  }
  if (group === 'language') {
    const prompts = {
      define: 'Explain the meaning of "' + subject + '" in simple language, then give two examples.',
      synonym: 'Suggest synonyms for "' + subject + '" and explain which fits formal, casual or emotional writing.',
      antonym: 'Give common opposites of "' + subject + '" with example sentences.',
      sentence: 'Create 5 example sentences using "' + subject + '" in different contexts.',
      grammar: 'Explain the grammar question "' + subject + '" with a simple rule and corrected examples.',
      paraphrase: 'Paraphrase this while keeping its meaning: ' + subject,
      simplify: 'Rewrite this in simpler language without losing the main meaning: ' + subject,
      'formal-tone': 'Rewrite this in a polite, professional tone: ' + subject,
      'casual-tone': 'Rewrite this in a natural, relaxed tone: ' + subject
    };
    return '🌍 ' + (prompts[action] || 'Language helper: ' + action + '\nText/topic: ' + subject + '\n\nI can explain, simplify or practise this with examples. Add the language and level if you have a preference.');
  }
  if (group === 'daily') {
    const prompts = {
      'quick-plan': 'Quick plan for ' + subject + ': 1) choose the most important outcome, 2) do a 10-minute first step, 3) remove one distraction, 4) review progress.',
      'decision-helper': 'Decision helper for ' + subject + ': list your options, what matters most, costs, risks, reversibility and the smallest safe test.',
      'birthday-wish': 'Create a birthday message for ' + subject + '. Tell me your relationship and whether you want it funny, heartfelt or short.',
      'good-morning': 'Good morning! ☀️ Take today one step at a time. What is the one thing you most want to finish today?',
      'good-night': 'Good night 🌙 Let the day rest. You can learn from what happened without carrying every worry into tomorrow.',
      'percentage': {
        run: () => 'Usage: !daily-percentage <percentage> of <number>, e.g. !daily-percentage 15 of 200. For direct arithmetic, use !calc 15%*200.'
      },
      estimate: 'Estimate helper for ' + subject + ': state your assumptions, calculate a low/likely/high range, then check the biggest uncertainty.',
      'time-management': 'Time-management plan for ' + subject + ': pick one priority, estimate its duration, work in a focused block, take a short break and review.'
    };
    const p = prompts[action];
    if (typeof p === 'object' && p.run) return p.run();
    return '📌 ' + (p || ('Daily helper: ' + action + '\n' + (detail || 'Tell me what you need help organising.') + '\n\nI’ll help you make a practical next-step plan.'));
  }
  return 'Tell me a little more about: ' + subject;
}

function naturalReply(text) {
  const s = clean(text);
  const lower = s.toLowerCase();
  if (/^(hi|hello|hey|heyy|good morning|good afternoon|good evening|how far|sup|what's up)[!.? ]*$/.test(lower)) {
    return 'Hey there! 👋 I’m FlexBot. What can I help you with today? You can ask normally or type !menu to see my tools.';
  }
  if (/^(thanks|thank you|thank u|tnx|thx|appreciate it)[!. ]*$/.test(lower)) return 'You’re welcome! 😊 Anything else you’d like help with?';
  if (/^(bye|goodbye|see you|later)[!. ]*$/.test(lower)) return 'See you! 👋 Message me whenever you need a hand.';
  if (/\b(help me|can you help|i need help|what can you do)\b/.test(lower)) return 'Absolutely — I can help with study, writing, planning, business ideas, coding, conversation replies and creative work. Try !menu, !study, !writing, !productivity, !business or !tech.';
  if (/\b(sad|depressed|lonely|stressed|overwhelmed|worried|anxious|i feel bad)\b/.test(lower)) return 'I’m sorry things feel heavy right now. 💛 If you want, tell me what happened and I’ll listen without judging. We can also work out one small next step. If you feel unsafe, please contact a trusted person nearby or local emergency support.';
  if (/\b(joke|make me laugh|something funny)\b/.test(lower)) return '😄 ' + jokes[Math.floor(Math.random() * jokes.length)];
  if (/\b(motivate|motivation|encourage me|inspire me)\b/.test(lower)) return '💪 ' + quotes[Math.floor(Math.random() * quotes.length)];
  if (/\b(what time is it|current time|time now)\b/.test(lower)) return '🕒 Server time (UTC): ' + new Date().toISOString();
  if (/\b(calculate|what is|solve)\b/.test(lower) && /[0-9].*[+*/%-].*[0-9]/.test(lower)) {
    const expression = s.replace(/^(please\s+)?(calculate|what is|solve)\s*/i, '').replace(/[=?]+$/g, '').trim();
    const result = calculate(expression);
    if (result !== null) return '🧮 The answer is ' + result + '.';
  }
  if (/\?$/.test(s)) return 'Good question. 🙂 I’ll try to help: ' + s + '\n\nTell me any extra context you have, or type !menu to choose a specialised tool.';
  if (/^(https?:\/\/|www\.)/i.test(s)) return '🔗 I received the link. Tell me what you want to do with it — summarise, check, explain, or draft a reply. I can’t claim to have opened a link unless a connected service actually retrieves it.';
  return '🤖 I got your message: “' + s.slice(0, 450) + '”\n\nI can help you work through it. What would you like me to do — explain it, suggest a reply, summarise it, or make a plan? Type !menu to explore my tools.';
}

function makeReply(text) {
  const input = clean(text);
  if (!input) return 'Send a message or type !menu to see what I can do.';
  const [rawCommand, ...args] = input.split(/\s+/);
  const cmd = rawCommand.toLowerCase();
  const argText = args.join(' ').trim();

  if (!cmd.startsWith('!')) return naturalReply(input);
  if (cmd === '!menu' || cmd === '!help') return makeMenu(argText);
  if (cmd === '!study' || cmd === '!writing' || cmd === '!productivity' || cmd === '!business' || cmd === '!social' || cmd === '!tech' || cmd === '!wellbeing' || cmd === '!creativity' || cmd === '!language' || cmd === '!daily') {
    const group = cmd.slice(1);
    return '🤖 ' + group.toUpperCase() + ' TOOLS\n' + ACTIONS.filter(c => c.group === group).map(c => '!' + c.name).join('  •  ') + '\n\nExample: !' + group + '-' + GROUPS[group][0] + ' ' + (argText || 'your topic here');
  }
  if (cmd === '!ping') return 'Pong 🟢 FlexBot is responding.';
  if (cmd === '!alive' || cmd === '!status') return '🟢 FlexBot is online and responding.';
  if (cmd === '!time') return '🕒 Server time (UTC): ' + new Date().toISOString();
  if (cmd === '!date') return '📅 Current date (UTC): ' + new Date().toISOString().slice(0, 10);
  if (cmd === '!owner') return '👑 FlexBot owner: ' + (process.env.BOT_OWNER_NAME || 'the bot administrator') + '.';
  if (cmd === '!info' || cmd === '!about') return '🤖 FlexBot is a multi-platform productivity bot with study, writing, planning, business, social, tech and creative helpers.';
  if (cmd === '!joke') return '😄 ' + jokes[Math.floor(Math.random() * jokes.length)];
  if (cmd === '!meme') return '😂 Meme idea: “Me: I will sleep early. Also me at 2 AM: one last scroll.”';
  if (cmd === '!quote' || cmd === '!motivate') return '✨ ' + quotes[Math.floor(Math.random() * quotes.length)];
  if (cmd === '!calc') {
    const result = calculate(argText);
    return result === null ? '🧮 Usage: !calc 12*(4+3). Use numbers and + - * / % parentheses only.' : '🧮 Result: ' + result;
  }
  if (cmd === '!wordcount') return '🔤 Words: ' + (argText.match(/\S+/g) || []).length + ' | Characters: ' + argText.length;
  if (cmd === '!uppercase') return argText ? argText.toUpperCase() : 'Usage: !uppercase your text';
  if (cmd === '!lowercase') return argText ? argText.toLowerCase() : 'Usage: !lowercase YOUR TEXT';
  if (cmd === '!titlecase') return argText ? titleCase(argText) : 'Usage: !titlecase your text';
  if (cmd === '!reverse') return argText ? Array.from(argText).reverse().join('') : 'Usage: !reverse your text';
  if (cmd === '!choose') {
    const options = argText.split(/[|,]/).map(s => s.trim()).filter(Boolean);
    return options.length < 2 ? 'Usage: !choose rice | pasta | noodles' : '🎲 My pick: ' + options[Math.floor(Math.random() * options.length)];
  }
  if (cmd === '!poll') return argText ? '📊 Poll draft:\nQuestion: ' + argText + '\nOptions:\n1. Yes\n2. No\n3. Not sure' : 'Usage: !poll Should we hold a game night?';
  if (cmd === '!privacy') return '🔒 Do not send passwords, verification codes, access tokens or sensitive personal information. Only share information needed for the task.';
  if (cmd === '!terms') return '📄 Use FlexBot lawfully and respectfully. Some features depend on external services and may not be available until configured.';
  if (cmd === '!bible' || cmd === '!verse') return '📖 Verified Bible lookup is not connected yet, so I will not invent a verse. Provide the passage text if you want help explaining it.';
  if (cmd === '!weather') return '🌦️ Live weather needs a weather provider/API, which is not configured in this backend yet.';
  if (cmd === '!news') return '📰 Live news needs a trusted news provider/API, which is not configured in this backend yet.';
  if (cmd === '!translate' || cmd === '!language-translate-help') return argText ? '🌍 I can help rephrase or explain text, but an automatic translation provider is not connected. Tell me the target language and I’ll prepare guidance.' : 'Usage: !translate your text (include the target language).';
  if (cmd === '!remindme') return '⏰ Persistent reminders are not enabled yet; a scheduler and reminder storage need to be added before I can promise to remind you later.';

  const found = COMMANDS.get(cmd);
  if (found) return groupReply(found, argText);
  return '❓ I don’t recognise "' + cmd + '". Type !menu to see commands, or send a normal message and I’ll try to respond.';
}

export async function handleCommand(text, sender, channel) {
  const reply = makeReply(text).slice(0, 3500);
  if (channel === 'telegram') return sendTelegram(sender, reply);
  return sendWhatsApp(sender, reply);
}
