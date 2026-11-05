/**
 * manipulator.js - Robust direct manipulation for BYOR
 */

export class ShapeManipulator {
  constructor(canvasElement, onDragStateChange) {
    this.canvas = canvasElement;
    this.onDragStateChange = onDragStateChange || (() => {});

    this.enabled = false;
    this.shape = null;
    this.onChange = null;

    // Normalized coordinates [0..1]
    this.geometry = {
      x: 0.1,
      y: 0.2,
      width: 0.8,
      height: 0.4,
      gapRatio: 0.12
    };

    this.activeHandle = null;
    this.dragStartPointer = { x: 0, y: 0 };
    this.dragStartGeom = null;

    // Guide overlay canvas
    this.guideCanvas = document.createElement('canvas');
    this.guideCanvas.id = 'manipulator-guides';
    this.guideCanvas.style.position = 'absolute';
    this.guideCanvas.style.inset = '0';
    this.guideCanvas.style.pointerEvents = 'none';
    this.guideCanvas.style.zIndex = '40';
    this.guideCtx = this.guideCanvas.getContext('2d');

    this.handlePointerDown = this.onPointerDown.bind(this);
    this.handlePointerMove = this.onPointerMove.bind(this);
    this.handlePointerUp = this.onPointerUp.bind(this);

    if (this.canvas.parentElement) {
      this.canvas.parentElement.appendChild(this.guideCanvas);
    }
  }

  enable(shape, onChange) {
    this.enabled = true;
    this.shape = shape;
    this.onChange = onChange;

    const defW = shape.defW || 0.8;
    const defH = shape.defH || 0.38;

    this.geometry = {
      x: Math.max(0.04, (1.0 - defW) * 0.5),
      y: Math.max(0.04, (1.0 - defH) * 0.5),
      width: defW,
      height: defH,
      gapRatio: 0.12
    };

    this.syncGuideCanvasSize();

    this.canvas.addEventListener('pointerdown', this.handlePointerDown);
    window.addEventListener('pointermove', this.handlePointerMove);
    window.addEventListener('pointerup', this.handlePointerUp);

    this.drawGuides();
    if (this.onChange) this.onChange(this.getActiveGeometry());
  }

  disable() {
    this.enabled = false;
    this.activeHandle = null;
    this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
    window.removeEventListener('pointermove', this.handlePointerMove);
    window.removeEventListener('pointerup', this.handlePointerUp);
    this.onDragStateChange(false);
    this.clearGuides();
  }

  getActiveGeometry() {
    return { ...this.geometry };
  }

