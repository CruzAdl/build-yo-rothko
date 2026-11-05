/**
 * main.js - Simplified State Machine & UI Wireup with Dual Draggable/Collapsible Floating Clusters
 */

import {
  CANVAS_PROPORTIONS,
  GROUND_STAINS,
  PIGMENTS,
  SHAPES,
  TEXTURES,
  EDGES,
  WALL_ARCHITECTURES,
  computeRothkoHalo
} from './palette.js';

import { RothkoRenderer } from './renderer.js';
import { ShapeManipulator } from './manipulator.js';
import { GalleryLightRoom } from './lightroom.js';

export const APP_STATE = {
  GROUND_SETUP: 'GROUND_SETUP',
  STAGING: 'STAGING',
  BAKED: 'BAKED',
  LIGHT_ROOM: 'LIGHT_ROOM'
};

class BYORApp {
  constructor() {
    this.currentState = APP_STATE.GROUND_SETUP;

    this.bakedShapesCount = 0;
    this.destroyedCanvasesCount = 0;
    this.hasUncommittedShape = false;
    this.groundLocked = false;

    this.currentProportion = CANVAS_PROPORTIONS.vertical;
    this.currentGround = GROUND_STAINS[0]; // Raw Linen Canvas

    this.stagingConfig = {
      shape: SHAPES[0],
      pigment: PIGMENTS[0],
      texture: TEXTURES[0],
      edge: EDGES[0],
      bleedPercent: 50
    };

    this.customPigments = [];
    this.pickerH = 357;
    this.pickerS = 84;
    this.pickerL = 32;

    this.renderer = null;
    this.manipulator = null;
    this.lightroom = null;

    this.dom = {};
  }

  init() {
    this.cacheDom();
    this.updateViewportCanvasSize();
    this.initEngines();
    this.buildUI();
    this.bindEvents();
    this.initDraggableTopCluster();
    this.initDraggableSecondaryInspector();
    this.applyState(APP_STATE.GROUND_SETUP);

    window.addEventListener('resize', () => {
      this.updateViewportCanvasSize();
      if (this.renderer) this.renderer.handleResize();
      if (this.currentState === APP_STATE.LIGHT_ROOM && this.lightroom) {
        this.lightroom.resizeGalleryStage();
        this.lightroom.render();
      }
    });

    // Keyboard shortcuts
    window.addEventListener('keydown', (e) => {
      if (e.target && e.target.isContentEditable) return;
      if (this.currentState === APP_STATE.LIGHT_ROOM) return;

      if (e.key === 'Enter') {
        if (this.currentState === APP_STATE.STAGING || this.hasUncommittedShape) {
          e.preventDefault();
          this.bakeCurrentStagedShape();
        }
      } else if (e.key === 'Escape') {
        if (this.currentState === APP_STATE.STAGING) {
          e.preventDefault();
          this.toggleStagingInspectorCollapse();
        }
      } else if (e.key === '-' || e.key === '_' || e.key === 'Backspace') {
        if (this.hasUncommittedShape) {
          e.preventDefault();
          this.removeLastShape();
        }
      }
    });
  }

