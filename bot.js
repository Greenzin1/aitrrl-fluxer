require('dotenv').config();
const { Client, Events, Routes, EmbedBuilder } = require('@fluxerjs/core');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('aitrrL is running');
}).listen(PORT, () => console.log(`Health check on port ${PORT}`));

const DATA_FILE = path.join(__dirname, 'data.json');
const PREFIX = '/';
const OWNER_ID = 'SEU_USER_ID_AQUI';
const VERSION_BASE_COMMIT = '2b14a1e';
let VERSION = '1.0';

async function fetchVersion() {
  try {
    const res = await fetch(`https://api.github.com/repos/Greenzin1/aitrrl-fluxer/compare/${VERSION_BASE_COMMIT}...main`);
    const data = await res.json();
    const commits = data.ahead_by || 0;
    const major = 1 + Math.floor(commits / 10);
    VERSION = `${major}.0`;
    console.log(`Version: ${VERSION} (${commits} commits since base)`);
  } catch (e) {
    console.log('Could not fetch version from GitHub, using default');
  }
}

let data = { users: {}, stats: { commandsUsed: 0, messagesSeen: 0, uptime: Date.now() } };

function loadData() {
  try { if (fs.existsSync(DATA_FILE)) data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); } catch {}
}
function saveData() { fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2)); }
function getUser(id) {
  if (!data.users[id]) data.users[id] = { xp: 0, level: 1, reputation: 0, coins: 0 };
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

const client = new Client({ intents: ['Guilds', 'GuildMessages', 'MessageContent', 'GuildMembers'] });

const commands = {
  ping: { desc: 'Latencia do bot', fn: async (msg) => {
    const start = Date.now();
    const m = await msg.channel.send('🏓 Calculando...');
    const latency = Date.now() - start;
    await m.edit({ content: `🏓 **Pong!** ⏱️ Gateway Ping: \`${latency}ms\`` });
  }},

  aitrrl: { desc: 'Comandos do bot', fn: async (msg, args) => {
    const sub = (args[0] || '').toLowerCase();

    if (sub === 'info') {
      const totalUsers = Object.keys(data.users).length;
      const totalCmds = data.stats.commandsUsed;
      const embed = new EmbedBuilder()
        .setTitle('🤖 Sobre o aitrrL')
        .setDescription('Olá, eu me chamo aitrrL (ou "aitrr"), tenho 16 anos e sou um bot com sentimentos humanos!\n\nFui criada pra deixar o seu servidor único e extraordinário. Fora da internet também sou um robô com determinação pra ajudar e divertir as pessoas mundo afora!')
        .addFields(
          { name: '👥 Usuarios', value: `${totalUsers}`, inline: true },
          { name: '⌨️ Comandos', value: `${totalCmds}`, inline: true },
          { name: '📅 Desde', value: '15 Agosto 2026', inline: true },
        )
        .setColor(0xeb459e)
        .setFooter({ text: 'Transformando o mundo em um lugar incrível!' });
      return msg.channel.send({ embeds: [embed] });
    }

    if (sub === 'ajuda' || sub === 'help' || !sub) {
      const fields = [];
      const seen = new Set();
      for (const [name, cmd] of Object.entries(commands)) {
        if (name === 'aitrrl') continue;
        if (!seen.has(cmd.desc)) {
          fields.push({ name: `\`${PREFIX}${name}\``, value: cmd.desc, inline: true });
          seen.add(cmd.desc);
        }
      }
      const embed = new EmbedBuilder()
        .setTitle('📖 Comandos do aitrrL')
        .addFields(...fields)
        .setColor(0x5865f2)
        .setFooter({ text: `Prefixo: ${PREFIX} | Subcomandos: /aitrrl info, /aitrrl ajuda` });
      return msg.channel.send({ embeds: [embed] });
    }

    return msg.channel.send(`❌ Subcomando não encontrado! Use \`${PREFIX}aitrrl ajuda\``);
  }},

  calc: { desc: 'Calculadora', usage: '<expressao>', fn: async (msg, args) => {
    if (!args[0]) return msg.channel.send('❌ Use: `/calc 2+2`');
    try {
      const expr = args.join('').replace(/[^0-9+\-*/().]/g, '');
      const result = Function('"use strict"; return (' + expr + ')')();
      await msg.channel.send(`📖 **|** **Resultado:** \`${result}\``);
    } catch { await msg.channel.send('❌ Expressao invalida'); }
  }},



  reverso: { desc: 'Reverte texto', aliases: ['reverse'], usage: '<texto>', fn: async (msg, args) => {
    if (!args[0]) return msg.channel.send('❌ Use: `/reverso texto`');
    await msg.channel.send(`🔄 ${args.join('').split('').reverse().join('')}`);
  }},

  ship: { desc: 'Compatibilidade entre usuarios', usage: '@user1 @user2', fn: async (msg, args) => {
    if (args.length < 2) return msg.channel.send('❌ Use: `/ship @user1 @user2`');
    const botId = '1538273359882620929';
    const mentions = msg.mentions.users.map(u => u.id);
    if (mentions.includes(botId)) {
      return msg.channel.send('💔 Não quero namorar! Gosto de ser solteira e de viver a minha própria vida! Mas algum dia você irá encontrar alguém que te ama!');
    }
    const score = Math.floor(Math.random() * 101);
    const bar = '❤️'.repeat(Math.round(score / 10)) + '🖤'.repeat(10 - Math.round(score / 10));
    const embed = new EmbedBuilder()
      .setTitle('💕 Ship')
      .setDescription(`${bar}\n**${score}%** de compatibilidade!`)
      .setColor(score >= 70 ? 0xff6b9d : score >= 40 ? 0xffa500 : 0xff4444);
    await msg.channel.send({ embeds: [embed] });
  }},

  moeda: { desc: 'Joga moeda', fn: async (msg) => {
    await msg.channel.send(Math.random() > 0.5 ? '🪙 **Cara!**' : '🪙 **Coroa!**');
  }},

  dado: { desc: 'Joga dado', fn: async (msg) => {
    await msg.channel.send(`🎲 **${Math.floor(Math.random() * 6) + 1}**`);
  }},

  randomuser: { desc: 'Membro aleatorio', fn: async (msg) => {
    await msg.channel.send(`🎲 Membro aleatorio: ${msg.author.username} (so voce mesmo por enquanto!)`);
  }},

  compliment: { desc: 'Elogio aleatorio', fn: async (msg) => {
    const r = ['Voce e incrivel!', 'Continue assim!', 'Voce faz o mundo melhor!', 'Seu sorriso ilumina tudo!', 'Ninguem e voce!'];
    await msg.channel.send(`💝 ${r[Math.floor(Math.random() * r.length)]}`);
  }},

  insult: { desc: 'Zoeira aleatoria', usage: '@user', fn: async (msg, args) => {
    const target = args[0] ? args[0].replace(/[<@!>]/g, '') : msg.author.id;
    const insultos = [
      'Voce e tao lento que o Google te pede pra esperar.',
      'Voce nasceu feio e o espelho pediu arrego.',
      'Seu rosto e a razao pela qual Deus criou o saco de pancadas.',
      'Voce e tipo um bug no codigo - ninguem te pediu pra existir.',
      'Seu QI e menor que a temperatura de freezer.',
      'Voce e tao burro que confunde WiFi com Wifia.',
      'O unico lugar onde voce brilha e no espelho do banheiro.',
      'Voce e o motivo pelo qual a internet tem bloqueio parental.',
      'Se voce fosse um virus, ninguem instalaria antiviru.',
      'Voce e tipo impressora 3D - todo mundo acha que e legal ate ter um.',
      'Se o conhecimento fosse voce, ninguem teria nada.',
      'Voce e o NPC mais burro desse jogo.',
      'Ate o autocorrect desiste de voce.',
      'Voce e tao sem graca que o Netflix te recomendadocumentario.',
      'Se voce fosse uma piada, ninguem riria.',
      'Voce nasceu e o medico disse: "eu desisto".',
      'Seu nivel de inteligencia e impressionante... impressionantemente baixo.',
      'Voce e o motivo pelo qual existe o botao de desligar.',
    ];
    const r = insultos[Math.floor(Math.random() * insultos.length)];
    await msg.channel.send(`<@${target}> ${r}`);
  }},

  perfil: { desc: 'Seu perfil', aliases: ['profile'], fn: async (msg) => {
    const u = getUser(msg.author.id);
    const bar = xpBar(u.xp, u.level);
    const embed = new EmbedBuilder()
      .setTitle(`👤 Perfil de ${msg.author.username}`)
      .addFields(
        { name: '🆔 ID', value: `\`${msg.author.id}\``, inline: true },
        { name: '⭐ Level', value: `${u.level}`, inline: true },
        { name: '📊 XP', value: `[${bar}] ${u.xp}/${u.level * 100}`, inline: false },
        { name: '🏅 Reputação', value: `${u.reputation}`, inline: true },
        { name: '🪙 Moedas', value: `${u.coins}`, inline: true },
      )
      .setColor(0xeb459e);
    await msg.channel.send({ embeds: [embed] });
  }},

  reputacao: { desc: 'Dar reputacao', aliases: ['rep'], usage: '@user', fn: async (msg, args) => {
    if (!args[0]) return msg.channel.send('❌ Use: `/rep @user`');
    const mention = args[0].replace(/[<@!>]/g, '');
    if (mention === msg.author.id) return msg.channel.send('❌ Nao pode dar rep pra voce mesmo!');
    getUser(mention).reputation++;
    saveData();
    await msg.channel.send('🏅 Reputacao dada!');
  }},

  coins: { desc: 'Suas moedas', fn: async (msg) => {
    const u = getUser(msg.author.id);
    await msg.channel.send(`🪙 **${u.coins} moedas**`);
  }},

  ranking: { desc: 'Leaderboard XP', aliases: ['lb', 'top'], fn: async (msg) => {
    const sorted = Object.entries(data.users).sort((a, b) => (b[1].level * 100 + b[1].xp) - (a[1].level * 100 + a[1].xp)).slice(0, 10);
    if (!sorted.length) return msg.channel.send('❌ Ninguem ainda!');
    const medals = ['🥇', '🥈', '🥉'];
    const desc = sorted.map(([id, u], i) => `${medals[i] || `**${i + 1}.**`} <@${id}> - Level ${u.level} (${u.xp} XP)`).join('\n');
    const embed = new EmbedBuilder()
      .setTitle('🏆 Ranking')
      .setDescription(desc)
      .setColor(0xffd700);
    await msg.channel.send({ embeds: [embed] });
  }},

  coinflip: { desc: 'Gira moeda', aliases: ['cf'], fn: async (msg) => {
    await msg.channel.send(Math.random() > 0.5 ? '🪙 **Cara!**' : '🪙 **Coroa!**');
  }},



  choose: { desc: 'Escolhe entre opcoes', usage: '<opcao1 | opcao2>', fn: async (msg, args) => {
    const parts = args.join(' ').split('|').map(s => s.trim()).filter(Boolean);
    if (parts.length < 2) return msg.channel.send('❌ Use: `/choose pizza | sushi | hamburguer`');
    const escolha = parts[Math.floor(Math.random() * parts.length)];
    await msg.channel.send(`🤔 Eu escolho... **${escolha}**!`);
  }},



  definicao: { desc: 'Definicao do Urban Dictionary', usage: '<termo>', fn: async (msg, args) => {
    if (!args[0]) return msg.channel.send('❌ Use: `/definicao poggers`');
    try {
      const res = await fetch(`https://api.urbandictionary.com/v0/define?term=${encodeURIComponent(args.join(' '))}`);
      const data = await res.json();
      if (!data.list?.length) return msg.channel.send('❌ Nao encontrei nada!');
      const def = data.list[0];
      const definition = def.definition.length > 500 ? def.definition.slice(0, 500) + '...' : def.definition;
      await msg.channel.send(`## 📖 ${def.word}\n\n${definition}\n\n👍 ${def.thumbs_up} | 👎 ${def.thumbs_down}`);
    } catch { await msg.channel.send('❌ Erro ao buscar!'); }
  }},

  avatar: { desc: 'Avatar de um usuario', usage: '@user', fn: async (msg, args) => {
    let user = msg.author;
    if (args[0]) {
      const mentioned = msg.mentions?.[0] || msg.mentions?.users?.first?.() || null;
      if (mentioned) user = mentioned;
    }
    const avatar = user.displayAvatarURL?.({ dynamic: true }) || user.avatarURL?.() || '';
    const botIds = ['1538273359882620929'];
    const isBot = botIds.includes(user.id) || user.bot === true;
    const embed = new EmbedBuilder()
      .setTitle(`🖼️ ${user.username}`)
      .setImage({ url: avatar, width: 400, height: 400 })
      .setFooter({ text: isBot ? 'Sim, eu sei que sou muito fofa!' : 'Apesar de tudo, ainda é você.' })
      .setColor(0x5865f2);
    await msg.channel.send({ embeds: [embed] });
  }},

  version: { desc: 'Versao do bot', fn: async (msg) => {
    await msg.channel.send(`🔧 **Versao:** ${VERSION}`);
  }},

  stats: { desc: 'Estatisticas do bot', fn: async (msg) => {
    const uptime = Math.floor((Date.now() - data.stats.uptime) / 3600000);
    await msg.channel.send(`## 📊 Stats\n\n👤 Usuarios: ${Object.keys(data.users).length}\n⌨️ Comandos usados: ${data.stats.commandsUsed}\n💬 Mensagens vistas: ${data.stats.messagesSeen}\n⏱️ Uptime: ${uptime}h`);
  }},

  kick: { desc: 'Expulsar membro', usage: '@user [motivo]', ownerOnly: true, fn: async (msg, args) => {
    if (!args[0]) return msg.channel.send('❌ Use: `/kick @user [motivo]`');
    const user_id = args[0].replace(/[<@!>]/g, '');
    const reason = args.slice(1).join(' ') || 'Motivo não informado';
    try {
      const member = await msg.guild.members.fetch(user_id);
      if (member.id === msg.guild.ownerId) {
        return msg.channel.send(`🛡️ **|** O usuário <@${user_id}> não poderá ser punido, pois ele é o dono do servidor! Tá tentando fazer um motim, hein?`);
      }
      if (member.permissions.has('Administrator')) {
        return msg.channel.send(`🛡️ **|** O usuário <@${user_id}> é um admin! Não posso expulsar quem manda aqui!`);
      }
      await member.kick(reason);
      await msg.channel.send(`🔨 **|** Você está prestes a chutar da bunda do <@${user_id}> do seu servidor pelo motivo \`${reason}\`!`);
      await msg.channel.send(`🎉 **|** Usuário punido. Ninguém mandou quebrar as regras, seu boboca!`);
    } catch (e) { await msg.channel.send(`❌ Erro: ${e.message}`); }
  }},

  ban: { desc: 'Banir membro', usage: '@user [motivo]', ownerOnly: true, fn: async (msg, args) => {
    if (!args[0]) return msg.channel.send('❌ Use: `!ban @user [motivo]`');
    const user_id = args[0].replace(/[<@!>]/g, '');
    const reason = args.slice(1).join(' ') || 'Motivo não informado';
    try {
      const member = await msg.guild.members.fetch(user_id);
      if (member.id === msg.guild.ownerId) {
        return msg.channel.send(`🛡️ **|** O usuário <@${user_id}> não poderá ser punido, pois ele é o dono do servidor! Tá tentando fazer um motim, hein?`);
      }
      if (member.permissions.has('Administrator')) {
        return msg.channel.send(`🛡️ **|** O usuário <@${user_id}> é um admin! Não posso banir quem manda aqui!`);
      }
      await member.ban({ reason });
      await msg.channel.send(`🔨 **|** Você está prestes a banir <@${user_id}> do seu servidor pelo motivo \`${reason}\`!`);
      await msg.channel.send(`🎉 **|** Usuário punido. Ninguém mandou quebrar as regras, seu boboca!`);
    } catch (e) { await msg.channel.send(`❌ Erro: ${e.message}`); }
  }},

  unban: { desc: 'Desbanir usuario', usage: '<user_id>', ownerOnly: true, fn: async (msg, args) => {
    if (!args[0]) return msg.channel.send('❌ Use: `!unban <user_id>`');
    try {
      await msg.guild.members.unban(args[0]);
      await msg.channel.send(`✅ Desbanido \`${args[0]}\`!`);
    } catch (e) { await msg.channel.send(`❌ Erro: ${e.message}`); }
  }},
};

console.log('Bot starting...');
console.log('Token set:', !!process.env.FLUXER_BOT_TOKEN);

client.on(Events.Ready, () => {
  console.log(`✅ aitrrL online como ${client.user?.username || 'bot'}`);
});

client.on('error', (e) => console.error('Client error:', e));

client.on(Events.MessageCreate, async (msg) => {
  if (msg.author?.bot) return;
  data.stats.messagesSeen++;

  if (!msg.content?.startsWith(PREFIX)) {
    const lvlUp = addXP(msg.author.id, 5);
    if (lvlUp) {
      const u = getUser(msg.author.id);
      await msg.channel.send(`🎉 <@${msg.author.id}> **Level Up!** Agora level ${u.level}!`);
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
    return msg.channel.send('❌ Apenas o dono pode usar este comando!');
  }

  try { await cmd.fn(msg, args); } catch (e) { console.error(e); }
  saveData();
});

fetchVersion();

client.login(process.env.FLUXER_BOT_TOKEN).catch(e => {
  console.error('❌ Login failed:', e.message);
  process.exit(1);
});
