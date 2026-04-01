// === Game Data ===

const TITLES = [
  { name: '足軽 Ashigaru', fame: 0 },
  { name: '侍 Samurai', fame: 30 },
  { name: '侍大将 Captain', fame: 80 },
  { name: '奉行 Magistrate', fame: 150 },
  { name: '家老 Elder', fame: 250 },
  { name: '城主 Castle Lord', fame: 400 },
  { name: '大名 Daimyo', fame: 600 },
];

const TERRAIN = {
  WATER: 0,
  PLAIN: 1,
  FOREST: 2,
  MOUNTAIN: 3,
  CASTLE: 4,
  ROAD: 5,
};

const TERRAIN_COLORS = {
  [TERRAIN.WATER]: ['#1a3a6a', '#1a4080', '#163068'],
  [TERRAIN.PLAIN]: ['#3a6a2a', '#4a7a3a', '#2a5a1a'],
  [TERRAIN.FOREST]: ['#1a4a1a', '#2a5a2a', '#0a3a0a'],
  [TERRAIN.MOUNTAIN]: ['#6a5a4a', '#7a6a5a', '#5a4a3a'],
  [TERRAIN.CASTLE]: ['#8a7a2a', '#9a8a3a', '#7a6a1a'],
  [TERRAIN.ROAD]: ['#5a5040', '#6a6050', '#4a4030'],
};

// Map: 30x40 tile grid representing Japan
// Will be procedurally generated, but cities are fixed
const CITIES = [
  { id: 'kyoto', name: '京都', nameEn: 'Kyoto', x: 14, y: 22, lord: '足利義昭',
    desc: '帝の都、文化の中心。 The imperial capital, center of culture.' },
  { id: 'osaka', name: '大坂', nameEn: 'Osaka', x: 14, y: 25, lord: '三好長慶',
    desc: '商業の要衝、天下の台所。 The merchant hub, kitchen of the realm.' },
  { id: 'owari', name: '尾張', nameEn: 'Owari', x: 17, y: 20, lord: '織田信長',
    desc: '風雲児の本拠地。 Home of the revolutionary warlord.' },
  { id: 'mikawa', name: '三河', nameEn: 'Mikawa', x: 19, y: 21, lord: '徳川家康',
    desc: '堅実なる東の盟主。 The steadfast lord of the east.' },
  { id: 'kai', name: '甲斐', nameEn: 'Kai', x: 21, y: 17, lord: '武田信玄',
    desc: '山の虎、風林火山。 The Tiger of Kai - Wind, Forest, Fire, Mountain.' },
  { id: 'echigo', name: '越後', nameEn: 'Echigo', x: 20, y: 12, lord: '上杉謙信',
    desc: '越後の龍、軍神。 The Dragon of Echigo, God of War.' },
  { id: 'sagami', name: '相模', nameEn: 'Sagami', x: 23, y: 19, lord: '北条氏康',
    desc: '関東の覇者。 The hegemon of the Kanto region.' },
  { id: 'aki', name: '安芸', nameEn: 'Aki', x: 8, y: 27, lord: '毛利元就',
    desc: '三本の矢の教え。 The wisdom of three arrows.' },
  { id: 'satsuma', name: '薩摩', nameEn: 'Satsuma', x: 5, y: 35, lord: '島津義久',
    desc: '南の猛将。 The fierce warriors of the south.' },
  { id: 'mutsu', name: '陸奥', nameEn: 'Mutsu', x: 22, y: 7, lord: '伊達政宗',
    desc: '独眼竜、北の覇者。 The One-Eyed Dragon of the north.' },
];

