/**
 * lightroom.js - Clean Architectural Gallery Light Room with Ultra-Compact Toggle Plaque
 */

import { WALL_ARCHITECTURES } from './palette.js';

export class GalleryLightRoom {
  constructor(galleryCanvasElement) {
    this.canvas = galleryCanvasElement;
    this.ctx = galleryCanvasElement.getContext('2d', { willReadFrequently: true });

    this.colorBuffer = null;
    this.heightBuffer = null;
    this.provenance = null;

    this.bw = 0;
    this.bh = 0;
    this.normalMap = null;

    this.wall = WALL_ARCHITECTURES[0];
    this.intensity = 0.65;
    this.kelvin = 3200;

    this.spotX = 0.5;
    this.spotY = 0.35;
    this.isDraggingSpotlight = false;

    this.litCanvas = document.createElement('canvas');
    this.litCtx = this.litCanvas.getContext('2d', { willReadFrequently: true });

    this.domRoom = document.getElementById('gallery-room');
    this.domWallFrame = document.getElementById('gallery-wall-frame');
    this.domShutter = document.getElementById('shutter-flash');
    this.domPlaque = document.getElementById('museum-plaque');

    this.onPointerDown = this.handlePointerDown.bind(this);
    this.onPointerMove = this.handlePointerMove.bind(this);
    this.onPointerUp = this.handlePointerUp.bind(this);

    this.initPlaqueToggleBehavior();
  }

  initPlaqueToggleBehavior() {
    if (!this.domPlaque) return;

    this.domPlaque.addEventListener('click', (e) => {
      // If user is actively typing in a contenteditable field, don't collapse on their keystrokes/selection clicks
      if (e.target.isContentEditable && this.domPlaque.classList.contains('is-expanded')) {
        return;
      }
      this.domPlaque.classList.toggle('is-expanded');
    });

    // Clicking anywhere on the gallery wall outside collapses the plaque back to small size
    document.addEventListener('click', (e) => {
      if (this.domPlaque && !this.domPlaque.contains(e.target) && !e.target.closest('#gallery-hud')) {
        this.domPlaque.classList.remove('is-expanded');
      }
    });
  }

  enter(colorBuffer, heightBuffer, provenanceData) {
    this.colorBuffer = colorBuffer;
    this.heightBuffer = heightBuffer;
    this.provenance = provenanceData;

    this.bw = colorBuffer.width;
    this.bh = colorBuffer.height;

    this.litCanvas.width = this.bw;
    this.litCanvas.height = this.bh;

    this.precomputeNormalMap();

    this.domRoom.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);

