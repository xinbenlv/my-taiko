// === Map Rendering ===

const GameMap = {
  canvas: null,
  ctx: null,
  tileSize: 16,
  mapWidth: 30,
  mapHeight: 40,
  tiles: [],
  scrollX: 0,
  scrollY: 0,
  isDragging: false,
  dragStartX: 0,
  dragStartY: 0,
  lastScrollX: 0,
  lastScrollY: 0,
  animFrame: 0,

  init() {
    this.canvas = document.getElementById('game-map');
    this.ctx = this.canvas.getContext('2d');
    this.resize();
    this.generateMap();
    window.addEventListener('resize', () => this.resize());
  },

  resize() {
    const container = this.canvas.parentElement;
    const hud = document.getElementById('hud');
    const toolbar = document.getElementById('toolbar');
    const hudH = hud ? hud.offsetHeight : 50;
    const toolH = toolbar ? toolbar.offsetHeight : 44;
    this.canvas.width = container.offsetWidth;
    this.canvas.height = container.offsetHeight - hudH - toolH;
    // Adjust tile size for screen
    this.tileSize = Math.max(12, Math.floor(Math.min(this.canvas.width, this.canvas.height) / 25));
  },

  generateMap() {
    // Seed-based pseudo-random for consistent map
    const seed = 42;
    const rng = (x, y) => {
      let h = seed + x * 374761393 + y * 668265263;
      h = (h ^ (h >> 13)) * 1274126177;
      h = h ^ (h >> 16);
      return (h & 0x7fffffff) / 0x7fffffff;
    };

    this.tiles = [];
    for (let y = 0; y < this.mapHeight; y++) {
      this.tiles[y] = [];
      for (let x = 0; x < this.mapWidth; x++) {
        // Japan shape: roughly an arc from SW to NE
        const isLand = this.isJapanLand(x, y);
        if (!isLand) {
          this.tiles[y][x] = TERRAIN.WATER;
        } else {
          const r = rng(x, y);
          const distFromCoast = this.distFromWater(x, y);
          if (distFromCoast <= 1 && r < 0.3) {
            this.tiles[y][x] = TERRAIN.PLAIN;
          } else if (r < 0.45) {
            this.tiles[y][x] = TERRAIN.PLAIN;
          } else if (r < 0.7) {
            this.tiles[y][x] = TERRAIN.FOREST;
          } else {
            this.tiles[y][x] = TERRAIN.MOUNTAIN;
          }
        }
      }
    }

    // Place cities
    for (const city of CITIES) {
      if (city.x < this.mapWidth && city.y < this.mapHeight) {
        this.tiles[city.y][city.x] = TERRAIN.CASTLE;
        // Clear surroundings
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = city.x + dx, ny = city.y + dy;
            if (nx >= 0 && nx < this.mapWidth && ny >= 0 && ny < this.mapHeight) {
              if (this.tiles[ny][nx] === TERRAIN.WATER) {
                this.tiles[ny][nx] = TERRAIN.PLAIN;
              }
            }
          }
        }
      }
    }

    // Add roads between nearby cities
    for (let i = 0; i < CITIES.length; i++) {
      for (let j = i + 1; j < CITIES.length; j++) {
        const dist = Math.abs(CITIES[i].x - CITIES[j].x) + Math.abs(CITIES[i].y - CITIES[j].y);
        if (dist < 10) {
          this.drawRoad(CITIES[i].x, CITIES[i].y, CITIES[j].x, CITIES[j].y);
        }
      }
    }
  },

  isJapanLand(x, y) {
    // Simplified Japan archipelago shape
    // Main island (Honshu) - runs diagonally
    const cx = 15, cy = 20; // center of map

    // Honshu - main island body
    const honshuCenterX = cx + (y - cy) * 0.35;
    const honshuWidth = 4.5 + Math.sin(y * 0.3) * 1.5;
    const inHonshu = y >= 8 && y <= 28 && Math.abs(x - honshuCenterX) < honshuWidth;

    // Kyushu - southwest island
    const kyushuCX = 6, kyushuCY = 33;
    const inKyushu = Math.sqrt((x - kyushuCX) ** 2 + ((y - kyushuCY) * 0.8) ** 2) < 4;

    // Shikoku
    const shikokuCX = 10, shikokuCY = 28;
    const inShikoku = Math.sqrt(((x - shikokuCX) * 0.8) ** 2 + (y - shikokuCY) ** 2) < 2.5;

    // Northern Honshu extension
    const northExt = y >= 5 && y < 12 && Math.abs(x - (20 + (y - 8) * 0.5)) < 3;

    // Kanto plain area
    const kanto = y >= 17 && y <= 21 && x >= 19 && x <= 25;

    // Satsuma extension south
    const satsumaExt = y >= 33 && y <= 37 && Math.abs(x - 5) < 3;

    return inHonshu || inKyushu || inShikoku || northExt || kanto || satsumaExt;
  },

  distFromWater(x, y) {
    let minDist = 99;
    for (let r = 1; r <= 3; r++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || nx >= this.mapWidth || ny < 0 || ny >= this.mapHeight) {
            minDist = Math.min(minDist, r);
          } else if (!this.isJapanLand(nx, ny)) {
            minDist = Math.min(minDist, Math.abs(dx) + Math.abs(dy));
          }
        }
      }
    }
    return minDist;
  },

  drawRoad(x1, y1, x2, y2) {
    let x = x1, y = y1;
    while (x !== x2 || y !== y2) {
      if (this.tiles[y] && this.tiles[y][x] !== undefined) {
        if (this.tiles[y][x] !== TERRAIN.CASTLE && this.tiles[y][x] !== TERRAIN.WATER) {
          this.tiles[y][x] = TERRAIN.ROAD;
        }
      }
      if (x < x2) x++;
      else if (x > x2) x--;
      if (y < y2) y++;
      else if (y > y2) y--;
    }
  },

  centerOnCity(cityId) {
    const city = CITIES.find(c => c.id === cityId);
    if (!city) return;
    this.scrollX = city.x * this.tileSize - this.canvas.width / 2;
    this.scrollY = city.y * this.tileSize - this.canvas.height / 2;
    this.clampScroll();
  },

  clampScroll() {
    const maxX = this.mapWidth * this.tileSize - this.canvas.width;
    const maxY = this.mapHeight * this.tileSize - this.canvas.height;
    this.scrollX = Math.max(0, Math.min(maxX, this.scrollX));
    this.scrollY = Math.max(0, Math.min(maxY, this.scrollY));
  },

  render(playerCity, frame) {
    this.animFrame = frame || 0;
    const ctx = this.ctx;
    const ts = this.tileSize;

    // Clear
    ctx.fillStyle = '#0a1a3a';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Visible tile range
    const startX = Math.floor(this.scrollX / ts);
    const startY = Math.floor(this.scrollY / ts);
    const endX = Math.min(this.mapWidth, startX + Math.ceil(this.canvas.width / ts) + 2);
    const endY = Math.min(this.mapHeight, startY + Math.ceil(this.canvas.height / ts) + 2);

    // Draw tiles
    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        if (y < 0 || y >= this.mapHeight || x < 0 || x >= this.mapWidth) continue;
        const tile = this.tiles[y][x];
        const px = x * ts - this.scrollX;
        const py = y * ts - this.scrollY;

        // Base tile color with variation
        const colors = TERRAIN_COLORS[tile];
        const variant = (x * 7 + y * 13) % 3;
        ctx.fillStyle = colors[variant];

        if (tile === TERRAIN.WATER) {
          // Animated water
          const wave = Math.sin((x + y) * 0.5 + this.animFrame * 0.05) * 0.15;
          const r = parseInt(colors[0].slice(1, 3), 16);
          const g = parseInt(colors[0].slice(3, 5), 16);
          const b = parseInt(colors[0].slice(5, 7), 16);
          ctx.fillStyle = `rgb(${Math.floor(r + wave * 30)},${Math.floor(g + wave * 20)},${Math.floor(b + wave * 40)})`;
        }

        ctx.fillRect(px, py, ts, ts);

        // Tile details
        if (tile === TERRAIN.FOREST && ts >= 12) {
          ctx.fillStyle = '#0a2a0a';
          const cx = px + ts / 2;
          const cy = py + ts * 0.7;
          ctx.beginPath();
          ctx.moveTo(cx, py + 2);
          ctx.lineTo(cx + ts * 0.35, cy);
          ctx.lineTo(cx - ts * 0.35, cy);
          ctx.fill();
        }

        if (tile === TERRAIN.MOUNTAIN && ts >= 12) {
          ctx.fillStyle = '#9a8a7a';
          const cx = px + ts / 2;
          ctx.beginPath();
          ctx.moveTo(cx, py + 1);
          ctx.lineTo(px + ts - 2, py + ts - 2);
          ctx.lineTo(px + 2, py + ts - 2);
          ctx.fill();
          // Snow cap
          ctx.fillStyle = '#e0d8d0';
          ctx.beginPath();
          ctx.moveTo(cx, py + 1);
          ctx.lineTo(cx + ts * 0.15, py + ts * 0.3);
          ctx.lineTo(cx - ts * 0.15, py + ts * 0.3);
          ctx.fill();
        }

        // Grid lines (subtle)
        ctx.strokeStyle = 'rgba(0,0,0,0.15)';
        ctx.strokeRect(px, py, ts, ts);
      }
    }

    // Draw cities
    for (const city of CITIES) {
      const px = city.x * ts - this.scrollX;
      const py = city.y * ts - this.scrollY;

      if (px < -ts * 2 || px > this.canvas.width + ts * 2) continue;
      if (py < -ts * 2 || py > this.canvas.height + ts * 2) continue;

      // Castle icon
      const isPlayerHere = city.id === playerCity;
      const s = ts;

      // Castle base
      ctx.fillStyle = isPlayerHere ? '#d4a843' : '#8a7a3a';
      ctx.fillRect(px - s * 0.3, py - s * 0.2, s * 1.6, s * 1.2);

      // Castle tower
      ctx.fillStyle = isPlayerHere ? '#f0d060' : '#6a5a2a';
      ctx.fillRect(px, py - s * 0.6, s, s * 0.5);

      // Castle roof
      ctx.fillStyle = '#2a1a0a';
      ctx.beginPath();
      ctx.moveTo(px - s * 0.1, py - s * 0.6);
      ctx.lineTo(px + s * 0.5, py - s * 1);
      ctx.lineTo(px + s * 1.1, py - s * 0.6);
      ctx.fill();

      // Pulsing highlight for player location
      if (isPlayerHere) {
        ctx.strokeStyle = `rgba(240, 208, 96, ${0.4 + Math.sin(this.animFrame * 0.08) * 0.3})`;
        ctx.lineWidth = 2;
        ctx.strokeRect(px - s * 0.5, py - s * 1.1, s * 2, s * 1.8);
        ctx.lineWidth = 1;
      }

      // City name label
      ctx.fillStyle = isPlayerHere ? '#f0d060' : '#d4c8a0';
      ctx.font = `bold ${Math.max(9, ts * 0.6)}px monospace`;
      ctx.textAlign = 'center';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 3;
      ctx.strokeText(city.name, px + s * 0.5, py + s * 1.6);
      ctx.fillText(city.name, px + s * 0.5, py + s * 1.6);
    }

    // Draw player marker (flag)
    const pCity = CITIES.find(c => c.id === playerCity);
    if (pCity) {
      const px = pCity.x * ts - this.scrollX + ts * 0.5;
      const py = pCity.y * ts - this.scrollY - ts * 1.3;
      // Flag pole
      ctx.strokeStyle = '#d4a843';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px, py - ts * 0.8);
      ctx.stroke();
      // Flag
      ctx.fillStyle = '#c04040';
      ctx.beginPath();
      ctx.moveTo(px, py - ts * 0.8);
      ctx.lineTo(px + ts * 0.6, py - ts * 0.6);
      ctx.lineTo(px, py - ts * 0.4);
      ctx.fill();
      ctx.lineWidth = 1;
    }
  },

  getCityAt(screenX, screenY) {
    const ts = this.tileSize;
    for (const city of CITIES) {
      const px = city.x * ts - this.scrollX;
      const py = city.y * ts - this.scrollY;
      const hitArea = ts * 1.5;
      if (screenX >= px - hitArea * 0.3 && screenX <= px + hitArea &&
          screenY >= py - hitArea && screenY <= py + hitArea) {
        return city;
      }
    }
    return null;
  },

  setupInput(onCityClick) {
    let touchMoved = false;

    const getPos = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const touch = e.touches ? e.touches[0] || e.changedTouches[0] : e;
      return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
    };

    const onDown = (e) => {
      const pos = getPos(e);
      this.isDragging = true;
      touchMoved = false;
      this.dragStartX = pos.x;
      this.dragStartY = pos.y;
      this.lastScrollX = this.scrollX;
      this.lastScrollY = this.scrollY;
    };

    const onMove = (e) => {
      if (!this.isDragging) return;
      const pos = getPos(e);
      const dx = this.dragStartX - pos.x;
      const dy = this.dragStartY - pos.y;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) touchMoved = true;
      this.scrollX = this.lastScrollX + dx;
      this.scrollY = this.lastScrollY + dy;
      this.clampScroll();
    };

    const onUp = (e) => {
      if (!touchMoved) {
        const pos = getPos(e);
        const city = this.getCityAt(pos.x, pos.y);
        if (city) onCityClick(city);
      }
      this.isDragging = false;
    };

    this.canvas.addEventListener('mousedown', onDown);
    this.canvas.addEventListener('mousemove', onMove);
    this.canvas.addEventListener('mouseup', onUp);
    this.canvas.addEventListener('mouseleave', () => { this.isDragging = false; });
    this.canvas.addEventListener('touchstart', onDown, { passive: true });
    this.canvas.addEventListener('touchmove', onMove, { passive: true });
    this.canvas.addEventListener('touchend', onUp, { passive: true });
  }
};