const NPCS = [
  { id: 'merchant1', name: '堺の商人', nameEn: 'Sakai Merchant', type: 'merchant',
    city: 'osaka', martial: 2, intelligence: 7, charm: 8, politics: 6,
    dialogue: '南蛮の品、いかがですか？ Interested in foreign goods?' },
  { id: 'ronin1', name: '流浪の剣客', nameEn: 'Wandering Swordsman', type: 'rival',
    city: null, martial: 12, intelligence: 5, charm: 4, politics: 3,
    dialogue: '腕に覚えがあるなら勝負せい！ Fight me if you dare!' },
  { id: 'monk1', name: '高野山の僧', nameEn: 'Koyasan Monk', type: 'sage',
    city: 'kyoto', martial: 3, intelligence: 14, charm: 10, politics: 5,
    dialogue: '心を静めよ、知恵が見えてくる。 Calm your mind, wisdom will come.' },
  { id: 'ninja1', name: '伊賀の忍', nameEn: 'Iga Ninja', type: 'spy',
    city: null, martial: 10, intelligence: 12, charm: 3, politics: 6,
    dialogue: '情報が欲しいか？代価は高いぞ。 Want information? It costs dearly.' },
  { id: 'blacksmith1', name: '関の鍛冶', nameEn: 'Seki Blacksmith', type: 'merchant',
    city: 'owari', martial: 6, intelligence: 5, charm: 5, politics: 3,
    dialogue: '良い刀を打ってやろう。 I will forge you a fine blade.' },
  { id: 'princess1', name: '姫君', nameEn: 'Princess', type: 'noble',
    city: 'kyoto', martial: 1, intelligence: 9, charm: 15, politics: 11,
    dialogue: '政の話をいたしましょう。 Let us discuss matters of state.' },
  { id: 'farmer1', name: '庄屋の長', nameEn: 'Village Elder', type: 'peasant',
    city: null, martial: 3, intelligence: 6, charm: 7, politics: 4,
    dialogue: '今年の収穫は良さそうだ。 This year\'s harvest looks promising.' },
  { id: 'pirate1', name: '海賊衆', nameEn: 'Pirates', type: 'rival',
    city: 'satsuma', martial: 11, intelligence: 6, charm: 5, politics: 2,
    dialogue: '海の男に陸の法は通じぬ！ The laws of land mean nothing at sea!' },
];