    this.resizeGalleryStage();
    this.render();
  }

  exit() {
    this.domRoom.removeEventListener('pointerdown', this.onPointerDown);
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    this.isDraggingSpotlight = false;
    if (this.domPlaque) this.domPlaque.classList.remove('is-expanded');
  }

  setWallArchitecture(wall) {
    this.wall = wall;
    this.render();
  }

  setLighting(intensity, kelvin) {
    this.intensity = intensity;
    this.kelvin = kelvin;
    this.render();
  }

  precomputeNormalMap() {
    const w = this.bw;
    const h = this.bh;
    this.normalMap = new Float32Array(w * h * 2);

    if (!this.heightBuffer) return;

    const hBuf = this.heightBuffer;
    const scale = 3.0;

    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const idx = y * w + x;
        const dzdx = (hBuf[idx + 1] - hBuf[idx - 1]) * 0.5 * scale;
        const dzdy = (hBuf[idx + w] - hBuf[idx - w]) * 0.5 * scale;

        const outIdx = idx * 2;
        this.normalMap[outIdx] = -dzdx;
        this.normalMap[outIdx + 1] = -dzdy;
      }
    }
  }

  kelvinToRGB(kelvin) {
    const temp = kelvin / 100;
    let r, g, b;

    if (temp <= 66) {
      r = 255;
      g = Math.min(255, Math.max(0, 99.47 * Math.log(temp) - 161.12));
      b = temp <= 19 ? 0 : Math.min(255, Math.max(0, 138.52 * Math.log(temp - 10) - 305.04));
    } else {
      r = Math.min(255, Math.max(0, 329.7 * Math.pow(temp - 60, -0.133)));
      g = Math.min(255, Math.max(0, 288.1 * Math.pow(temp - 60, -0.075)));
      b = 255;
    }

    return [r / 255, g / 255, b / 255];
  }

  handlePointerDown(e) {
    if (e.target.closest('#gallery-hud') || e.target.closest('#museum-plaque')) return;
    this.isDraggingSpotlight = true;
    this.updateSpotlight(e);
  }

  handlePointerMove(e) {
    if (!this.isDraggingSpotlight) return;
    this.updateSpotlight(e);
  }

  handlePointerUp() {
    this.isDraggingSpotlight = false;
  }

  updateSpotlight(e) {
    const rect = this.domRoom.getBoundingClientRect();
    this.spotX = Math.max(0.05, Math.min(0.95, (e.clientX - rect.left) / rect.width));
    this.spotY = Math.max(0.05, Math.min(0.95, (e.clientY - rect.top) / rect.height));
    this.render();
  }

  resizeGalleryStage() {
    const availW = window.innerWidth * 0.60;
    const availH = window.innerHeight * 0.68;
    const ratio = this.bw / this.bh;

    let finalW, finalH;
    if (availW / availH > ratio) {
      finalH = availH;
      finalW = finalH * ratio;
    } else {
      finalW = availW;
      finalH = finalW / ratio;
    }

    finalW = Math.round(finalW);
    finalH = Math.round(finalH);

    this.canvas.width = finalW;
    this.canvas.height = finalH;
    this.domWallFrame.style.width = `${finalW}px`;
    this.domWallFrame.style.height = `${finalH}px`;
  }

  renderLitPainting() {
    const w = this.bw;
    const h = this.bh;

    this.litCtx.clearRect(0, 0, w, h);
    this.litCtx.drawImage(this.colorBuffer, 0, 0);

    const img = this.litCtx.getImageData(0, 0, w, h);
    const data = img.data;
    const norm = this.normalMap;
    const kRGB = this.kelvinToRGB(this.kelvin);

    const lightNormX = this.spotX;
    const lightNormY = this.spotY;
    const int = this.intensity;

    for (let y = 0; y < h; y++) {
      const dy = (y / h) - lightNormY;
      for (let x = 0; x < w; x++) {
        const dx = (x / w) - lightNormX;
        const idx = (y * w + x) * 4;

        const distSq = dx * dx + dy * dy;
        const atten = Math.max(0.2, 1.0 - Math.sqrt(distSq) * 1.1);

        const nIdx = (y * w + x) * 2;
        const nx = norm ? norm[nIdx] : 0;
        const ny = norm ? norm[nIdx + 1] : 0;
        const dot = (-dx * nx + -dy * ny) * 0.6;
        const diffuse = Math.max(0.65, 1.0 + dot);

        const light = diffuse * (0.6 + atten * 0.5) * int * 1.3;

        data[idx] = Math.min(255, data[idx] * light * kRGB[0]);
        data[idx + 1] = Math.min(255, data[idx + 1] * light * kRGB[1]);
        data[idx + 2] = Math.min(255, data[idx + 2] * light * kRGB[2]);
      }
    }

    this.litCtx.putImageData(img, 0, 0);
  }

  render() {
    if (!this.colorBuffer) return;
    this.renderLitPainting();

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.drawImage(this.litCanvas, 0, 0, this.canvas.width, this.canvas.height);

    const kRGB = this.kelvinToRGB(this.kelvin);
    const r = Math.round(kRGB[0] * 255);
    const g = Math.round(kRGB[1] * 255);
    const b = Math.round(kRGB[2] * 255);

    const spotField = document.getElementById('gallery-spotlight-field');
    if (spotField) {
      spotField.style.background = `radial-gradient(circle at ${this.spotX * 100}% ${this.spotY * 100}%, 
        rgba(${r}, ${g}, ${b}, ${this.intensity * 0.45}) 0%, 
        rgba(10, 8, 8, 0.90) 65%, 
        #050404 100%)`;
    }

    const floor = document.getElementById('gallery-floor');
    if (floor) {
      floor.style.background = `linear-gradient(to bottom, ${this.wall.floorColor} 0%, #060505 100%)`;
    }
  }

  capturePhotograph() {
    if (this.domShutter) {
      this.domShutter.classList.add('flash');
      setTimeout(() => this.domShutter.classList.remove('flash'), 120);
    }

    const expW = 1920;
    const expH = 1080;
    const expCanvas = document.createElement('canvas');
    expCanvas.width = expW;
    expCanvas.height = expH;
    const expCtx = expCanvas.getContext('2d');

    // 1. Wall
    expCtx.fillStyle = this.wall.wallColor;
    expCtx.fillRect(0, 0, expW, expH);

    // 2. Light gradient
    const kRGB = this.kelvinToRGB(this.kelvin);
    const grad = expCtx.createRadialGradient(
      this.spotX * expW, this.spotY * expH, 20,
      this.spotX * expW, this.spotY * expH, expW * 0.75
    );
    grad.addColorStop(0, `rgba(${Math.round(kRGB[0]*255)}, ${Math.round(kRGB[1]*255)}, ${Math.round(kRGB[2]*255)}, ${this.intensity * 0.45})`);
    grad.addColorStop(0.7, 'rgba(8, 7, 7, 0.85)');
    grad.addColorStop(1, '#020202');
    expCtx.fillStyle = grad;
    expCtx.fillRect(0, 0, expW, expH);

    // 3. Floor
    const floorH = expH * 0.22;
    const floorY = expH - floorH;
    const fGrad = expCtx.createLinearGradient(0, floorY, 0, expH);
    fGrad.addColorStop(0, this.wall.floorColor);
    fGrad.addColorStop(1, '#050404');
    expCtx.fillStyle = fGrad;
    expCtx.fillRect(0, floorY, expW, floorH);

    // 4. Painting
    const paintingH = expH * 0.60;
    const aspect = this.bw / this.bh;
    const paintingW = paintingH * aspect;
    const paintingX = (expW - paintingW) * 0.5;
    const paintingY = (floorY - paintingH) * 0.65;

    // Shadow
    expCtx.save();
    expCtx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    expCtx.shadowBlur = 50;
    expCtx.shadowOffsetY = 24;
    expCtx.fillStyle = '#000000';
    expCtx.fillRect(paintingX, paintingY, paintingW, paintingH);
    expCtx.restore();

    // Painting canvas
    expCtx.drawImage(this.litCanvas, paintingX, paintingY, paintingW, paintingH);

    // 5. Proportionally scaled Museum Plaque
    const plaqueW = 150;
    const plaqueH = 80;
    const plaqueX = Math.min(expW - plaqueW - 40, paintingX + paintingW + 28);
    const plaqueY = paintingY + paintingH - plaqueH - 6;

    expCtx.save();
    expCtx.shadowColor = 'rgba(0,0,0,0.55)';
    expCtx.shadowBlur = 16;
    expCtx.shadowOffsetY = 6;
    expCtx.fillStyle = '#e2dcd4';
    expCtx.fillRect(plaqueX, plaqueY, plaqueW, plaqueH);
    expCtx.restore();

    // Read current user-edited text from DOM
    const artistElem = document.querySelector('.plaque-artist');
    const artistText = artistElem ? artistElem.textContent.trim() : 'Name';

    const titleElem = document.querySelector('.plaque-title');
    const titleText = titleElem ? titleElem.textContent.trim() : 'Untitled';

    const provElem = document.getElementById('plaque-provenance-text');
    const provText = provElem ? provElem.textContent.trim() : 'First state — executed without prior scraped studies';

    // Draw typography onto export
    expCtx.fillStyle = '#1a1615';
    expCtx.font = 'bold 11px Georgia, serif';
    expCtx.fillText(artistText, plaqueX + 10, plaqueY + 18);

    expCtx.font = 'italic 9.5px Georgia, serif';
    expCtx.fillStyle = '#1a1615';
    expCtx.fillText(`${titleText}, `, plaqueX + 10, plaqueY + 34);

    const titleWidth = expCtx.measureText(`${titleText}, `).width;
    expCtx.font = '9.5px Georgia, serif';
    expCtx.fillStyle = '#3b322f';
    expCtx.fillText('2026', plaqueX + 10 + titleWidth, plaqueY + 34);

    expCtx.font = '8px sans-serif';
    expCtx.fillStyle = '#6a605c';
    expCtx.fillText('Oil on Canvas', plaqueX + 10, plaqueY + 48);

    expCtx.font = '7.5px monospace';
    expCtx.fillStyle = '#8c3b28';
    
    // Wrap provenance line if needed
    if (expCtx.measureText(provText).width > plaqueW - 20) {
      const words = provText.split(' ');
      const mid = Math.ceil(words.length / 2);
      const line1 = words.slice(0, mid).join(' ');
      const line2 = words.slice(mid).join(' ');
      expCtx.fillText(line1, plaqueX + 10, plaqueY + 63);
      expCtx.fillText(line2, plaqueX + 10, plaqueY + 73);
    } else {
      expCtx.fillText(provText, plaqueX + 10, plaqueY + 66);
    }

    // Download
    const link = document.createElement('a');
    link.download = 'BYOR-Rothko-Gallery.png';
    link.href = expCanvas.toDataURL('image/png');
    link.click();
  }
}
