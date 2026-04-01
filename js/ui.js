// === UI Manager ===

const UI = {
  showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
  },

  hideAllPanels() {
    document.querySelectorAll('.panel').forEach(p => p.classList.add('hidden'));
  },

  showPanel(id) {
    this.hideAllPanels();
    document.getElementById(id).classList.remove('hidden');
  },

  updateHUD(player) {
    document.getElementById('hud-name').textContent = player.name;
    document.getElementById('hud-title').textContent = this.getTitle(player.fame);
    document.getElementById('hud-turn').textContent = `第${player.turn}月`;
    document.getElementById('hud-gold').textContent = player.gold;
    document.getElementById('hud-soldiers').textContent = player.soldiers;
    document.getElementById('hud-fame').textContent = player.fame;
    document.getElementById('hud-hp').textContent = player.hp;
  },

  getTitle(fame) {
    let title = TITLES[0].name;
    for (const t of TITLES) {
      if (fame >= t.fame) title = t.name;
    }
    return title;
  },

  showStatus(player) {
    const details = document.getElementById('status-details');
    const stats = [
      ['名前 Name', player.name],
      ['称号 Title', this.getTitle(player.fame)],
      ['居場所 Location', CITIES.find(c => c.id === player.city)?.name || '?'],
      ['月 Turn', `第${player.turn}月`],
      ['武力 Martial', player.martial],
      ['知略 Intelligence', player.intelligence],
      ['魅力 Charm', player.charm],
      ['政治 Politics', player.politics],
      ['体力 HP', `${player.hp} / ${player.maxHP}`],
      ['金 Gold', player.gold],
      ['兵 Soldiers', player.soldiers],
      ['名声 Fame', player.fame],
    ];
    details.innerHTML = stats.map(([k, v]) =>
      `<div class="stat-line"><span>${k}</span><span class="val">${v}</span></div>`
    ).join('');
    this.showPanel('status-panel');
  },

  showLocation(city, player) {
    document.getElementById('location-name').textContent = `${city.name} (${city.nameEn})`;
    document.getElementById('location-desc').textContent = city.desc;
    document.getElementById('location-lord').textContent = `城主: ${city.lord}`;

    const actions = document.getElementById('location-actions');
    actions.innerHTML = '';

    if (city.id !== player.city) {
      const btn = document.createElement('button');
      btn.textContent = `移動する Travel here`;
      btn.addEventListener('click', () => Game.travelTo(city.id));
      actions.appendChild(btn);
    }

    // Show NPCs in this city
    const cityNPCs = NPCS.filter(n => n.city === city.id);
    for (const npc of cityNPCs) {
      const btn = document.createElement('button');
      btn.textContent = `${npc.name} (${npc.nameEn}) と話す`;
      btn.addEventListener('click', () => Game.talkToNPC(npc));
      actions.appendChild(btn);
    }

    this.showPanel('location-panel');
  },

  showEvent(event) {
    document.getElementById('event-title').textContent = event.title;
    document.getElementById('event-text').textContent = event.text;

    const choices = document.getElementById('event-choices');
    choices.innerHTML = '';

    for (const choice of event.choices) {
      const btn = document.createElement('button');
      btn.textContent = choice.text;
      btn.addEventListener('click', () => {
        const result = choice.effect(Game);
        this.showMessage(event.title, result);
      });
      choices.appendChild(btn);
    }

    this.showPanel('event-panel');
  },

  showMessage(title, text, onClose) {
    document.getElementById('event-title').textContent = title;
    document.getElementById('event-text').textContent = text;
    const choices = document.getElementById('event-choices');
    choices.innerHTML = '';
    const btn = document.createElement('button');
    btn.textContent = '了解 OK';
    btn.addEventListener('click', () => {
      this.hideAllPanels();
      UI.updateHUD(Game.player);
      if (onClose) onClose();
    });
    choices.appendChild(btn);
    this.showPanel('event-panel');
  },

  showNPCDialog(npc) {
    document.getElementById('event-title').textContent = `${npc.name} (${npc.nameEn})`;
    document.getElementById('event-text').textContent = npc.dialogue;

    const choices = document.getElementById('event-choices');
    choices.innerHTML = '';

    if (npc.type === 'merchant') {
      const buyBtn = document.createElement('button');
      buyBtn.textContent = '物資を買う Buy supplies (30金 -> +10兵)';
      buyBtn.addEventListener('click', () => {
        if (Game.player.gold >= 30) {
          Game.addGold(-30);
          Game.addSoldiers(10);
          UI.showMessage(npc.name, '兵糧を購入した。 (+10兵) Bought supplies!');
        } else {
          UI.showMessage(npc.name, '金が足りない。 Not enough gold.');
        }
      });
      choices.appendChild(buyBtn);

      const sellBtn = document.createElement('button');
      sellBtn.textContent = '情報を売る Sell intel (+20金)';
      sellBtn.addEventListener('click', () => {
        if (Game.player.intelligence >= 6) {
          Game.addGold(20);
          UI.showMessage(npc.name, '情報を売って金を得た。 (+20金) Sold intelligence!');
        } else {
          UI.showMessage(npc.name, '価値ある情報がない。 No valuable intel to sell.');
        }
      });
      choices.appendChild(sellBtn);
    }

    if (npc.type === 'rival' || npc.type === 'spy') {
      const fightBtn = document.createElement('button');
      fightBtn.textContent = '決闘する Duel!';
      fightBtn.addEventListener('click', () => {
        this.hideAllPanels();
        Combat.start(Game.player, npc, (won) => {
          if (won) {
            Game.addFame(15);
            Game.player.martial += 1;
            UI.showMessage('勝利 Victory', `${npc.name}に勝った！ (+15名声, +1武力) You defeated ${npc.nameEn}!`);
          } else {
            UI.showMessage('敗北 Defeat', `${npc.name}に負けた... You lost to ${npc.nameEn}...`);
          }
        });
      });
      choices.appendChild(fightBtn);
    }

    if (npc.type === 'sage' || npc.type === 'noble') {
      const learnBtn = document.createElement('button');
      learnBtn.textContent = '教えを乞う Learn';
      learnBtn.addEventListener('click', () => {
        const stat = npc.type === 'sage' ? 'intelligence' : 'politics';
        const statJa = npc.type === 'sage' ? '知略' : '政治';
        Game.player[stat] += 1;
        UI.showMessage(npc.name, `${statJa}が上がった！ (+1${statJa}) Gained wisdom!`);
      });
      choices.appendChild(learnBtn);
    }

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '去る Leave';
    closeBtn.addEventListener('click', () => this.hideAllPanels());
    choices.appendChild(closeBtn);

    this.showPanel('event-panel');
  },

  showTrainMenu() {
    document.getElementById('event-title').textContent = '修行 - Training';
    document.getElementById('event-text').textContent = 'どの能力を鍛えるか？ Which stat to train?';

    const choices = document.getElementById('event-choices');
    choices.innerHTML = '';

    const stats = [
      { key: 'martial', name: '武力 Martial' },
      { key: 'intelligence', name: '知略 Intelligence' },
      { key: 'charm', name: '魅力 Charm' },
      { key: 'politics', name: '政治 Politics' },
    ];

    for (const stat of stats) {
      const btn = document.createElement('button');
      btn.textContent = `${stat.name} (現在: ${Game.player[stat.key]})`;
      btn.addEventListener('click', () => {
        const gain = 1 + (Math.random() < 0.2 ? 1 : 0);
        Game.player[stat.key] += gain;
        Game.addHP(-10);
        const msgs = TRAIN_RESULTS[stat.key];
        const msg = msgs[Math.floor(Math.random() * msgs.length)];
        UI.showMessage('修行 Training', `${msg} (+${gain}${stat.name.split(' ')[0]}, -10体力)`);
      });
      choices.appendChild(btn);
    }

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = '戻る Cancel';
    cancelBtn.addEventListener('click', () => this.hideAllPanels());
    choices.appendChild(cancelBtn);

    this.showPanel('event-panel');
  },

  showDiplomacyMenu() {
    const city = CITIES.find(c => c.id === Game.player.city);
    document.getElementById('event-title').textContent = '外交 - Diplomacy';
    document.getElementById('event-text').textContent = `${city.lord}に謁見を求める。 Request an audience with ${city.lord}.`;

    const choices = document.getElementById('event-choices');
    choices.innerHTML = '';

    const pledgeBtn = document.createElement('button');
    pledgeBtn.textContent = '忠誠を誓う Pledge loyalty (+名声)';
    pledgeBtn.addEventListener('click', () => {
      const success = Game.player.charm + Game.player.politics >= 12;
      if (success) {
        Game.addFame(10 + Math.floor(Game.player.charm * 0.5));
        UI.showMessage('外交 Diplomacy', `${city.lord}に認められた！ Gained ${city.lord}'s recognition!`);
      } else {
        UI.showMessage('外交 Diplomacy', '門前払いされた。 Turned away at the gate.');
      }
    });
    choices.appendChild(pledgeBtn);

    const adviseBtn = document.createElement('button');
    adviseBtn.textContent = '献策する Offer counsel';
    adviseBtn.addEventListener('click', () => {
      if (Game.player.politics >= 8) {
        Game.addFame(15);
        Game.addGold(30);
        UI.showMessage('外交 Diplomacy', `策が採用された！ (+15名声, +30金) Your plan was adopted!`);
      } else {
        UI.showMessage('外交 Diplomacy', '策は退けられた。 Your counsel was rejected.');
      }
    });
    choices.appendChild(adviseBtn);

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = '戻る Cancel';
    cancelBtn.addEventListener('click', () => this.hideAllPanels());
    choices.appendChild(cancelBtn);

    this.showPanel('event-panel');
  },

  showTravelMenu() {
    document.getElementById('event-title').textContent = '移動 - Travel';
    document.getElementById('event-text').textContent = 'どこへ向かう？ Where to go?';

    const choices = document.getElementById('event-choices');
    choices.innerHTML = '';

    for (const city of CITIES) {
      if (city.id === Game.player.city) continue;
      const currentCity = CITIES.find(c => c.id === Game.player.city);
      const dist = Math.abs(city.x - currentCity.x) + Math.abs(city.y - currentCity.y);
      const cost = Math.max(5, Math.floor(dist * 1.5));

      const btn = document.createElement('button');
      btn.textContent = `${city.name} (${city.nameEn}) - ${cost}金`;
      btn.addEventListener('click', () => {
        if (Game.player.gold >= cost) {
          Game.addGold(-cost);
          Game.travelTo(city.id);
        } else {
          UI.showMessage('移動 Travel', '金が足りない。 Not enough gold.');
        }
      });
      choices.appendChild(btn);
    }

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = '戻る Cancel';
    cancelBtn.addEventListener('click', () => this.hideAllPanels());
    choices.appendChild(cancelBtn);

    this.showPanel('event-panel');
  },

  showEndScreen(won) {
    const p = Game.player;
    document.getElementById('end-title').textContent = won
      ? '天下統一！ Unification!'
      : '無念... Game Over';
    document.getElementById('end-text').textContent = won
      ? `${p.name}は見事、大名の座を勝ち取った！\n${p.name} has risen to become a great Daimyo!`
      : `${p.name}の志は、ここに潰えた...\n${p.name}'s ambition ends here...`;
    document.getElementById('end-stats').innerHTML = `
      <div>経過月数 Turns: ${p.turn}</div>
      <div>最終名声 Final Fame: ${p.fame}</div>
      <div>武力: ${p.martial} / 知略: ${p.intelligence}</div>
      <div>魅力: ${p.charm} / 政治: ${p.politics}</div>
      <div>金: ${p.gold} / 兵: ${p.soldiers}</div>
    `;
    this.showScreen('end-screen');
  }
};