const RANDOM_EVENTS = [
  {
    id: 'bandits',
    title: '山賊襲来 - Bandit Attack!',
    text: '山道で山賊に遭遇した！\nBandits ambush you on the mountain road!',
    choices: [
      { text: '戦う Fight them', effect: (g) => {
        if (g.player.martial >= 8) {
          g.addGold(30);
          return '山賊を退治し、褒美を得た！ (+30金) Defeated the bandits and gained a reward!';
        } else {
          g.addHP(-20);
          return '苦戦の末、なんとか撃退した。 (-20体力) Barely fought them off.';
        }
      }},
      { text: '逃げる Flee', effect: (g) => {
        g.addGold(-10);
        return '金を落として逃げた。 (-10金) Dropped gold while fleeing.';
      }},
      { text: '交渉する Negotiate', effect: (g) => {
        if (g.player.charm >= 8) {
          g.addFame(5);
          return '言葉巧みに山賊を説得した。 (+5名声) Talked your way out of it!';
        } else {
          g.addGold(-20);
          return '交渉決裂、金を奪われた。 (-20金) Negotiation failed, robbed!';
        }
      }},
    ]
  },
  {
    id: 'merchant_caravan',
    title: '商人の隊列 - Merchant Caravan',
    text: '豪商の隊列に出会った。商いの話がある。\nYou encounter a wealthy merchant caravan.',
    choices: [
      { text: '取引する Trade', effect: (g) => {
        if (g.player.gold >= 50) {
          g.addGold(-50);
          g.player.intelligence += 1;
          return '珍しい書物を買い、知略が上がった！ (-50金, +1知略) Bought rare texts!';
        }
        return '金が足りない。 Not enough gold.';
      }},
      { text: '護衛を申し出る Offer escort', effect: (g) => {
        g.addGold(40);
        g.addFame(3);
        return '護衛の礼を受けた。 (+40金, +3名声) Earned escort fee!';
      }},
      { text: '通り過ぎる Pass by', effect: () => '何事もなく過ぎた。 Nothing happened.' },
    ]
  },
  {
    id: 'dojo',
    title: '道場破り - Dojo Challenge',
    text: '名高い道場を発見した。挑戦するか？\nYou find a famous dojo. Challenge it?',
    choices: [
      { text: '挑戦する Challenge', effect: (g) => {
        if (g.player.martial >= 10) {
          g.player.martial += 2;
          g.addFame(10);
          return '見事勝利！武名が轟いた！ (+2武力, +10名声) Magnificent victory!';
        } else if (g.player.martial >= 6) {
          g.player.martial += 1;
          g.addHP(-15);
          return '善戦したが惜敗。 (+1武力, -15体力) Fought well but lost.';
        } else {
          g.addHP(-25);
          return '完敗した。 (-25体力) Utterly defeated.';
        }
      }},
      { text: '見学する Observe', effect: (g) => {
        g.player.intelligence += 1;
        return '技を観察し学んだ。 (+1知略) Learned by observing.';
      }},
    ]
  },
  {
    id: 'festival',
    title: '祭り - Festival',
    text: '村の祭りに遭遇した！\nYou stumble upon a village festival!',
    choices: [
      { text: '参加する Join in', effect: (g) => {
        g.addHP(20);
        g.player.charm += 1;
        return '楽しい一時を過ごした！ (+20体力, +1魅力) Had a wonderful time!';
      }},
      { text: '奉納する Donate', effect: (g) => {
        if (g.player.gold >= 30) {
          g.addGold(-30);
          g.addFame(8);
          return '気前の良さが評判になった！ (-30金, +8名声) Your generosity is praised!';
        }
        return '金が足りない。 Not enough gold.';
      }},
    ]
  },
  {
    id: 'spy_info',
    title: '密偵の報告 - Spy Report',
    text: '怪しい男が近づいてきた。情報を売ると言う。\nA suspicious man approaches with information for sale.',
    choices: [
      { text: '買う Buy info (20金)', effect: (g) => {
        if (g.player.gold >= 20) {
          g.addGold(-20);
          g.player.politics += 1;
          return '他国の動向を知った。 (-20金, +1政治) Gained political insight!';
        }
        return '金が足りない。 Not enough gold.';
      }},
      { text: '断る Refuse', effect: () => '怪しい男は去った。 The man left.' },
    ]
  },
  {
    id: 'wanderer',
    title: '旅の武芸者 - Traveling Warrior',
    text: '腕の立つ武芸者が仕官先を探している。\nA skilled warrior seeks employment.',
    choices: [
      { text: '仲間にする Recruit (50金)', effect: (g) => {
        if (g.player.gold >= 50) {
          g.addGold(-50);
          g.addSoldiers(15);
          return '頼もしい仲間を得た！ (-50金, +15兵) Gained a reliable ally!';
        }
        return '金が足りない。 Not enough gold.';
      }},
      { text: '手合わせ Spar', effect: (g) => {
        g.player.martial += 1;
        return '良い稽古になった。 (+1武力) Good training!';
      }},
      { text: '見送る Let go', effect: () => '武芸者は去った。 The warrior departed.' },
    ]
  },
  {
    id: 'flood',
    title: '洪水 - Flood',
    text: '大雨で川が氾濫した！\nHeavy rains caused a flood!',
    choices: [
      { text: '救援に向かう Help rescue', effect: (g) => {
        g.addHP(-10);
        g.addFame(12);
        g.player.charm += 1;
        return '民を救い、名声を得た！ (-10体力, +12名声, +1魅力) Saved villagers!';
      }},
      { text: '避難する Take shelter', effect: (g) => {
        g.addGold(-10);
        return '食料が流された。 (-10金) Lost some supplies.';
      }},
    ]
  },
  {
    id: 'tea_ceremony',
    title: '茶会への招待 - Tea Ceremony',
    text: '高名な茶人から茶会に招かれた。\nA famous tea master invites you to a ceremony.',
    choices: [
      { text: '参加する Attend', effect: (g) => {
        g.player.charm += 1;
        g.player.politics += 1;
        return '教養を深めた。 (+1魅力, +1政治) Deepened your refinement.';
      }},
      { text: '辞退する Decline', effect: () => '別の用事があった。 Had other business.' },
    ]
  },
];

const TRAIN_RESULTS = {
  martial: [
    '剣術の修行を積んだ。',
    '槍術を磨いた。',
    '弓の腕を上げた。',
    '馬術を鍛えた。',
  ],
  intelligence: [
    '兵法書を読み耽った。',
    '孫子の兵法を学んだ。',
    '軍略を研究した。',
    '天文を学んだ。',
  ],
  charm: [
    '礼儀作法を学んだ。',
    '和歌を詠んだ。',
    '茶の湯を嗜んだ。',
    '笛の稽古をした。',
  ],
  politics: [
    '治世の書を学んだ。',
    '法令を研究した。',
    '農政を学んだ。',
    '商いの仕組みを学んだ。',
  ],
};
