import { sendTelegram } from './telegram.js';
import { sendWhatsApp } from './whatsapp.js';

const commands = [
  '!menu', '!help', '!ping', '!alive', '!owner', '!info', '!time', '!status',
  '!about', '!bible', '!verse', '!joke', '!meme', '!weather', '!news',
  '!translate', '!calc', '!remindme', '!privacy', '!terms'
];

const jokes = [
  'Why did the computer go to the doctor? It caught a virus. 💻',
  'Why was the maths book sad? It had too many problems. 📘',
  'I told my phone I needed space. It showed me storage settings. 📱',
  'Why do programmers prefer dark mode? Because light attracts bugs. 🐛'
];

function calculate(expression) {
  const input = String(expression || '').trim();
  if (!input || input.length > 80 || !/^[0-9+\-*/%.()\s]+$/.test(input)) return null;
  try {
    // Only numeric literals and arithmetic operators are allowed above.
    const result = Function('"use strict"; return (' + input + ')')();
    if (typeof result !== 'number' || !Number.isFinite(result)) return null;
    return Number(result.toPrecision(12)).toString();
  } catch {
    return null;
  }
}

function makeReply(text) {
  const input = String(text || '').trim();
  if (!input) return 'Send a command or type !menu to see what I can do.';
  const [rawCommand, ...args] = input.split(/\s+/);
  const cmd = rawCommand.toLowerCase();
  const argText = args.join(' ').trim();

  if (!cmd.startsWith('!')) return '🤖 I received your message. Type !menu to see available commands.';
  if (cmd === '!ping') return 'Pong 🟢 FlexBot is online.';
  if (cmd === '!alive' || cmd === '!status') return '🟢 FlexBot is online and responding.';
  if (cmd === '!time') return '🕒 Server time (UTC): ' + new Date().toISOString();
  if (cmd === '!menu' || cmd === '!help') {
    return '🤖 FLEXBOT COMMAND MENU\n' + commands.join('  •  ') +
      '\n\nWorking now: ping, alive, status, time, owner, info, about, joke, meme, calc, privacy, terms.\nSome online services need API setup.';
  }
  if (cmd === '!owner') return '👑 FlexBot owner: ' + (process.env.BOT_OWNER_NAME || 'the bot administrator') + '.';
  if (cmd === '!info' || cmd === '!about') {
    return '🤖 FlexBot is a multi-platform bot foundation for Telegram and WhatsApp. Type !menu for commands.';
  }
  if (cmd === '!joke') return '😄 ' + jokes[Math.floor(Math.random() * jokes.length)];
  if (cmd === '!meme') return '😂 Meme idea: “Me: I will sleep early. Also me at 2 AM: one last scroll.”';
  if (cmd === '!calc') {
    const result = calculate(argText);
    return result === null ? '🧮 Usage: !calc 12*(4+3). Use numbers and + - * / % parentheses only.' : '🧮 Result: ' + result;
  }
  if (cmd === '!privacy') {
    return '🔒 Privacy: FlexBot should only process messages needed to answer commands and operate the bot. Do not send passwords, verification codes, or sensitive personal information.';
  }
  if (cmd === '!terms') {
    return '📄 Terms: Use FlexBot lawfully and respectfully. Availability depends on platform access, configured integrations, and service uptime.';
  }
  if (cmd === '!bible' || cmd === '!verse') {
    return '📖 Bible lookup is not connected to a verified scripture source yet, so I will not invent a verse. The feature can be enabled when a trusted source is configured.';
  }
  if (cmd === '!weather') return '🌦️ Weather lookup is not configured yet. Add a weather provider/API before using this command.';
  if (cmd === '!news') return '📰 News lookup is not configured yet. Add a trusted news provider/API before using this command.';
  if (cmd === '!translate') return '🌍 Usage: !translate <text>. Translation provider is not connected yet.';
  if (cmd === '!remindme') return '⏰ Reminders are not enabled yet. A scheduler and persistent reminder storage must be connected first.';
  return '❓ Unknown command. Type !menu to see the command list.';
}

export async function handleCommand(text, sender, channel) {
  const reply = makeReply(text).slice(0, 3500);
  if (channel === 'telegram') return sendTelegram(sender, reply);
  return sendWhatsApp(sender, reply);
}
