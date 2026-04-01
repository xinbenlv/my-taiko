// === Main Game Engine ===

const Game = {
  player: null,
  animFrame: 0,
  animId: null,

  init() {
    this.setupTitleScreen();
    this.setupCreationScreen();
    this.setupGameControls();
    this.setupEndScreen();
  },

  // === Title Screen ===
  setupTitleScreen() {
    document.getElementById('btn-new-game').addEventListener('click', () => {
      UI.showScreen('creation-screen');
    });

    document.getElementById('btn-load-game').addEventListener('click', () => {
      if (this.loadGame()) {
        this.startGameLoop();
      } else {
        alert('セーブデータがありません。 No save data found.');
      }
    });
  },

  // === Character Creation ===
  setupCreationScreen() {
    const stats = { martial: 5, intelligence: 5, charm: 5, politics: 5 };
    let remaining = 20;
    const total = 40; // 20 base + 20 to allocate

    const updatePoints = () => {
      const used = stats.martial + stats.intelligence + stats.charm + stats.politics;
      remaining = total - used;
      document.getElementById('points-remaining').textContent = `残り: ${remaining}`;
      for (const key of Object.keys(stats)) {
        document.getElementById(`stat-${key}`).textContent = stats[key];
      }
    };

    document.querySelectorAll('.stat-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const stat = btn.dataset.stat;
        const isPlus = btn.classList.contains('plus');
        if (isPlus && remaining > 0 && stats[stat] < 15) {
          stats[stat]++;
        } else if (!isPlus && stats[stat] > 1) {
          stats[stat]--;
        }
        updatePoints();
      });
    });

    document.getElementById('btn-start').addEventListener('click', () => {
      const name = document.getElementById('char-name').value.trim() || '木下藤吉郎';
      this.player = {
        name,
        martial: stats.martial,
        intelligence: stats.intelligence,
        charm: stats.charm,
        politics: stats.politics,
        hp: 100,
        maxHP: 100,
        gold: 100,
        soldiers: 10,
        fame: 0,
        turn: 1,
        city: 'owari', // Start in Owari (Oda's domain)
        actionsThisTurn: 0,
        maxActions: 2,
      };
      this.startGameLoop();
    });
  },

  // === Game Controls ===
  setupGameControls() {
    document.getElementById('btn-action').addEventListener('click', () => {
      if (this.player.actionsThisTurn >= this.player.maxActions) {
        UI.showMessage('行動制限', `今月の行動回数(${this.player.maxActions})を使い切った。\n「終了」で月を進めよ。\nNo actions remaining. End your turn.`);
        return;
      }
      UI.showPanel('action-menu');
    });

    document.getElementById('btn-status').addEventListener('click', () => {
      UI.showStatus(this.player);
    });

    document.getElementById('btn-save').addEventListener('click', () => {
      this.saveGame();
      UI.showMessage('保存 Save', 'セーブしました。 Game saved!');
    });

    document.getElementById('btn-end-turn').addEventListener('click', () => {
      this.endTurn();
    });

    document.getElementById('close-location').addEventListener('click', () => {
      UI.hideAllPanels();
    });

    document.getElementById('close-status').addEventListener('click', () => {
      UI.hideAllPanels();
    });

    // Action buttons
    document.querySelectorAll('.action-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        UI.hideAllPanels();
        this.doAction(action);
      });
    });

    // Combat buttons
    document.querySelectorAll('.combat-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        Combat.doRound(btn.dataset.move);
      });
    });
  },

  setupEndScreen() {
    document.getElementById('btn-title').addEventListener('click', () => {
      UI.showScreen('title-screen');
    });
  },

  // === Game Loop ===
  startGameLoop() {
    UI.showScreen('game-screen');
    GameMap.init();
    GameMap.setupInput((city) => {
      UI.showLocation(city, this.player);
    });
    GameMap.centerOnCity(this.player.city);
    UI.updateHUD(this.player);

    // Animation loop
    const animate = () => {
      this.animFrame++;
      GameMap.render(this.player.city, this.animFrame);
      this.animId = requestAnimationFrame(animate);
    };
    animate();
  },

  // === Actions ===
  doAction(action) {
    if (this.player.actionsThisTurn >= this.player.maxActions) {
      UI.showMessage('行動制限', '行動回数を使い切った。 No actions left this turn.');
      return;
    }

    switch (action) {
      case 'train':
        UI.showTrainMenu();
        this.player.actionsThisTurn++;
        break;

      case 'visit': {
        const city = CITIES.find(c => c.id === this.player.city);
        UI.showLocation(city, this.player);
        break;
      }

      case 'duel': {
        // Find a rival to fight
        const rivals = NPCS.filter(n =>
          (n.type === 'rival' || n.type === 'spy') &&
          (n.city === this.player.city || n.city === null)
        );
        if (rivals.length > 0) {
          const rival = rivals[Math.floor(Math.random() * rivals.length)];
          this.player.actionsThisTurn++;
          Combat.start(this.player, rival, (won) => {
            if (won) {
              this.addFame(12);
              this.player.martial += 1;
              UI.showMessage('決闘 Duel', `${rival.name}に勝利！ (+12名声, +1武力) Victory!`);
            } else {
              UI.showMessage('決闘 Duel', `${rival.name}に敗北... Defeated by ${rival.nameEn}...`);
            }
          });
        } else {
          UI.showMessage('決闘 Duel', 'この地に相手がいない。 No opponents here.');
        }
        break;
      }

      case 'diplomacy':
        this.player.actionsThisTurn++;
        UI.showDiplomacyMenu();
        break;

      case 'trade': {
        this.player.actionsThisTurn++;
        const profit = Math.floor(this.player.intelligence * 3 + Math.random() * 20);
        this.addGold(profit);
        UI.showMessage('商売 Trade', `商いで${profit}金を稼いだ。 Earned ${profit} gold from trade.`);
        break;
      }

      case 'recruit': {
        this.player.actionsThisTurn++;
        const cost = 40;
        if (this.player.gold >= cost) {
          const recruits = 5 + Math.floor(this.player.charm * 1.5 + Math.random() * 5);
          this.addGold(-cost);
          this.addSoldiers(recruits);
          UI.showMessage('募兵 Recruit', `${recruits}人の兵を雇った。 (-${cost}金, +${recruits}兵) Recruited ${recruits} soldiers.`);
        } else {
          UI.showMessage('募兵 Recruit', '金が足りない。 Not enough gold.');
        }
        break;
      }

      case 'rest':
        this.player.actionsThisTurn++;
        this.addHP(30);
        UI.showMessage('休息 Rest', '体を休めた。 (+30体力) Rested well.');
        break;

      case 'travel':
        UI.showTravelMenu();
        break;
    }
  },

  travelTo(cityId) {
    this.player.city = cityId;
    this.player.actionsThisTurn++;
    GameMap.centerOnCity(cityId);
    UI.hideAllPanels();
    UI.updateHUD(this.player);
    const city = CITIES.find(c => c.id === cityId);
    UI.showMessage('移動 Travel', `${city.name}(${city.nameEn})に到着した。 Arrived at ${city.nameEn}.`);
  },

  talkToNPC(npc) {
    UI.hideAllPanels();
    UI.showNPCDialog(npc);
  },

  // === Turn Management ===
  endTurn() {
    this.player.turn++;
    this.player.actionsThisTurn = 0;

    // Passive income
    const income = 5 + Math.floor(this.player.politics * 1.5);
    this.addGold(income);

    // Soldier upkeep
    const upkeep = Math.floor(this.player.soldiers * 0.5);
    this.addGold(-upkeep);

    // HP recovery
    this.addHP(10);

    // Fame decay prevention - small passive gain
    if (this.player.fame > 0 && this.player.soldiers > 20) {
      this.addFame(1);
    }

    // Check max actions upgrade based on title
    if (this.player.fame >= 150) this.player.maxActions = 3;
    if (this.player.fame >= 400) this.player.maxActions = 4;

    // Random event (40% chance)
    if (Math.random() < 0.4) {
      const event = RANDOM_EVENTS[Math.floor(Math.random() * RANDOM_EVENTS.length)];
      UI.updateHUD(this.player);
      UI.showEvent(event);
      return;
    }

    // Check win condition
    if (this.player.fame >= 600) {
      UI.showEndScreen(true);
      if (this.animId) cancelAnimationFrame(this.animId);
      return;
    }

    // Check lose condition
    if (this.player.hp <= 0 || (this.player.gold <= 0 && this.player.soldiers <= 0)) {
      UI.showEndScreen(false);
      if (this.animId) cancelAnimationFrame(this.animId);
      return;
    }

    UI.updateHUD(this.player);
    UI.showMessage('月末報告 Monthly Report',
      `第${this.player.turn}月開始。\n収入: +${income}金 / 兵糧: -${upkeep}金\nTurn ${this.player.turn} begins. Income: +${income}g / Upkeep: -${upkeep}g`);
  },

  // === Resource Helpers ===
  addGold(amount) {
    this.player.gold = Math.max(0, this.player.gold + amount);
  },

  addSoldiers(amount) {
    this.player.soldiers = Math.max(0, this.player.soldiers + amount);
  },

  addFame(amount) {
    this.player.fame = Math.max(0, this.player.fame + amount);
  },

  addHP(amount) {
    this.player.hp = Math.min(this.player.maxHP, Math.max(0, this.player.hp + amount));
  },

  // === Save/Load ===
  saveGame() {
    try {
      localStorage.setItem('taikou_save', JSON.stringify(this.player));
    } catch (e) {
      console.error('Save failed:', e);
    }
  },

  loadGame() {
    try {
      const data = localStorage.getItem('taikou_save');
      if (!data) return false;
      this.player = JSON.parse(data);
      // Ensure all fields exist (backwards compat)
      this.player.maxHP = this.player.maxHP || 100;
      this.player.actionsThisTurn = this.player.actionsThisTurn || 0;
      this.player.maxActions = this.player.maxActions || 2;
      return true;
    } catch (e) {
      console.error('Load failed:', e);
      return false;
    }
  }
};

// === Boot ===
document.addEventListener('DOMContentLoaded', () => {
  Game.init();
});
