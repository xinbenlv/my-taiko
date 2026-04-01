// === Combat System ===
// Three moves: Attack > Skill > Defend > Attack (rock-paper-scissors with stats)

const Combat = {
  active: false,
  playerHP: 0,
  playerMaxHP: 0,
  enemyHP: 0,
  enemyMaxHP: 0,
  enemy: null,
  onEnd: null,

  start(player, enemy, onEnd) {
    this.active = true;
    this.playerHP = player.hp;
    this.playerMaxHP = player.maxHP;
    this.enemyHP = enemy.martial * 8 + 20;
    this.enemyMaxHP = this.enemyHP;
    this.enemy = enemy;
    this.onEnd = onEnd;

    // Show combat panel
    const panel = document.getElementById('combat-panel');
    panel.classList.remove('hidden');

    document.querySelector('#combat-player .combatant-name').textContent = player.name;
    document.querySelector('#combat-enemy .combatant-name').textContent = enemy.name;

    this.updateDisplay();
    document.getElementById('combat-log').textContent = '勝負開始！ Fight!';
    document.getElementById('combat-actions').style.display = 'flex';
  },

  updateDisplay() {
    const pFill = document.querySelector('#combat-player .hp-fill');
    const eFill = document.querySelector('#combat-enemy .hp-fill');
    const pText = document.querySelector('#combat-player .combatant-hp');
    const eText = document.querySelector('#combat-enemy .combatant-hp');

    pFill.style.width = Math.max(0, (this.playerHP / this.playerMaxHP) * 100) + '%';
    eFill.style.width = Math.max(0, (this.enemyHP / this.enemyMaxHP) * 100) + '%';
    pText.textContent = `${Math.max(0, this.playerHP)} / ${this.playerMaxHP}`;
    eText.textContent = `${Math.max(0, this.enemyHP)} / ${this.enemyMaxHP}`;
  },

  doRound(playerMove) {
    if (!this.active) return;

    const player = Game.player;
    const enemy = this.enemy;

    // Enemy AI picks move
    const moves = ['attack', 'defend', 'skill'];
    const enemyMove = moves[Math.floor(Math.random() * 3)];

    // Calculate damage
    let playerDmg = 0;
    let enemyDmg = 0;
    let log = '';

    // Base damage from stats
    const pAtk = player.martial + Math.floor(player.intelligence * 0.3);
    const eAtk = enemy.martial + Math.floor((enemy.intelligence || 5) * 0.3);

    // RPS: Attack > Skill > Defend > Attack
    const advantage = this.getAdvantage(playerMove, enemyMove);

    if (advantage === 1) {
      // Player has advantage
      playerDmg = pAtk + Math.floor(Math.random() * 5) + 3;
      enemyDmg = Math.max(0, Math.floor(eAtk * 0.3) - 1);
      log = this.getMoveText(playerMove) + '  ' + this.getMoveText(enemyMove, true) + ' 有利！';
    } else if (advantage === -1) {
      // Enemy has advantage
      playerDmg = Math.max(0, Math.floor(pAtk * 0.3) - 1);
      enemyDmg = eAtk + Math.floor(Math.random() * 5) + 3;
      log = this.getMoveText(playerMove) + '  ' + this.getMoveText(enemyMove, true) + ' 不利...';
    } else {
      // Neutral
      playerDmg = Math.floor(pAtk * 0.7) + Math.floor(Math.random() * 3);
      enemyDmg = Math.floor(eAtk * 0.7) + Math.floor(Math.random() * 3);
      log = this.getMoveText(playerMove) + '  ' + this.getMoveText(enemyMove, true) + ' 互角！';
    }

    // Apply skill bonus
    if (playerMove === 'skill') playerDmg += Math.floor(player.intelligence * 0.5);
    if (enemyMove === 'skill') enemyDmg += Math.floor((enemy.intelligence || 5) * 0.5);

    this.enemyHP -= playerDmg;
    this.playerHP -= enemyDmg;

    log += ` (${playerDmg}与 / ${enemyDmg}被)`;
    document.getElementById('combat-log').textContent = log;
    this.updateDisplay();

    // Check end conditions
    if (this.enemyHP <= 0) {
      this.endCombat(true);
    } else if (this.playerHP <= 0) {
      this.endCombat(false);
    }
  },

  getAdvantage(pMove, eMove) {
    if (pMove === eMove) return 0;
    if (pMove === 'attack' && eMove === 'skill') return 1;
    if (pMove === 'skill' && eMove === 'defend') return 1;
    if (pMove === 'defend' && eMove === 'attack') return 1;
    return -1;
  },

  getMoveText(move, isEnemy) {
    const prefix = isEnemy ? 'vs' : '';
    switch (move) {
      case 'attack': return prefix + '斬撃';
      case 'defend': return prefix + '防御';
      case 'skill': return prefix + '技';
    }
    return '';
  },

  endCombat(playerWon) {
    this.active = false;
    document.getElementById('combat-actions').style.display = 'none';

    if (playerWon) {
      document.getElementById('combat-log').textContent = '勝利！ Victory!';
    } else {
      document.getElementById('combat-log').textContent = '敗北... Defeated...';
    }

    // Delay then close and callback
    setTimeout(() => {
      document.getElementById('combat-panel').classList.add('hidden');
      Game.player.hp = Math.max(1, this.playerHP);
      if (this.onEnd) this.onEnd(playerWon);
    }, 1500);
  }
};
