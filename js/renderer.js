/**
 * renderer.js - Simplified, high-performance canvas engine
 */

export class RothkoRenderer {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d', { willReadFrequently: true });

    this.width = canvasElement.width || 800;
    this.height = canvasElement.height || 1000;

    // Buffer 1: Permanent Baked Color Canvas
    this.bakedCanvas = document.createElement('canvas');
    this.bakedCtx = this.bakedCanvas.getContext('2d', { willReadFrequently: true });

    // Buffer 2: Heightfield for physical impasto/normal lighting
    this.bakedHeightBuffer = null;

    // Buffer 3: Offscreen Staging Scratchpad
    this.stagingCanvas = document.createElement('canvas');
    this.stagingCtx = this.stagingCanvas.getContext('2d');

    // Linen weave texture tile
    this.weaveTile = null;
    this.initLinenWeave();

    this.currentGround = null;
    this.activeStagedConfig = null;
    this.activeStagedGeom = null;

    this.allocateBuffers(this.canvas.width, this.canvas.height);
  }

  initLinenWeave() {
    const size = 64;
    this.weaveTile = document.createElement('canvas');
    this.weaveTile.width = size;
    this.weaveTile.height = size;
    const wCtx = this.weaveTile.getContext('2d');
    const img = wCtx.createImageData(size, size);

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = (y * size + x) * 4;
        const warp = Math.sin((x / size) * Math.PI * 8);
        const weft = Math.sin((y / size) * Math.PI * 8);
        const tooth = (warp * weft * 0.5 + 0.5) * 32 - 16;
        const noise = (Math.random() - 0.5) * 12;
        const lum = Math.min(255, Math.max(0, 128 + tooth + noise));

        img.data[idx] = lum;
        img.data[idx + 1] = lum;
        img.data[idx + 2] = lum;
        img.data[idx + 3] = 40; // Soft weave texture
      }
    }
    wCtx.putImageData(img, 0, 0);
  }

  allocateBuffers(w, h) {
    this.width = Math.max(1, w);
    this.height = Math.max(1, h);

    this.bakedCanvas.width = this.width;
    this.bakedCanvas.height = this.height;

    this.stagingCanvas.width = this.width;
    this.stagingCanvas.height = this.height;

    this.bakedHeightBuffer = new Float32Array(this.width * this.height);
  }

  setCanvasProportion(proportion) {
    this.allocateBuffers(this.canvas.width, this.canvas.height);
    if (this.currentGround) {
      this.renderGroundToBuffer();
    }
    this.compositeToDisplay();
  }

  setGroundStain(stain) {
    this.currentGround = stain;
    this.renderGroundToBuffer();
    this.compositeToDisplay();
  }

  renderGroundToBuffer() {
    const w = this.width;
    const h = this.height;
    const bCtx = this.bakedCtx;

    bCtx.save();
    bCtx.clearRect(0, 0, w, h);

    // Natural Linen or Chosen Ground Colour
    bCtx.fillStyle = this.currentGround ? this.currentGround.hex : '#e5dccb';
    bCtx.fillRect(0, 0, w, h);

    // Canvas Weave Overlay
    if (this.weaveTile) {
      bCtx.save();
      bCtx.globalCompositeOperation = 'multiply';
      bCtx.globalAlpha = this.currentGround && !this.currentGround.isRaw ? 0.35 : 0.65;
      const pattern = bCtx.createPattern(this.weaveTile, 'repeat');
      if (pattern) {
        bCtx.fillStyle = pattern;
        bCtx.fillRect(0, 0, w, h);
      }
      bCtx.restore();
    }

    // Baseline heightfield weave tooth
    const totalPixels = w * h;
    for (let i = 0; i < totalPixels; i++) {
      const px = i % w;
      const py = Math.floor(i / w);
      const warp = Math.sin((px / 8) * Math.PI);
      const weft = Math.sin((py / 8) * Math.PI);
      this.bakedHeightBuffer[i] = (warp * weft * 0.5 + 0.5) * 0.08;
    }

    bCtx.restore();
  }

  setStagedShape(shapeConfig, geometry) {
    this.activeStagedConfig = shapeConfig;
    this.activeStagedGeom = geometry;
    this.compositeToDisplay();
  }

  renderShapeToContext(targetCtx, shapeConfig, geometry, forBake = false) {
    if (!shapeConfig || !geometry) return;

    const w = this.width;
    const h = this.height;

    const px = geometry.x * w;
    const py = geometry.y * h;
    const pw = geometry.width * w;
    const ph = geometry.height * h;

    const { shape, pigment, texture, edge, bleedPercent } = shapeConfig;

    targetCtx.save();

    // Bleed controls border softening & glaze interaction
    const bleedNorm = (bleedPercent !== undefined ? bleedPercent : 50) / 100;
    const blurAmt = Math.max(1, edge.baseBlur * (0.4 + bleedNorm * 1.2));

    // Halo pass if bleed is high
    if (bleedNorm > 0.4 && pigment.halo) {
      targetCtx.save();
      targetCtx.filter = `blur(${blurAmt * 1.5}px)`;
      targetCtx.fillStyle = pigment.halo;
      targetCtx.globalAlpha = 0.35 * bleedNorm;
      this.drawShapePath(targetCtx, shape.id, px - 6, py - 6, pw + 12, ph + 12, geometry);
      targetCtx.fill();
      targetCtx.restore();
    }

    // Main pigment body
    targetCtx.save();
    targetCtx.filter = `blur(${blurAmt}px)`;
    targetCtx.fillStyle = pigment.hex;
    targetCtx.globalAlpha = 0.92;

    // Multi-pass wash depth
    const passes = texture.id === 'smooth' ? 3 : 2;
    for (let p = 0; p < passes; p++) {
      const spread = (p - passes / 2) * 2;
      this.drawShapePath(targetCtx, shape.id, px - spread, py - spread, pw + spread * 2, ph + spread * 2, geometry);
      targetCtx.fill();
    }
    targetCtx.restore();

    // Texture treatment
    if (texture.id === 'dry_brush') {
      targetCtx.save();
      targetCtx.globalCompositeOperation = 'screen';
      targetCtx.globalAlpha = 0.22;
      targetCtx.fillStyle = '#ffffff';
      for (let i = 0; i < 40; i++) {
        const ry = py + Math.random() * ph;
        const rx = px + Math.random() * pw;
        targetCtx.fillRect(rx, ry, 20 + Math.random() * 60, 2);
      }
      targetCtx.restore();
    } else if (texture.id === 'impasto') {
      targetCtx.save();
      targetCtx.globalCompositeOperation = 'source-over';
      targetCtx.globalAlpha = 0.15;
      targetCtx.fillStyle = '#000000';
      this.drawShapePath(targetCtx, shape.id, px + 3, py + 3, pw - 6, ph - 6, geometry);
      targetCtx.fill();
      targetCtx.restore();
    }

    targetCtx.restore();

    if (forBake && this.bakedHeightBuffer) {
      this.accumulateHeightfield(geometry, shapeConfig);
    }
  }

  drawShapePath(ctx, shapeId, x, y, w, h, geometry) {
    ctx.beginPath();
    if (shapeId === 'rectangle') {
      ctx.roundRect(x, y, w, h, Math.min(w, h) * 0.14);
    } else if (shapeId === 'horizon') {
      ctx.roundRect(x, y, w, h, Math.min(w, h) * 0.22);
    } else if (shapeId === 'pillar') {
      ctx.roundRect(x, y, w, h, Math.min(w, h) * 0.10);
    } else if (shapeId === 'twin_bars') {
      const gap = h * (geometry.gapRatio || 0.12);
      const barH = (h - gap) * 0.5;
      ctx.roundRect(x, y, w, barH, Math.min(w, barH) * 0.14);
      ctx.roundRect(x, y + barH + gap, w, barH, Math.min(w, barH) * 0.14);
    } else if (shapeId === 'oval') {
      ctx.ellipse(x + w * 0.5, y + h * 0.5, Math.max(1, w * 0.5), Math.max(1, h * 0.5), 0, 0, Math.PI * 2);
    } else {
      ctx.rect(x, y, w, h);
    }
    ctx.closePath();
  }

  bakeStagedShape() {
    if (!this.activeStagedConfig || !this.activeStagedGeom) return;
    this.renderShapeToContext(this.bakedCtx, this.activeStagedConfig, this.activeStagedGeom, true);
    this.activeStagedConfig = null;
    this.activeStagedGeom = null;
    this.compositeToDisplay();
  }

  accumulateHeightfield(geometry, shapeConfig) {
    const w = this.width;
    const h = this.height;
    const relief = (shapeConfig.texture.relief || 0.3) * 0.5;

    const minX = Math.max(0, Math.floor(geometry.x * w));
    const maxX = Math.min(w - 1, Math.ceil((geometry.x + geometry.width) * w));
    const minY = Math.max(0, Math.floor(geometry.y * h));
    const maxY = Math.min(h - 1, Math.ceil((geometry.y + geometry.height) * h));

    const cx = (minX + maxX) * 0.5;
    const cy = (minY + maxY) * 0.5;
    const halfW = (maxX - minX) * 0.5;
    const halfH = (maxY - minY) * 0.5;

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const idx = y * w + x;
        const dx = (x - cx) / (halfW || 1);
        const dy = (y - cy) / (halfH || 1);
        const distSq = dx * dx + dy * dy;
        if (distSq < 1.0) {
          const falloff = Math.cos(Math.sqrt(distSq) * (Math.PI * 0.5));
          this.bakedHeightBuffer[idx] = Math.min(1.0, this.bakedHeightBuffer[idx] + relief * falloff);
        }
      }
    }
  }

  compositeToDisplay() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.drawImage(this.bakedCanvas, 0, 0, this.canvas.width, this.canvas.height);

    if (this.activeStagedConfig && this.activeStagedGeom) {
      this.stagingCtx.clearRect(0, 0, this.width, this.height);
      this.renderShapeToContext(this.stagingCtx, this.activeStagedConfig, this.activeStagedGeom, false);
      this.ctx.drawImage(this.stagingCanvas, 0, 0, this.canvas.width, this.canvas.height);
    }
  }

  clearCanvas() {
    this.activeStagedConfig = null;
    this.activeStagedGeom = null;
    this.bakedCtx.clearRect(0, 0, this.width, this.height);
    if (this.bakedHeightBuffer) this.bakedHeightBuffer.fill(0);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  playSolventWashTransition() {
    return new Promise((resolve) => {
      const overlay = document.getElementById('solvent-overlay');
      if (overlay) overlay.classList.add('active');

      const startTime = performance.now();
      const duration = 800;

      const animateWash = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / duration);

        this.bakedCtx.save();
        this.bakedCtx.fillStyle = `rgba(40, 25, 20, ${progress * 0.25})`;
        this.bakedCtx.fillRect(0, 0, this.width, this.height);
        this.bakedCtx.restore();

        this.compositeToDisplay();

        if (progress < 1) {
          requestAnimationFrame(animateWash);
        } else {
          if (overlay) overlay.classList.remove('active');
          resolve();
        }
      };

      requestAnimationFrame(animateWash);
    });
  }

  getBakedBufferCanvas() {
    return this.bakedCanvas;
  }

  getBakedHeightBuffer() {
    return this.bakedHeightBuffer;
  }

  handleResize() {
    this.allocateBuffers(this.canvas.width, this.canvas.height);
    if (this.currentGround) {
      this.renderGroundToBuffer();
    }
    this.compositeToDisplay();
  }
}