  syncGuideCanvasSize() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.guideCanvas.width = rect.width * dpr;
    this.guideCanvas.height = rect.height * dpr;
    this.guideCanvas.style.width = `${rect.width}px`;
    this.guideCanvas.style.height = `${rect.height}px`;
  }

  getHitHandle(px, py) {
    const rect = this.canvas.getBoundingClientRect();
    const nx = px / rect.width;
    const ny = py / rect.height;

    const g = this.geometry;
    const slackX = 18 / rect.width;
    const slackY = 18 / rect.height;

    // Corner handles
    if (Math.abs(nx - g.x) < slackX && Math.abs(ny - g.y) < slackY) return 'nw';
    if (Math.abs(nx - (g.x + g.width)) < slackX && Math.abs(ny - g.y) < slackY) return 'ne';
    if (Math.abs(nx - g.x) < slackX && Math.abs(ny - (g.y + g.height)) < slackY) return 'sw';
    if (Math.abs(nx - (g.x + g.width)) < slackX && Math.abs(ny - (g.y + g.height)) < slackY) return 'se';

    // Edge handles
    if (Math.abs(ny - g.y) < slackY && nx >= g.x && nx <= g.x + g.width) return 'n';
    if (Math.abs(ny - (g.y + g.height)) < slackY && nx >= g.x && nx <= g.x + g.width) return 's';
    if (Math.abs(nx - g.x) < slackX && ny >= g.y && ny <= g.y + g.height) return 'w';
    if (Math.abs(nx - (g.x + g.width)) < slackX && ny >= g.y && ny <= g.y + g.height) return 'e';

    // Inside body
    if (nx >= g.x && nx <= g.x + g.width && ny >= g.y && ny <= g.y + g.height) {
      return 'body';
    }

    return null;
  }

  onPointerDown(e) {
    if (!this.enabled) return;
    const rect = this.canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    const handle = this.getHitHandle(px, py);
    if (!handle) return;

    this.activeHandle = handle;
    this.dragStartPointer = { x: px / rect.width, y: py / rect.height };
    this.dragStartGeom = { ...this.geometry };

    this.onDragStateChange(true);
    this.drawGuides();
  }

  onPointerMove(e) {
    if (!this.enabled) return;
    const rect = this.canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const nx = px / rect.width;
    const ny = py / rect.height;

    if (!this.activeHandle) {
      const handle = this.getHitHandle(px, py);
      if (handle === 'body') this.canvas.style.cursor = 'move';
      else if (handle === 'n' || handle === 's') this.canvas.style.cursor = 'ns-resize';
      else if (handle === 'e' || handle === 'w') this.canvas.style.cursor = 'ew-resize';
      else if (handle === 'nw' || handle === 'se') this.canvas.style.cursor = 'nwse-resize';
      else if (handle === 'ne' || handle === 'sw') this.canvas.style.cursor = 'nesw-resize';
      else this.canvas.style.cursor = 'default';
      return;
    }

    const dx = nx - this.dragStartPointer.x;
    const dy = ny - this.dragStartPointer.y;
    const orig = this.dragStartGeom;
    const minSize = 0.05;

    if (this.activeHandle === 'body') {
      this.geometry.x = Math.max(0.01, Math.min(1.0 - orig.width - 0.01, orig.x + dx));
      this.geometry.y = Math.max(0.01, Math.min(1.0 - orig.height - 0.01, orig.y + dy));
    } else if (this.activeHandle === 'e') {
      this.geometry.width = Math.max(minSize, Math.min(1.0 - orig.x - 0.01, orig.width + dx));
    } else if (this.activeHandle === 'w') {
      const newW = Math.max(minSize, orig.width - dx);
      const newX = orig.x + (orig.width - newW);
      if (newX >= 0.01) {
        this.geometry.x = newX;
        this.geometry.width = newW;
      }
    } else if (this.activeHandle === 's') {
      this.geometry.height = Math.max(minSize, Math.min(1.0 - orig.y - 0.01, orig.height + dy));
    } else if (this.activeHandle === 'n') {
      const newH = Math.max(minSize, orig.height - dy);
      const newY = orig.y + (orig.height - newH);
      if (newY >= 0.01) {
        this.geometry.y = newY;
        this.geometry.height = newH;
      }
    } else if (this.activeHandle === 'se') {
      this.geometry.width = Math.max(minSize, Math.min(1.0 - orig.x - 0.01, orig.width + dx));
      this.geometry.height = Math.max(minSize, Math.min(1.0 - orig.y - 0.01, orig.height + dy));
    } else if (this.activeHandle === 'sw') {
      const newW = Math.max(minSize, orig.width - dx);
      const newX = orig.x + (orig.width - newW);
      if (newX >= 0.01) {
        this.geometry.x = newX;
        this.geometry.width = newW;
      }
      this.geometry.height = Math.max(minSize, Math.min(1.0 - orig.y - 0.01, orig.height + dy));
    } else if (this.activeHandle === 'ne') {
      this.geometry.width = Math.max(minSize, Math.min(1.0 - orig.x - 0.01, orig.width + dx));
      const newH = Math.max(minSize, orig.height - dy);
      const newY = orig.y + (orig.height - newH);
      if (newY >= 0.01) {
        this.geometry.y = newY;
        this.geometry.height = newH;
      }
    } else if (this.activeHandle === 'nw') {
      const newW = Math.max(minSize, orig.width - dx);
      const newX = orig.x + (orig.width - newW);
      const newH = Math.max(minSize, orig.height - dy);
      const newY = orig.y + (orig.height - newH);
      if (newX >= 0.01 && newY >= 0.01) {
        this.geometry.x = newX;
        this.geometry.width = newW;
        this.geometry.y = newY;
        this.geometry.height = newH;
      }
    }

    this.drawGuides();
    if (this.onChange) this.onChange(this.getActiveGeometry());
  }

  onPointerUp() {
    if (!this.enabled || !this.activeHandle) return;
    this.activeHandle = null;
    this.canvas.style.cursor = 'default';
    this.onDragStateChange(false);
    this.drawGuides();
  }

  drawGuides() {
    if (!this.enabled) return;
    this.syncGuideCanvasSize();

    const ctx = this.guideCtx;
    const w = this.guideCanvas.width;
    const h = this.guideCanvas.height;
    ctx.clearRect(0, 0, w, h);

    const g = this.geometry;
    const gx = g.x * w;
    const gy = g.y * h;
    const gw = g.width * w;
    const gh = g.height * h;

    ctx.save();

    // Bounding Box
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(gx, gy, gw, gh);
    ctx.setLineDash([]);

    // Corner Handles
    const handleSize = 9;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#222222';
    ctx.lineWidth = 1.5;

    const points = [
      { x: gx, y: gy },
      { x: gx + gw, y: gy },
      { x: gx, y: gy + gh },
      { x: gx + gw, y: gy + gh },
      { x: gx + gw * 0.5, y: gy },
      { x: gx + gw * 0.5, y: gy + gh },
      { x: gx, y: gy + gh * 0.5 },
      { x: gx + gw, y: gy + gh * 0.5 }
    ];

    points.forEach((p, idx) => {
      if (idx < 4) {
        ctx.fillRect(p.x - handleSize * 0.5, p.y - handleSize * 0.5, handleSize, handleSize);
        ctx.strokeRect(p.x - handleSize * 0.5, p.y - handleSize * 0.5, handleSize, handleSize);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    });

    ctx.restore();
  }

  clearGuides() {
    this.guideCtx.clearRect(0, 0, this.guideCanvas.width, this.guideCanvas.height);
  }
}