  cacheDom() {
    this.dom.stage = document.getElementById('studio-stage');
    this.dom.viewportFrame = document.getElementById('canvas-viewport-frame');
    this.dom.canvas = document.getElementById('studio-canvas');
    this.dom.hudOverlay = document.getElementById('hud-overlay');

    // Top 6-Dot Cluster Pill
    this.dom.topPill = document.getElementById('top-pill');
    this.dom.pillDragGrip = document.getElementById('pill-drag-grip');
    this.dom.groundSetupControls = document.getElementById('ground-setup-controls');
    this.dom.proportionButtons = document.getElementById('proportion-buttons');
    this.dom.groundSwatches = document.getElementById('ground-swatches');
    this.dom.studioStatusBar = document.getElementById('studio-status-bar');
    this.dom.bakedCountDisplay = document.getElementById('baked-count-display');
    this.dom.btnRemoveLastShape = document.getElementById('btn-remove-last-shape');
    this.dom.btnScrapeCanvas = document.getElementById('btn-scrape-canvas');
    this.dom.btnWorkIsDone = document.getElementById('btn-work-is-done');

    // Bottom Dock & Secondary Staging Inspector
    this.dom.bottomDock = document.getElementById('bottom-dock');
    this.dom.btnOpenStaging = document.getElementById('btn-open-staging');
    this.dom.stagingInspector = document.getElementById('staging-inspector');
    this.dom.stagingDragGrip = document.getElementById('staging-drag-grip');
    this.dom.shapeStrip = document.getElementById('shape-strip');
    this.dom.pigmentStrip = document.getElementById('pigment-strip');
    this.dom.btnOpenPicker = document.getElementById('btn-open-picker');
    this.dom.colorPickerPopover = document.getElementById('color-picker-popover');
    this.dom.btnClosePicker = document.getElementById('btn-close-picker');
    this.dom.pickerPreviewCore = document.getElementById('picker-preview-core');
    this.dom.pickerPreviewHalo = document.getElementById('picker-preview-halo');
    this.dom.pickerPreviewHex = document.getElementById('picker-preview-hex');
    this.dom.pickerPreviewHaloHex = document.getElementById('picker-preview-halo-hex');
    this.dom.pickerHue = document.getElementById('picker-hue');
    this.dom.pickerSat = document.getElementById('picker-sat');
    this.dom.pickerLight = document.getElementById('picker-light');
    this.dom.pickerHexInput = document.getElementById('picker-hex-input');
    this.dom.btnEyedropper = document.getElementById('btn-eyedropper');
    this.dom.nativeColorInput = document.getElementById('native-color-input');
    this.dom.btnApplyColor = document.getElementById('btn-apply-color');
    this.dom.textureStrip = document.getElementById('texture-strip');
    this.dom.edgeStrip = document.getElementById('edge-strip');
    this.dom.sliderBleed = document.getElementById('slider-bleed');
    this.dom.btnBakeShape = document.getElementById('btn-bake-shape');

    // Gallery Room
    this.dom.galleryRoom = document.getElementById('gallery-room');
    this.dom.galleryCanvas = document.getElementById('gallery-canvas');
    this.dom.plaqueProvenanceText = document.getElementById('plaque-provenance-text');
    this.dom.wallSelect = document.getElementById('wall-select');
    this.dom.sliderLightInt = document.getElementById('slider-light-int');
    this.dom.sliderLightKelvin = document.getElementById('slider-light-kelvin');
    this.dom.btnTakePhoto = document.getElementById('btn-take-photo');
    this.dom.btnReturnStudio = document.getElementById('btn-return-studio');
  }

  /**
   * Smooth pointer drag + Click-to-Toggle Collapsing on Top 6-dot grip
   */
  initDraggableTopCluster() {
    const pill = this.dom.topPill;
    const grip = this.dom.pillDragGrip;

    let isPointerDown = false;
    let hasMoved = false;
    let startX = 0;
    let startY = 0;
    let initialLeft = 0;
    let initialTop = 0;

    const onPointerDown = (e) => {
      if (e.target.closest('button') || e.target.closest('.pill-swatch')) return;

      isPointerDown = true;
      hasMoved = false;

      const rect = pill.getBoundingClientRect();
      pill.style.transform = 'none';
      pill.style.left = `${rect.left}px`;
      pill.style.top = `${rect.top}px`;

      startX = e.clientX;
      startY = e.clientY;
      initialLeft = rect.left;
      initialTop = rect.top;

      grip.setPointerCapture(e.pointerId);
      e.preventDefault();
    };

    const onPointerMove = (e) => {
      if (!isPointerDown) return;

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        hasMoved = true;
        pill.classList.add('is-repositioning');
      }

      if (hasMoved) {
        const rect = pill.getBoundingClientRect();
        const maxX = window.innerWidth - rect.width - 12;
        const maxY = window.innerHeight - rect.height - 12;

        const nextX = Math.max(12, Math.min(maxX, initialLeft + dx));
        const nextY = Math.max(12, Math.min(maxY, initialTop + dy));

        pill.style.left = `${nextX}px`;
        pill.style.top = `${nextY}px`;
      }
    };

    const onPointerUp = (e) => {
      if (!isPointerDown) return;
      isPointerDown = false;
      pill.classList.remove('is-repositioning');

      try {
        grip.releasePointerCapture(e.pointerId);
      } catch (err) {}

      if (!hasMoved) {
        pill.classList.toggle('is-collapsed');
      }
    };

