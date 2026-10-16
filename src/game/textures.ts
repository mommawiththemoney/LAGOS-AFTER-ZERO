import * as THREE from 'three';

/**
 * Procedural Texture Generator for Lagos: After Zero
 * Generates realistic urban surfaces, Nigerian shopfront signage, danfo bus livery,
 * road markings, and corrugated metal without external files.
 */

class TextureFactory {
  private cache: Map<string, THREE.CanvasTexture> = new Map();

  /**
   * Road asphalt texture with center lines and cracks
   */
  public getRoadTexture(): THREE.CanvasTexture {
    if (this.cache.has('road')) return this.cache.get('road')!;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Dark charcoal asphalt base with grain
    ctx.fillStyle = '#222326';
    ctx.fillRect(0, 0, 512, 512);

    // Speckle noise
    for (let i = 0; i < 15000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const gray = Math.floor(25 + Math.random() * 35);
      ctx.fillStyle = `rgb(${gray},${gray},${gray})`;
      ctx.fillRect(x, y, 1.5, 1.5);
    }

    // Weathered double yellow center lines
    ctx.fillStyle = '#d4a017';
    ctx.fillRect(246, 0, 8, 512);
    ctx.fillRect(258, 0, 8, 512);

    // Weathered white edge boundary dashes
    ctx.fillStyle = '#8f9399';
    ctx.fillRect(16, 0, 6, 512);
    ctx.fillRect(490, 0, 6, 512);

    // Oil stains and tire marks
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = 'rgba(10, 10, 12, 0.45)';
      ctx.beginPath();
      ctx.ellipse(120 + Math.random() * 270, Math.random() * 512, 35, 15, Math.random() * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    this.cache.set('road', tex);
    return tex;
  }

  /**
   * Sidewalk / Concrete paving
   */
  public getSidewalkTexture(): THREE.CanvasTexture {
    if (this.cache.has('sidewalk')) return this.cache.get('sidewalk')!;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#7a7670'; // slightly earthy Lagos urban dust tone
    ctx.fillRect(0, 0, 512, 512);

    // Tile grid lines
    ctx.strokeStyle = '#4e4c48';
    ctx.lineWidth = 4;
    for (let x = 0; x <= 512; x += 128) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 512);
      ctx.stroke();
    }
    for (let y = 0; y <= 512; y += 128) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();
    }

    // Surface dust & laterite clay specks
    for (let i = 0; i < 8000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      ctx.fillStyle = Math.random() > 0.4 ? 'rgba(120, 65, 40, 0.15)' : 'rgba(30, 30, 30, 0.2)';
      ctx.fillRect(x, y, 2, 2);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    this.cache.set('sidewalk', tex);
    return tex;
  }

  /**
   * Weathered Nigerian concrete compound wall with peeling paint & algae
   */
  public getWallTexture(baseColor: string = '#d1c7b7'): THREE.CanvasTexture {
    const key = 'wall_' + baseColor;
    if (this.cache.has(key)) return this.cache.get(key)!;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, 512, 512);

    // Concrete block horizontal and vertical seams
    ctx.strokeStyle = 'rgba(60, 55, 50, 0.35)';
    ctx.lineWidth = 2;
    for (let y = 0; y <= 512; y += 64) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();
      const offset = (y / 64) % 2 === 0 ? 0 : 64;
      for (let x = offset; x <= 512; x += 128) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + 64);
        ctx.stroke();
      }
    }

    // Rain grime drips running down
    for (let i = 0; i < 35; i++) {
      const gx = Math.random() * 512;
      const gWidth = 4 + Math.random() * 12;
      const gGrad = ctx.createLinearGradient(gx, 0, gx, 350 + Math.random() * 150);
      gGrad.addColorStop(0, 'rgba(40, 48, 42, 0.5)'); // algae green grime
      gGrad.addColorStop(0.7, 'rgba(60, 50, 40, 0.3)');
      gGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gGrad;
      ctx.fillRect(gx, 0, gWidth, 400);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    this.cache.set(key, tex);
    return tex;
  }

  /**
   * Famous Lagos Danfo Minibus livery texture (Yellow with dual black stripes)
   */
  public getDanfoLiveryTexture(): THREE.CanvasTexture {
    if (this.cache.has('danfo')) return this.cache.get('danfo')!;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    // Vibrant Lagos Danfo Yellow
    ctx.fillStyle = '#f5b800';
    ctx.fillRect(0, 0, 512, 256);

    // Two horizontal black stripes across the body
    ctx.fillStyle = '#1c1b18';
    ctx.fillRect(0, 110, 512, 18);
    ctx.fillRect(0, 140, 512, 18);

    // Weathering, mud splatter at bottom
    ctx.fillStyle = 'rgba(75, 45, 25, 0.4)';
    ctx.fillRect(0, 220, 512, 36);

    // Metro text
    ctx.fillStyle = '#111';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('LAGOS METRO - OJUELEGBA', 30, 85);
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('NO FARE REFUND • ZERO ACCIDENT', 32, 200);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    this.cache.set('danfo', tex);
    return tex;
  }

  /**
   * Corrugated iron zinc roof with rusty streaks
   */
  public getZincRoofTexture(): THREE.CanvasTexture {
    if (this.cache.has('zinc')) return this.cache.get('zinc')!;
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#78828c';
    ctx.fillRect(0, 0, 256, 256);

    // Ridges
    for (let x = 0; x < 256; x += 16) {
      const grad = ctx.createLinearGradient(x, 0, x + 16, 0);
      grad.addColorStop(0, '#555e66');
      grad.addColorStop(0.5, '#9aa5b0');
      grad.addColorStop(1, '#4e555c');
      ctx.fillStyle = grad;
      ctx.fillRect(x, 0, 16, 256);
    }

    // Rust patches
    for (let i = 0; i < 20; i++) {
      const rx = Math.random() * 256;
      const ry = Math.random() * 256;
      ctx.fillStyle = 'rgba(165, 65, 30, 0.55)';
      ctx.beginPath();
      ctx.ellipse(rx, ry, 15 + Math.random() * 25, 8 + Math.random() * 15, Math.random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    this.cache.set('zinc', tex);
    return tex;
  }

  /**
   * Mama Ngozi Provisions sign
   */
  public getShopSignTexture(): THREE.CanvasTexture {
    if (this.cache.has('shop_sign')) return this.cache.get('shop_sign')!;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    // Weathered painted plywood board
    ctx.fillStyle = '#0f3820'; // deep green
    ctx.fillRect(0, 0, 512, 128);

    ctx.strokeStyle = '#e0a526';
    ctx.lineWidth = 6;
    ctx.strokeRect(6, 6, 500, 116);

    ctx.fillStyle = '#f2e8cf';
    ctx.font = '900 32px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('MAMA NGOZI PROVISIONS', 256, 48);

    ctx.fillStyle = '#e0a526';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('COLD MINERALS • CANNED FOOD • PURE WATER', 256, 82);

    ctx.fillStyle = '#a6bda8';
    ctx.font = 'italic 14px sans-serif';
    ctx.fillText('Adeniji St, Lagos Mainland • Est. 2029', 256, 108);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    this.cache.set('shop_sign', tex);
    return tex;
  }

  /**
   * Electronics & Generator Repair shop sign
   */
  public getElectronicsShopSign(): THREE.CanvasTexture {
    if (this.cache.has('elec_sign')) return this.cache.get('elec_sign')!;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#1e293b'; // slate dark blue
    ctx.fillRect(0, 0, 512, 128);

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 5;
    ctx.strokeRect(6, 6, 500, 116);

    ctx.fillStyle = '#f8fafc';
    ctx.font = '900 30px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ALABA TECH & REPAIRS', 256, 48);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('BATTERIES • GENERATORS • COMM RADIOS', 256, 82);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    this.cache.set('elec_sign', tex);
    return tex;
  }

  /**
   * Roadblock hazard warning sign
   */
  public getRoadblockWarningSign(): THREE.CanvasTexture {
    if (this.cache.has('hazard_sign')) return this.cache.get('hazard_sign')!;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    // Yellow and black warning stripes border
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, 512, 256);

    ctx.fillStyle = '#b91c1c'; // Emergency red
    ctx.fillRect(16, 16, 480, 224);

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.font = '900 34px sans-serif';
    ctx.fillText('RESTRICTED ACCESS', 256, 70);

    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('BRIDGE TO REGION B (ISLAND)', 256, 115);

    ctx.fillStyle = '#fef08a';
    ctx.font = '16px monospace';
    ctx.fillText('ZERO HOUR EVACUATION PROTOCOL ACTIVE', 256, 155);
    ctx.fillText('EMERGENCY CLEARANCE KEYCARD REQUIRED', 256, 185);

    // Danger symbol
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.strokeRect(24, 24, 464, 208);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    this.cache.set('hazard_sign', tex);
    return tex;
  }

  /**
   * Wood grain for safehouse workbench & crates
   */
  public getWoodTexture(): THREE.CanvasTexture {
    if (this.cache.has('wood')) return this.cache.get('wood')!;
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#5c3a21';
    ctx.fillRect(0, 0, 256, 256);

    // Grain lines
    for (let y = 0; y < 256; y += 4) {
      ctx.strokeStyle = Math.random() > 0.5 ? '#432918' : '#72492a';
      ctx.lineWidth = 2 + Math.random() * 2;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(80, y + Math.sin(y * 0.1) * 8, 180, y - Math.cos(y * 0.1) * 8, 256, y);
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    this.cache.set('wood', tex);
    return tex;
  }
}

export const textureFactory = new TextureFactory();
