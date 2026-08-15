require('dotenv').config();
const { Client, Routes } = require('fluxer.ts');
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'data.json');
const PREFIX = '!';
const OWNER_ID = 'SEU_USER_ID_AQUI';

let data = { users: {}, stats: { commandsUsed: 0, messagesSeen: 0, uptime: Date.now() } };

function loadData() {
  try { if (fs.existsSync(DATA_FILE)) data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); } catch {}
}
function saveData() { fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2)); }
function getUser(id) {
  if (!data.users[id]) data.users[id] = { xp: 0, level: 1, reputation: 0, coins: 0, daily: 0 };
  return data.users[id];
}
function addXP(id, amount) {
  const u = getUser(id);
  u.xp += amount;
  const needed = u.level * 100;
  if (u.xp >= needed) { u.level++; u.xp -= needed; return true; }
  return false;
}
function xpBar(xp, level) {
  const needed = level * 100;
  const filled = Math.round((xp / needed) * 10);
  return '█'.repeat(filled) + '░'.repeat(10 - filled);
}

loadData();

const client = new Client({
  intents: 1 << 0 | 1 << 9 | 1 << 15
});

const commands = {
  ping: { desc: 'Latencia do bot', fn: async (msg) => {
    const start = Date.now();
    const m = await client.sendMessage(msg.channel_id, '🏓 Calculando...');
    const latency = Date.now() - start;
    await client.editMessage(msg.channel_id, m.id, `🏓 **Pong!**\n⏱️ Latencia: ${latency}ms\n⚡ WebSocket: ${client.ws.ping || 'N/A'}ms`);
  }},

  aitrrl: { desc: 'Sobre o bot', fn: async (msg) => {
    const u = getUser(msg.author.id);
    await client.sendMessage(msg.channel_id, {
      content: `## 🤖 aitrrL\n\nOlá ${msg.author.username}! Eu sou a **aitrrL**, seu assistente pessoal no Fluxer!\n\n**Comandos:** \`${PREFIX}ajuda\`\n\n📊 **Suas stats:** Level ${u.level} | ${u.xp} XP | ${u.coins} moedas\n🏅 Reputação: ${u.reputation}\n\n> Desde 15 de Agosto de 2026`
    });
  }},

  calc: { desc: 'Calculadora', usage: '<expressao>', fn: async (msg, args) => {
    if (!args[0]) return client.sendMessage(msg.channel_id, '❌ Use: `!calc 2+2`');
    try {
      const expr = args.join('').replace(/[^0-9+\-*/().]/g, '');
      const result = Function('"use strict"; return (' + expr + ')')();
      await client.sendMessage(msg.channel_id, `🔢 **${expr}** = **${result}**`);
    } catch { await client.sendMessage(msg.channel_id, '❌ Expressao invalida'); }
  }},

  oitobola: { desc: 'Bola 8 magica', fn: async (msg) => {
    const r = ['Sim!', 'Nao!', 'Talvez...', 'Claro!', 'Com certeza!', 'Nao conte com isso', 'Depende', 'Obviamente!', 'Duvido muito', 'De jeito nenhum!'];
    await client.sendMessage(msg.channel_id, `🎱 ${r[Math.floor(Math.random() * r.length)]}`);
  }},

  reverso: { desc: 'Reverte texto', aliases: ['reverse'], usage: '<texto>', fn: async (msg, args) => {
    if (!args[0]) return client.sendMessage(msg.channel_id, '❌ Use: `!reverso texto`');
    await client.sendMessage(msg.channel_id, `🔄 ${args.join('').split('').reverse().join('')}`);
  }},

  ship: { desc: 'Compatibilidade entre usuarios', usage: '@user1 @user2', fn: async (msg, args) => {
    if (args.length < 2) return client.sendMessage(msg.channel_id, '❌ Use: `!ship @user1 @user2`');
    const score = Math.floor(Math.random() * 101);
    const bar = '❤️'.repeat(Math.round(score / 10)) + '🖤'.repeat(10 - Math.round(score / 10));
    await client.sendMessage(msg.channel_id, `💕 **Ship**\n${bar}\n**${score}%** de compatibilidade!`);
  }},

  moeda: { desc: 'Joga moeda', fn: async (msg) => {
    await client.sendMessage(msg.channel_id, Math.random() > 0.5 ? '🪙 **Cara!**' : '🪙 **Coroa!**');
  }},

  dado: { desc: 'Joga dado', fn: async (msg) => {
    await client.sendMessage(msg.channel_id, `🎲 **${Math.floor(Math.random() * 6) + 1}**`);
  }},

  poll: { desc: 'Enquete', usage: '<pergunta>', fn: async (msg, args) => {
    if (!args[0]) return client.sendMessage(msg.channel_id, '❌ Use: `!poll pergunta`');
    const m = await client.sendMessage(msg.channel_id, `📊 **Enquete:** ${args.join(' ')}\n\n👍 Sim | 👎 Nao`);
    await client.addReaction(msg.channel_id, m.id, '👍');
    await client.addReaction(msg.channel_id, m.id, '👎');
  }},

  randomuser: { desc: 'Membro aleatorio', fn: async (msg) => {
    await client.sendMessage(msg.channel_id, `🎲 Membro aleatorio: ${msg.author.username} (so voce mesmo por enquanto!)`);
  }},

  compliment: { desc: 'Elogio aleatorio', fn: async (msg) => {
    const r = ['Voce e incrivel!', 'Continue assim!', 'Voce faz o mundo melhor!', 'Seu sorriso ilumina tudo!', 'Ninguem e voce!'];
    await client.sendMessage(msg.channel_id, `💝 ${r[Math.floor(Math.random() * r.length)]}`);
  }},

  insult: { desc: 'Zoeira aleatoria', fn: async (msg) => {
    const r = ['Voce e especial... de um jeito estranho', 'Nao e voce, e o universo', 'Tenta de novo amanha', 'Boa sorte com isso'];
    await client.sendMessage(msg.channel_id, `😤 ${r[Math.floor(Math.random() * r.length)]}`);
  }},

  perfil: { desc: 'Seu perfil', aliases: ['profile'], fn: async (msg) => {
    const u = getUser(msg.author.id);
    const bar = xpBar(u.xp, u.level);
    await client.sendMessage(msg.channel_id, {
      content: `## 👤 Perfil de ${msg.author.username}\n\n**ID:** \`${msg.author.id}\`\n**Level:** ${u.level}\n**XP:** [${bar}] ${u.xp}/${u.level * 100}\n**Reputacao:** ${u.reputation}\n**Moedas:** ${u.coins} 🪙`
    });
  }},

  reputacao: { desc: 'Dar reputacao', aliases: ['rep'], usage: '@user', fn: async (msg, args) => {
    if (!args[0]) return client.sendMessage(msg.channel_id, '❌ Use: `!rep @user`');
    const mention = args[0].replace(/[<@!>]/g, '');
    if (mention === msg.author.id) return client.sendMessage(msg.channel_id, '❌ Nao pode dar rep pra voce mesmo!');
    getUser(mention).reputation++;
    saveData();
    await client.sendMessage(msg.channel_id, `🏅 Reputacao dada!`);
  }},

  daily: { desc: 'Recompensa diaria', fn: async (msg) => {
    const u = getUser(msg.author.id);
    const now = Date.now();
    if (u.daily && now - u.daily < 86400000) {
      const left = Math.ceil((86400000 - (now - u.daily)) / 3600000);
      return client.sendMessage(msg.channel_id, `⏰ Volta em ${left}h!`);
    }
    u.daily = now;
    u.coins += 50;
    const lvlUp = addXP(msg.author.id, 25);
    saveData();
    let msg_text = `💰 **Daily!** +50 moedas, +25 XP`;
    if (lvlUp) msg_text += `\n🎉 **Level Up!** Agora level ${u.level}!`;
    await client.sendMessage(msg.channel_id, msg_text);
  }},

  coins: { desc: 'Suas moedas', fn: async (msg) => {
    const u = getUser(msg.author.id);
    await client.sendMessage(msg.channel_id, `🪙 **${u.coins} moedas**`);
  }},

  ranking: { desc: 'Leaderboard XP', aliases: ['lb', 'top'], fn: async (msg) => {
    const sorted = Object.entries(data.users).sort((a, b) => (b[1].level * 100 + b[1].xp) - (a[1].level * 100 + a[1].xp)).slice(0, 10);
    if (!sorted.length) return client.sendMessage(msg.channel_id, '❌ Ninguem ainda!');
    let text = '## 🏆 Ranking\n';
    sorted.forEach(([id, u], i) => { text += `**${i + 1}.** <@${id}> - Level ${u.level} (${u.xp} XP)\n`; });
    await client.sendMessage(msg.channel_id, text);
  }},

  avatar: { desc: 'Avatar de um usuario', fn: async (msg) => {
    const avatar = msg.author.avatar ? `https://cdn.fluxer.app/avatars/${msg.author.id}/${msg.author.avatar}.png` : 'Sem avatar';
    await client.sendMessage(msg.channel_id, `🖼️ **Avatar:** ${avatar}`);
  }},

  ajuda: { desc: 'Lista de comandos', aliases: ['help', 'h'], fn: async (msg) => {
    let text = '## 📖 Comandos do aitrrL\n\n';
    for (const [name, cmd] of Object.entries(commands)) {
      if (!cmd.aliases) text += `\`${PREFIX}${name}\` - ${cmd.desc}\n`;
    }
    text += `\nPrefixo: \`${PREFIX}\``;
    await client.sendMessage(msg.channel_id, text);
  }},

  stats: { desc: 'Estatisticas do bot', fn: async (msg) => {
    const uptime = Math.floor((Date.now() - data.stats.uptime) / 3600000);
    await client.sendMessage(msg.channel_id, `## 📊 Stats\n\n👤 Usuarios: ${Object.keys(data.users).length}\n⌨️ Comandos usados: ${data.stats.commandsUsed}\n💬 Mensagens vistas: ${data.stats.messagesSeen}\n⏱️ Uptime: ${uptime}h`);
  }},

  kick: { desc: 'Expulsar membro', usage: '@user [motivo]', ownerOnly: true, fn: async (msg, args) => {
    if (!args[0]) return client.sendMessage(msg.channel_id, '❌ Use: `!kick @user [motivo]`');
    const user_id = args[0].replace(/[<@!>]/g, '');
    const reason = args.slice(1).join(' ') || 'Sem motivo';
    try {
      await client.sendMessage(msg.channel_id, `👢 Kickando <@${user_id}>... Motivo: ${reason}`);
    } catch (e) { await client.sendMessage(msg.channel_id, `❌ Erro: ${e.message}`); }
  }},

  ban: { desc: 'Banir membro', usage: '@user [motivo]', ownerOnly: true, fn: async (msg, args) => {
    if (!args[0]) return client.sendMessage(msg.channel_id, '❌ Use: `!ban @user [motivo]`');
    const user_id = args[0].replace(/[<@!>]/g, '');
    const reason = args.slice(1).join(' ') || 'Sem motivo';
    try {
      await client.sendMessage(msg.channel_id, `🔨 Banindo <@${user_id}>... Motivo: ${reason}`);
    } catch (e) { await client.sendMessage(msg.channel_id, `❌ Erro: ${e.message}`); }
  }},

  unban: { desc: 'Desbanir usuario', usage: '<user_id>', ownerOnly: true, fn: async (msg, args) => {
    if (!args[0]) return client.sendMessage(msg.channel_id, '❌ Use: `!unban <user_id>`');
    try {
      await client.sendMessage(msg.channel_id, `✅ Desbanido \`${args[0]}\`!`);
    } catch (e) { await client.sendMessage(msg.channel_id, `❌ Erro: ${e.message}`); }
  }},
};

client.on('ready', () => {
  console.log(`✅ aitrrL online como ${client.user?.username || 'bot'}`);
});

client.on('messageCreate', async (msg) => {
  if (msg.author?.bot) return;
  data.stats.messagesSeen++;

  if (!msg.content?.startsWith(PREFIX)) {
    const lvlUp = addXP(msg.author.id, 5);
    if (lvlUp) {
      const u = getUser(msg.author.id);
      await client.sendMessage(msg.channel_id, `🎉 <@${msg.author.id}> **Level Up!** Agora level ${u.level}!`);
    }
    saveData();
    return;
  }

  const args = msg.content.slice(PREFIX.length).trim().split(/\s+/);
  const cmdName = args.shift().toLowerCase();
  data.stats.commandsUsed++;

  const cmd = commands[cmdName] || Object.values(commands).find(c => c.aliases?.includes(cmdName));
  if (!cmd) return;

  if (cmd.ownerOnly && msg.author.id !== OWNER_ID) {
    return client.sendMessage(msg.channel_id, '❌ Apenas o dono pode usar este comando!');
  }

  try { await cmd.fn(msg, args); } catch (e) { console.error(e); }
  saveData();
});

client.login(process.env.FLUXER_BOT_TOKEN);
