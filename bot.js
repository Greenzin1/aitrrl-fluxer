require('dotenv').config();
const { Client, Events, Routes, EmbedBuilder } = require('@fluxerjs/core');
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'data.json');
const PREFIX = '/';
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

const client = new Client({ intents: ['Guilds', 'GuildMessages', 'MessageContent', 'GuildMembers'] });

const commands = {
  ping: { desc: 'Latencia do bot', fn: async (msg) => {
    const start = Date.now();
    const m = await msg.channel.send('🏓 Calculando...');
    const latency = Date.now() - start;
    await m.edit({ content: `🏓 **|** **Pong!**\n⏱️ **|** **Gateway Ping:** \`${latency}ms\`\n⚡ **|** **API Ping:** \`${client.ws?.ping || 'N/A'}ms\`` });
  }},

  aitrrl: { desc: 'Comandos do bot', fn: async (msg, args) => {
    const sub = (args[0] || '').toLowerCase();

    if (sub === 'info') {
      const totalUsers = Object.keys(data.users).length;
      const totalCmds = data.stats.commandsUsed;
      return msg.channel.send(`Olá, eu me chamo aitrrL!
Olá, eu me chamo aitrrL (ou, como meus amigos próximos me chamam, "aitrr"), tenho 16 anos e, depois que eu fui desenvolvida, deixar o seu servidor único e extraordinário nunca foi tão fácil!

Fora da internet eu também sou um robô, mas com sentimentos humanos e com determinação para ajudar e divertir as pessoas mundo afora. Para me conectar ao Fluxer, eu programei um bot que possui a minha personalidade, sonhos e esperanças... e hospedei ele dentro de mim!

Atualmente estou espalhando alegria e diversão em ${totalUsers} servidores com 18 comandos inovadores e já executei ${totalCmds} comandos nas últimas 24 horas. Desde 15 de Agosto de 2026 tentando transformar o mundo em um lugar melhor!

Vamos transformar o mundo em um lugar incrível, juntos <@${msg.author.id}>.`);
    }

    if (sub === 'ajuda' || sub === 'help' || !sub) {
      let text = '## 📖 Comandos do aitrrL\n\n';
      const seen = new Set();
      for (const [name, cmd] of Object.entries(commands)) {
        if (name === 'aitrrl') continue;
        if (!seen.has(cmd.desc)) {
          text += `\`${PREFIX}${name}\` - ${cmd.desc}\n`;
          seen.add(cmd.desc);
        }
      }
      text += `\n**Subcomandos do aitrrL:**\n`;
      text += `\`${PREFIX}aitrrl info\` - Sobre o bot\n`;
      text += `\`${PREFIX}aitrrl ajuda\` - Lista de comandos\n`;
      text += `\nPrefixo: \`${PREFIX}\``;
      return msg.channel.send(text);
    }

    return msg.channel.send(`❌ Subcomando não encontrado! Use \`${PREFIX}aitrrl ajuda\``);
  }},

  calc: { desc: 'Calculadora', usage: '<expressao>', fn: async (msg, args) => {
    if (!args[0]) return msg.channel.send('❌ Use: `!calc 2+2`');
    try {
      const expr = args.join('').replace(/[^0-9+\-*/().]/g, '');
      const result = Function('"use strict"; return (' + expr + ')')();
      await msg.channel.send(`📖 **|** **Resultado:** \`${result}\``);
    } catch { await msg.channel.send('❌ Expressao invalida'); }
  }},

  oitobola: { desc: 'Bola 8 magica', fn: async (msg) => {
    const r = ['Sim!', 'Nao!', 'Talvez...', 'Claro!', 'Com certeza!', 'Nao conte com isso', 'Depende', 'Obviamente!', 'Duvido muito', 'De jeito nenhum!'];
    await msg.channel.send(`🎱 ${r[Math.floor(Math.random() * r.length)]}`);
  }},

  reverso: { desc: 'Reverte texto', aliases: ['reverse'], usage: '<texto>', fn: async (msg, args) => {
    if (!args[0]) return msg.channel.send('❌ Use: `!reverso texto`');
    await msg.channel.send(`🔄 ${args.join('').split('').reverse().join('')}`);
  }},

  ship: { desc: 'Compatibilidade entre usuarios', usage: '@user1 @user2', fn: async (msg, args) => {
    if (args.length < 2) return msg.channel.send('❌ Use: `!ship @user1 @user2`');
    const score = Math.floor(Math.random() * 101);
    const bar = '❤️'.repeat(Math.round(score / 10)) + '🖤'.repeat(10 - Math.round(score / 10));
    await msg.channel.send(`💕 **Ship**\n${bar}\n**${score}%** de compatibilidade!`);
  }},

  moeda: { desc: 'Joga moeda', fn: async (msg) => {
    await msg.channel.send(Math.random() > 0.5 ? '🪙 **Cara!**' : '🪙 **Coroa!**');
  }},

  dado: { desc: 'Joga dado', fn: async (msg) => {
    await msg.channel.send(`🎲 **${Math.floor(Math.random() * 6) + 1}**`);
  }},

  poll: { desc: 'Enquete', usage: '<pergunta>', fn: async (msg, args) => {
    if (!args[0]) return msg.channel.send('❌ Use: `!poll pergunta`');
    const m = await msg.channel.send(`📊 **Enquete:** ${args.join(' ')}\n\n👍 Sim | 👎 Nao`);
    await m.react('👍');
    await m.react('👎');
  }},

  randomuser: { desc: 'Membro aleatorio', fn: async (msg) => {
    await msg.channel.send(`🎲 Membro aleatorio: ${msg.author.username} (so voce mesmo por enquanto!)`);
  }},

  compliment: { desc: 'Elogio aleatorio', fn: async (msg) => {
    const r = ['Voce e incrivel!', 'Continue assim!', 'Voce faz o mundo melhor!', 'Seu sorriso ilumina tudo!', 'Ninguem e voce!'];
    await msg.channel.send(`💝 ${r[Math.floor(Math.random() * r.length)]}`);
  }},

  insult: { desc: 'Zoeira aleatoria', fn: async (msg) => {
    const r = ['Voce e especial... de um jeito estranho', 'Nao e voce, e o universo', 'Tenta de novo amanha', 'Boa sorte com isso'];
    await msg.channel.send(`😤 ${r[Math.floor(Math.random() * r.length)]}`);
  }},

  perfil: { desc: 'Seu perfil', aliases: ['profile'], fn: async (msg) => {
    const u = getUser(msg.author.id);
    const bar = xpBar(u.xp, u.level);
    await msg.channel.send(`## 👤 Perfil de ${msg.author.username}\n\n**ID:** \`${msg.author.id}\`\n**Level:** ${u.level}\n**XP:** [${bar}] ${u.xp}/${u.level * 100}\n**Reputacao:** ${u.reputation}\n**Moedas:** ${u.coins} 🪙`);
  }},

  reputacao: { desc: 'Dar reputacao', aliases: ['rep'], usage: '@user', fn: async (msg, args) => {
    if (!args[0]) return msg.channel.send('❌ Use: `!rep @user`');
    const mention = args[0].replace(/[<@!>]/g, '');
    if (mention === msg.author.id) return msg.channel.send('❌ Nao pode dar rep pra voce mesmo!');
    getUser(mention).reputation++;
    saveData();
    await msg.channel.send('🏅 Reputacao dada!');
  }},

  daily: { desc: 'Recompensa diaria', fn: async (msg) => {
    const u = getUser(msg.author.id);
    const now = Date.now();
    if (u.daily && now - u.daily < 86400000) {
      const left = Math.ceil((86400000 - (now - u.daily)) / 3600000);
      return msg.channel.send(`⏰ Volta em ${left}h!`);
    }
    u.daily = now;
    u.coins += 50;
    const lvlUp = addXP(msg.author.id, 25);
    saveData();
    let txt = `💰 **Daily!** +50 moedas, +25 XP`;
    if (lvlUp) txt += `\n🎉 **Level Up!** Agora level ${u.level}!`;
    await msg.channel.send(txt);
  }},

  coins: { desc: 'Suas moedas', fn: async (msg) => {
    const u = getUser(msg.author.id);
    await msg.channel.send(`🪙 **${u.coins} moedas**`);
  }},

  ranking: { desc: 'Leaderboard XP', aliases: ['lb', 'top'], fn: async (msg) => {
    const sorted = Object.entries(data.users).sort((a, b) => (b[1].level * 100 + b[1].xp) - (a[1].level * 100 + a[1].xp)).slice(0, 10);
    if (!sorted.length) return msg.channel.send('❌ Ninguem ainda!');
    let text = '## 🏆 Ranking\n';
    sorted.forEach(([id, u], i) => { text += `**${i + 1}.** <@${id}> - Level ${u.level} (${u.xp} XP)\n`; });
    await msg.channel.send(text);
  }},

  avatar: { desc: 'Avatar de um usuario', fn: async (msg) => {
    const avatar = msg.author.displayAvatarURL({ dynamic: true }) || 'Sem avatar';
    await msg.channel.send(`🖼️ **Avatar:** ${avatar}`);
  }},

  stats: { desc: 'Estatisticas do bot', fn: async (msg) => {
    const uptime = Math.floor((Date.now() - data.stats.uptime) / 3600000);
    await msg.channel.send(`## 📊 Stats\n\n👤 Usuarios: ${Object.keys(data.users).length}\n⌨️ Comandos usados: ${data.stats.commandsUsed}\n💬 Mensagens vistas: ${data.stats.messagesSeen}\n⏱️ Uptime: ${uptime}h`);
  }},

  kick: { desc: 'Expulsar membro', usage: '@user [motivo]', ownerOnly: true, fn: async (msg, args) => {
    if (!args[0]) return msg.channel.send('❌ Use: `!kick @user [motivo]`');
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

client.login(process.env.FLUXER_BOT_TOKEN).catch(e => {
  console.error('❌ Login failed:', e.message);
  process.exit(1);
});