    grip.addEventListener('pointerdown', onPointerDown);
    pill.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  }

  /**
   * Smooth pointer drag + Click-to-Toggle Collapsing on Secondary Staging Inspector
   */
  initDraggableSecondaryInspector() {
    const inspector = this.dom.stagingInspector;
    const grip = this.dom.stagingDragGrip;

    let isPointerDown = false;
    let hasMoved = false;
    let startX = 0;
    let startY = 0;
    let initialLeft = 0;
    let initialTop = 0;

    const onPointerDown = (e) => {
      if (e.target.closest('button') || e.target.closest('.pigment-circle') || e.target.closest('input[type="range"]')) return;

      isPointerDown = true;
      hasMoved = false;

      const rect = inspector.getBoundingClientRect();
      inspector.style.bottom = 'auto';
      inspector.style.transform = 'none';
      inspector.style.left = `${rect.left}px`;
      inspector.style.top = `${rect.top}px`;

      startX = e.clientX;
      startY = e.clientY;
      initialLeft = rect.left;
      initialTop = rect.top;

      grip.setPointerCapture(e.pointerId);
      e.preventDefault();
    };

    const onPointerMove = (e) => {
      if (!isPointerDown) return;

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        hasMoved = true;
        inspector.classList.add('is-repositioning');
      }

      if (hasMoved) {
        const rect = inspector.getBoundingClientRect();
        const maxX = window.innerWidth - rect.width - 12;
        const maxY = window.innerHeight - rect.height - 12;

        const nextX = Math.max(12, Math.min(maxX, initialLeft + dx));
        const nextY = Math.max(12, Math.min(maxY, initialTop + dy));

        inspector.style.left = `${nextX}px`;
        inspector.style.top = `${nextY}px`;
      }
    };

    const onPointerUp = (e) => {
      if (!isPointerDown) return;
      isPointerDown = false;
      inspector.classList.remove('is-repositioning');

      try {
        grip.releasePointerCapture(e.pointerId);
      } catch (err) {}

      if (!hasMoved) {
        this.toggleStagingInspectorCollapse();
      }
    };

    grip.addEventListener('pointerdown', onPointerDown);
    inspector.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  }

  toggleStagingInspectorCollapse() {
    const inspector = this.dom.stagingInspector;
    inspector.classList.toggle('is-collapsed');

    // Keep inspector strictly visible; only toggle between disc (collapsed) and full bar (expanded)
    inspector.style.display = 'flex';
    this.dom.btnOpenStaging.style.display = 'none';

    if (inspector.classList.contains('is-collapsed')) {
      this.manipulator.disable();
    } else {
      this.manipulator.enable(this.stagingConfig.shape, (newGeom) => {
        this.renderer.setStagedShape(this.stagingConfig, newGeom);
      });
      this.renderer.setStagedShape(this.stagingConfig, this.manipulator.getActiveGeometry());
    }
  }

  initEngines() {
    this.renderer = new RothkoRenderer(this.dom.canvas);
    this.manipulator = new ShapeManipulator(this.dom.canvas, (isDragging) => {
      this.setDraggingState(isDragging);
    });
    this.lightroom = new GalleryLightRoom(this.dom.galleryCanvas);

    this.renderer.setGroundStain(this.currentGround);
  }

  updateViewportCanvasSize() {
    const availW = window.innerWidth - 80;
    const availH = window.innerHeight - 80;
    const ratio = this.currentProportion.aspectRatio;

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

    this.dom.viewportFrame.style.width = `${finalW}px`;
    this.dom.viewportFrame.style.height = `${finalH}px`;

    const dpr = window.devicePixelRatio || 1;
    this.dom.canvas.width = finalW * dpr;
    this.dom.canvas.height = finalH * dpr;

    if (this.renderer) {
      this.renderer.handleResize();
    }
  }

  buildUI() {
    // 1. Proportions
    this.dom.proportionButtons.innerHTML = '';
    Object.values(CANVAS_PROPORTIONS).forEach(prop => {
      const btn = document.createElement('button');
      btn.className = `pill-btn ${prop.id === this.currentProportion.id ? 'active' : ''}`;
      btn.textContent = prop.label;
      btn.title = prop.description;
      btn.onclick = () => {
        if (this.groundLocked || this.bakedShapesCount > 0) return;
        this.currentProportion = prop;
        document.querySelectorAll('#proportion-buttons .pill-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.updateViewportCanvasSize();
        this.renderer.setCanvasProportion(prop);
      };
      this.dom.proportionButtons.appendChild(btn);
    });

    // 2. Base Canvas Swatches
    this.dom.groundSwatches.innerHTML = '';
    GROUND_STAINS.forEach(stain => {
      const s = document.createElement('div');
      s.className = `pill-swatch ${stain.id === this.currentGround.id ? 'active' : ''}`;
      s.style.backgroundColor = stain.hex;
      s.title = stain.name;
      s.onclick = () => {
        if (this.groundLocked || this.bakedShapesCount > 0) return;
        this.currentGround = stain;
        document.querySelectorAll('#ground-swatches .pill-swatch').forEach(el => el.classList.remove('active'));
        s.classList.add('active');
        this.renderer.setGroundStain(stain);
      };
      this.dom.groundSwatches.appendChild(s);
    });

    // 3. Shapes
    this.buildButtonGroup(this.dom.shapeStrip, SHAPES, 'shape', (item) => {
      this.manipulator.enable(item, (newGeom) => {
        this.renderer.setStagedShape(this.stagingConfig, newGeom);
      });
    });

    // 4. Pigment Swatches & Color Picker
    this.renderPigmentSwatches();
    this.initColorPicker();

    // 5. Textures
    this.buildButtonGroup(this.dom.textureStrip, TEXTURES, 'texture');

    // 6. Edges
    this.buildButtonGroup(this.dom.edgeStrip, EDGES, 'edge');

    // 7. Light Room Wall Select
    this.dom.wallSelect.innerHTML = '';
    WALL_ARCHITECTURES.forEach(wall => {
      const opt = document.createElement('option');
      opt.value = wall.id;
      opt.textContent = wall.name;
      this.dom.wallSelect.appendChild(opt);
    });
  }

  buildButtonGroup(container, items, configKey, onSelectExtra) {
    container.innerHTML = '';
    items.forEach(item => {
      const btn = document.createElement('button');
      btn.className = `item-btn ${item.id === this.stagingConfig[configKey].id ? 'active' : ''}`;
      btn.textContent = item.name;
      btn.onclick = () => {
        this.stagingConfig[configKey] = item;
        container.querySelectorAll('.item-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (onSelectExtra) onSelectExtra(item);
        this.onStagingConfigChanged();
      };
      container.appendChild(btn);
    });
  }

  renderPigmentSwatches() {
    this.dom.pigmentStrip.innerHTML = '';
    const allPigments = [...this.customPigments, ...PIGMENTS];
    allPigments.forEach(pigment => {
      const circle = document.createElement('div');
      const isSelected = pigment.hex.toLowerCase() === this.stagingConfig.pigment.hex.toLowerCase();
      circle.className = `pigment-circle ${isSelected ? 'active' : ''} ${pigment.isCustom ? 'custom-swatch' : ''}`;
      circle.style.backgroundColor = pigment.hex;
      circle.title = pigment.isCustom ? `${pigment.name} (Custom Mix)` : pigment.name;
      circle.onclick = () => {
        this.stagingConfig.pigment = pigment;
        document.querySelectorAll('#pigment-strip .pigment-circle').forEach(c => c.classList.remove('active'));
        circle.classList.add('active');
        this.onStagingConfigChanged();
      };
      this.dom.pigmentStrip.appendChild(circle);
    });
  }

  initColorPicker() {
    if (!this.dom.btnOpenPicker) return;

    // Toggle popover
    this.dom.btnOpenPicker.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleColorPickerPopover();
    });

    this.dom.btnClosePicker.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleColorPickerPopover(false);
    });

    // Close when clicking outside
    window.addEventListener('pointerdown', (e) => {
      if (
        this.dom.colorPickerPopover.style.display !== 'none' &&
        !this.dom.colorPickerPopover.contains(e.target) &&
        !this.dom.btnOpenPicker.contains(e.target) &&
        !e.target.closest('.picker-native-label')
      ) {
        this.toggleColorPickerPopover(false);
      }
    });

    // Sliders
    const onSliderInput = () => {
      this.pickerH = parseInt(this.dom.pickerHue.value, 10);
      this.pickerS = parseInt(this.dom.pickerSat.value, 10);
      this.pickerL = parseInt(this.dom.pickerLight.value, 10);
      this.updatePickerUIFromHsl(true);
    };

    this.dom.pickerHue.addEventListener('input', onSliderInput);
    this.dom.pickerSat.addEventListener('input', onSliderInput);
    this.dom.pickerLight.addEventListener('input', onSliderInput);

    // Direct Hex text entry
    this.dom.pickerHexInput.addEventListener('input', (e) => {
      const cleanHex = e.target.value.replace(/[^0-9A-Fa-f]/g, '');
      if (cleanHex.length === 6) {
        this.syncPickerToHex('#' + cleanHex);
        this.updatePickerUIFromHsl(true);
      }
    });

    // Native Color Input
    this.dom.nativeColorInput.addEventListener('input', (e) => {
      this.syncPickerToHex(e.target.value);
      this.updatePickerUIFromHsl(true);
    });

    // Eyedropper API
    if (window.EyeDropper) {
      this.dom.btnEyedropper.addEventListener('click', async () => {
        try {
          const eyeDropper = new window.EyeDropper();
          const result = await eyeDropper.open();
          if (result && result.sRGBHex) {
            this.syncPickerToHex(result.sRGBHex);
            this.updatePickerUIFromHsl(true);
          }
        } catch (err) {}
      });
    } else {
      this.dom.btnEyedropper.style.opacity = '0.35';
      this.dom.btnEyedropper.title = 'Eyedropper not supported in this browser';
    }

    // Apply Tint Button
    this.dom.btnApplyColor.addEventListener('click', () => {
      const hex = this.hslToHex(this.pickerH, this.pickerS, this.pickerL);
      const halo = computeRothkoHalo(hex);
      const customPigment = {
        name: `Custom ${hex.toUpperCase()}`,
        hex,
        halo,
        isCustom: true
      };

      const exists = this.customPigments.some(p => p.hex.toLowerCase() === hex.toLowerCase());
      if (!exists) {
        this.customPigments.unshift(customPigment);
      }

      this.stagingConfig.pigment = customPigment;
      this.renderPigmentSwatches();
      this.onStagingConfigChanged();
      this.toggleColorPickerPopover(false);
    });
  }

  toggleColorPickerPopover(forceOpen) {
    const popover = this.dom.colorPickerPopover;
    const isCurrentlyOpen = popover.style.display !== 'none';
    const shouldOpen = forceOpen !== undefined ? forceOpen : !isCurrentlyOpen;

    if (shouldOpen) {
      const inspectorRect = this.dom.stagingInspector.getBoundingClientRect();
      const popoverWidth = 320;
      const popoverHeight = 310;

      let left = inspectorRect.left + (inspectorRect.width - popoverWidth) / 2;
      left = Math.max(12, Math.min(window.innerWidth - popoverWidth - 12, left));

      let top = inspectorRect.top - popoverHeight - 14;
      if (top < 12) {
        top = inspectorRect.bottom + 14;
      }

      popover.style.left = `${left}px`;
      popover.style.top = `${top}px`;
      popover.style.bottom = 'auto';
      popover.style.transform = 'none';
      popover.style.display = 'block';

      this.dom.btnOpenPicker.classList.add('active');

      if (this.stagingConfig.pigment && this.stagingConfig.pigment.hex) {
        this.syncPickerToHex(this.stagingConfig.pigment.hex);
        this.updatePickerUIFromHsl(false);
      }
    } else {
      popover.style.display = 'none';
      this.dom.btnOpenPicker.classList.remove('active');
    }
  }

  syncPickerToHex(hex) {
    const hsl = this.hexToHsl(hex);
    this.pickerH = hsl.h;
    this.pickerS = hsl.s;
    this.pickerL = hsl.l;

    this.dom.pickerHue.value = hsl.h;
    this.dom.pickerSat.value = hsl.s;
    this.dom.pickerLight.value = hsl.l;
  }

  updatePickerUIFromHsl(liveAudition = true) {
    const hex = this.hslToHex(this.pickerH, this.pickerS, this.pickerL);
    const halo = computeRothkoHalo(hex);

    this.dom.pickerPreviewCore.style.backgroundColor = hex;
    this.dom.pickerPreviewHalo.style.backgroundColor = halo;
    this.dom.pickerPreviewHex.textContent = hex.toUpperCase();
    this.dom.pickerPreviewHaloHex.textContent = halo.toUpperCase();
    this.dom.pickerHexInput.value = hex.replace('#', '').toUpperCase();
    this.dom.nativeColorInput.value = hex;

    const fullHueColor = this.hslToHex(this.pickerH, 100, 50);
    this.dom.pickerSat.style.background = `linear-gradient(to right, #666, ${fullHueColor})`;
    this.dom.pickerLight.style.background = `linear-gradient(to right, #000, ${fullHueColor}, #fff)`;

    if (liveAudition && this.currentState === APP_STATE.STAGING) {
      this.stagingConfig.pigment = {
        name: `Audition ${hex.toUpperCase()}`,
        hex,
        halo,
        isCustom: true
      };
      this.onStagingConfigChanged();
    }
  }

  hslToHex(h, s, l) {
    h /= 360; s /= 100; l /= 100;
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const r = Math.round(hue2rgb(p, q, h + 1/3) * 255);
    const g = Math.round(hue2rgb(p, q, h) * 255);
    const b = Math.round(hue2rgb(p, q, h - 1/3) * 255);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  hexToHsl(hex) {
    let c = hex.replace('#', '').trim();
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    const num = parseInt(c, 16);
    if (isNaN(num)) return { h: 357, s: 84, l: 32 };
    const r = ((num >> 16) & 255) / 255;
    const g = ((num >> 8) & 255) / 255;
    const b = (num & 255) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  }

  bindEvents() {
    this.dom.btnOpenStaging.addEventListener('click', () => {
      if (this.hasUncommittedShape) {
        this.renderer.bakeStagedShape();
        this.bakedShapesCount++;
        this.hasUncommittedShape = false;
      }
      this.groundLocked = true;
      this.applyState(APP_STATE.STAGING);
    });

    this.dom.sliderBleed.addEventListener('input', (e) => {
      this.stagingConfig.bleedPercent = parseInt(e.target.value, 10);
      this.onStagingConfigChanged();
    });

    // Remove Last Shape inside top 6-dot cluster
    this.dom.btnRemoveLastShape.addEventListener('click', () => {
      this.removeLastShape();
    });

    this.dom.btnBakeShape.addEventListener('click', () => {
      this.bakeCurrentStagedShape();
    });

    this.dom.btnScrapeCanvas.addEventListener('click', () => {
      this.scrapeCanvas();
    });

    this.dom.btnWorkIsDone.addEventListener('click', () => {
      this.enterLightRoom();
    });

    this.dom.wallSelect.addEventListener('change', (e) => {
      const wall = WALL_ARCHITECTURES.find(w => w.id === e.target.value);
      if (wall) {
        this.dom.galleryRoom.style.backgroundColor = wall.wallColor;
        this.lightroom.setWallArchitecture(wall);
      }
    });

    const updateLight = () => {
      const int = parseInt(this.dom.sliderLightInt.value, 10) / 100;
      const kelvin = parseInt(this.dom.sliderLightKelvin.value, 10);
      this.lightroom.setLighting(int, kelvin);
    };

    this.dom.sliderLightInt.addEventListener('input', updateLight);
    this.dom.sliderLightKelvin.addEventListener('input', updateLight);

    this.dom.btnTakePhoto.addEventListener('click', () => {
      this.lightroom.capturePhotograph();
    });

    this.dom.btnReturnStudio.addEventListener('click', () => {
      this.lightroom.exit();
      this.applyState(APP_STATE.BAKED);
    });
  }

  /**
   * Removes uncommitted shape from canvas
   */
  removeLastShape() {
    if (!this.hasUncommittedShape) return;
    this.hasUncommittedShape = false;
    this.manipulator.disable();
    this.renderer.setStagedShape(null, null);
    this.groundLocked = true;
    this.dom.stagingInspector.classList.remove('is-collapsed');
    this.applyState(APP_STATE.BAKED);
  }

  onStagingConfigChanged() {
    if (this.currentState !== APP_STATE.STAGING) return;
    const geom = this.manipulator.getActiveGeometry();
    this.renderer.setStagedShape(this.stagingConfig, geom);
  }

  bakeCurrentStagedShape() {
    if (!this.hasUncommittedShape) return;
    this.renderer.bakeStagedShape();
    this.manipulator.disable();
    this.hasUncommittedShape = false;
    this.groundLocked = true;
    this.bakedShapesCount++;
    this.dom.stagingInspector.classList.remove('is-collapsed');
    this.applyState(APP_STATE.BAKED);
  }

  async scrapeCanvas() {
    if (this.bakedShapesCount >= 1 || this.hasUncommittedShape) {
      this.destroyedCanvasesCount++;
      await this.renderer.playSolventWashTransition();
    }
    this.bakedShapesCount = 0;
    this.hasUncommittedShape = false;
    this.groundLocked = false;
    this.manipulator.disable();
    this.dom.stagingInspector.classList.remove('is-collapsed');
    this.renderer.clearCanvas();
    this.renderer.setGroundStain(this.currentGround);
    this.applyState(APP_STATE.GROUND_SETUP);
  }

  enterLightRoom() {
    if (this.hasUncommittedShape) {
      this.renderer.bakeStagedShape();
      this.manipulator.disable();
      this.hasUncommittedShape = false;
      this.bakedShapesCount++;
    }

    this.dom.stagingInspector.classList.remove('is-collapsed');
    this.applyState(APP_STATE.LIGHT_ROOM);

    let provText = '';
    if (this.destroyedCanvasesCount === 0) {
      provText = 'First state — executed without prior scraped studies';
    } else if (this.destroyedCanvasesCount === 1) {
      provText = 'Final state following 1 destroyed study';
    } else {
      provText = `Final state following ${this.destroyedCanvasesCount} destroyed studies`;
    }
    this.dom.plaqueProvenanceText.textContent = provText;

    const canvasBuffer = this.renderer.getBakedBufferCanvas();
    const heightBuffer = this.renderer.getBakedHeightBuffer();
    this.lightroom.enter(canvasBuffer, heightBuffer, {
      destroyedCount: this.destroyedCanvasesCount,
      bakedCount: this.bakedShapesCount
    });
  }

  applyState(nextState) {
    this.currentState = nextState;

    // Top 6-Dot Cluster: lock to status bar once staging starts or Escape is hit
    if (nextState === APP_STATE.GROUND_SETUP && !this.groundLocked) {
      this.dom.groundSetupControls.style.display = 'flex';
      this.dom.studioStatusBar.style.display = 'none';
    } else {
      this.dom.groundSetupControls.style.display = 'none';
      this.dom.studioStatusBar.style.display = 'flex';
      this.dom.bakedCountDisplay.textContent = this.bakedShapesCount + (this.hasUncommittedShape ? 1 : 0);
      this.dom.btnRemoveLastShape.style.display = this.hasUncommittedShape ? 'inline-block' : 'none';
    }

    // Bottom Dock / Staging Inspector
    if (nextState === APP_STATE.STAGING) {
      this.dom.btnOpenStaging.style.display = 'none';
      this.dom.stagingInspector.classList.remove('is-collapsed');
      this.dom.stagingInspector.style.display = 'flex';

      this.hasUncommittedShape = true;
      this.dom.bakedCountDisplay.textContent = this.bakedShapesCount + 1;
      this.dom.btnRemoveLastShape.style.display = 'inline-block';

      this.manipulator.enable(this.stagingConfig.shape, (newGeom) => {
        this.renderer.setStagedShape(this.stagingConfig, newGeom);
      });
      const initialGeom = this.manipulator.getActiveGeometry();
      this.renderer.setStagedShape(this.stagingConfig, initialGeom);
    } else {
      this.dom.btnOpenStaging.style.display = 'flex';
      this.dom.stagingInspector.style.display = 'none';
      this.dom.stagingInspector.classList.remove('is-collapsed');
    }

    if (nextState === APP_STATE.LIGHT_ROOM) {
      this.dom.stage.style.display = 'none';
      this.dom.hudOverlay.style.display = 'none';
      this.dom.galleryRoom.style.display = 'flex';
    } else {
      this.dom.stage.style.display = 'flex';
      this.dom.hudOverlay.style.display = 'block';
      this.dom.galleryRoom.style.display = 'none';
    }
  }

  setDraggingState(isDragging) {
    if (isDragging) {
      this.dom.hudOverlay.classList.add('is-dragging');
    } else {
      this.dom.hudOverlay.classList.remove('is-dragging');
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const app = new BYORApp();
  app.init();
  window.__BYOR_APP__ = app;
});
