/**
 * palette.js - Simplified Rothko palette & definitions for BYOR
 */

export const CANVAS_PROPORTIONS = {
  vertical: {
    id: 'vertical',
    label: 'Vertical',
    ratioText: '3:4',
    aspectRatio: 3 / 4,
    description: 'Classic Rothko vertical scale'
  },
  horizontal: {
    id: 'horizontal',
    label: 'Horizontal',
    ratioText: '4:3',
    aspectRatio: 4 / 3,
    description: 'Wide mural canvas'
  },
  tall: {
    id: 'tall',
    label: 'Tall',
    ratioText: '2:3',
    aspectRatio: 2 / 3,
    description: 'Chapel altar vertical'
  },
  square: {
    id: 'square',
    label: 'Square',
    ratioText: '1:1',
    aspectRatio: 1 / 1,
    description: 'Equal square study'
  }
};

// Canvas Grounds (Default is raw canvas unbleached linen)
export const GROUND_STAINS = [
  {
    id: 'raw_canvas',
    name: 'Raw Linen Canvas',
    hex: '#e5dccb',
    isRaw: true,
    description: 'Natural unbleached woven cotton/linen canvas'
  },
  {
    id: 'stain_warm_sand',
    name: 'Gesso Primer',
    hex: '#f0ece1',
    isRaw: true,
    description: 'Off-white chalk gesso primer ground'
  },
  {
    id: 'stain_crimson',
    name: 'Crimson Wash Ground',
    hex: '#5c191d',
    isRaw: false,
    description: 'Turpentine-tinted maroon ground'
  },
  {
    id: 'stain_umber',
    name: 'Raw Umber Ground',
    hex: '#331f18',
    isRaw: false,
    description: 'Dark earthy umber ground'
  },
  {
    id: 'stain_ochre',
    name: 'Burnt Ochre Ground',
    hex: '#78331d',
    isRaw: false,
    description: 'Warm ferrous iron ground'
  },
  {
    id: 'stain_terracotta',
    name: 'Terracotta Ground',
    hex: '#632f1f',
    isRaw: false,
    description: 'Rich baked clay earthen wash'
  },
  {
    id: 'stain_indigo',
    name: 'Midnight Indigo Wash',
    hex: '#181f33',
    isRaw: false,
    description: 'Deep nocturnal blue-black ground'
  },
  {
    id: 'stain_slate',
    name: 'Dark Slate Ground',
    hex: '#212024',
    isRaw: false,
    description: 'Austere late-period charcoal-black primer'
  }
];

export const PIGMENTS = [
  // --- Reds & Maroons (Seagram Murals & Houston Chapel) ---
  { name: 'Crimson Red', hex: '#8c161c', halo: '#b83b28', family: 'red' },
  { name: 'Venetian Red', hex: '#a63328', halo: '#d4563b', family: 'red' },
  { name: 'Alizarin Crimson', hex: '#9e1830', halo: '#c72e48', family: 'red' },
  { name: 'Carmine Lake', hex: '#b51936', halo: '#e03857', family: 'red' },
  { name: 'Deep Maroon', hex: '#480e18', halo: '#781d2c', family: 'red' },
  { name: 'Claret Wine', hex: '#581726', halo: '#82263a', family: 'red' },
  { name: 'Scarlet Vermilion', hex: '#cc2d1b', halo: '#eb523d', family: 'red' },

  // --- Oranges, Yellows & Ochres (Luminous 1950s) ---
  { name: 'Cinnabar Orange', hex: '#cf4b2b', halo: '#e8744b', family: 'orange' },
  { name: 'Burnt Ochre', hex: '#ba5222', halo: '#e07e36', family: 'orange' },
  { name: 'Raw Sienna', hex: '#bf6b24', halo: '#df8940', family: 'yellow' },
  { name: 'Deep Cadmium', hex: '#d99818', halo: '#f2bd38', family: 'yellow' },
  { name: 'Cadmium Yellow Pale', hex: '#edd03b', halo: '#f7e36f', family: 'yellow' },
  { name: 'Naples Yellow', hex: '#ebcc75', halo: '#f7df9c', family: 'yellow' },
  { name: 'Indian Yellow', hex: '#e38814', halo: '#fca835', family: 'yellow' },
  { name: 'Terracotta', hex: '#9e6d5a', halo: '#c28c78', family: 'orange' },

  // --- Purples, Violets & Aubergines (Meditative Suites) ---
  { name: 'Plum Aubergine', hex: '#3d1a2b', halo: '#692a4a', family: 'violet' },
  { name: 'Imperial Violet', hex: '#4a1740', halo: '#762b69', family: 'violet' },
  { name: 'Tyrian Mulberry', hex: '#5c193c', halo: '#882b5c', family: 'violet' },
  { name: 'Muted Mauve', hex: '#734761', halo: '#966382', family: 'violet' },
  { name: 'Cobalt Violet', hex: '#3b284f', halo: '#5f437c', family: 'violet' },
  { name: 'Deep Amethyst', hex: '#2b1b36', halo: '#4c325e', family: 'violet' },

  // --- Blues & Greens (No. 61 & Harvard Murals) ---
  { name: 'Ultramarine Noir', hex: '#161c36', halo: '#2d3766', family: 'blue' },
  { name: 'Cobalt Deep', hex: '#1b2f57', halo: '#32508a', family: 'blue' },
  { name: 'Prussian Indigo', hex: '#122238', halo: '#233f63', family: 'blue' },
  { name: 'Midnight Cerulean', hex: '#183347', halo: '#285373', family: 'blue' },
  { name: 'Terre Verte', hex: '#364739', halo: '#526956', family: 'green' },
  { name: 'Deep Viridian', hex: '#153328', halo: '#245242', family: 'green' },

  // --- Umbers, Blacks, Grays & Whites (Late Dark Period) ---
  { name: 'Raw Umber', hex: '#3d251c', halo: '#5c3a2c', family: 'earth' },
  { name: 'Burnt Umber', hex: '#2b1912', halo: '#472a20', family: 'earth' },
  { name: 'Obsidian Slate', hex: '#1c1b1f', halo: '#313038', family: 'dark' },
  { name: 'Lamp Black', hex: '#101012', halo: '#222126', family: 'dark' },
  { name: 'Charcoal Wash', hex: '#2b2c2e', halo: '#444547', family: 'dark' },
  { name: 'Ash Grey', hex: '#6b6b70', halo: '#8b8b91', family: 'dark' },
  { name: 'Titanium Bone White', hex: '#e3dfd3', halo: '#f5f2e8', family: 'white' },
  { name: 'Warm Chalk', hex: '#d1c7b7', halo: '#eae2d3', family: 'white' }
];

/**
 * Computes an authentic Rothko luminous feathered halo for any hex pigment.
 * Shifts lightness and chroma organically to generate characteristic color vibration.
 */
export function computeRothkoHalo(hex) {
  let c = hex.replace('#', '').trim();
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const num = parseInt(c, 16);
  if (isNaN(num)) return '#b83b28';

  let r = ((num >> 16) & 255) / 255;
  let g = ((num >> 8) & 255) / 255;
  let b = (num & 255) / 255;

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

  // Calculate luminous halo:
  // Rothko halos are typically +16% lighter, and slightly warmer / higher chroma
  let newL = Math.min(0.88, Math.max(0.18, l + 0.16));
  let newS = Math.min(1.0, Math.max(0.2, s * 1.18));
  let newH = h;
  // Subtle warm hue shift for reds, yellows, and oranges
  if (h < 0.15 || h > 0.88) {
    newH = (h + 0.02) % 1;
  }

  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };

  const q = newL < 0.5 ? newL * (1 + newS) : newL + newS - newL * newS;
  const p = 2 * newL - q;
  const outR = Math.round(hue2rgb(p, q, newH + 1/3) * 255);
  const outG = Math.round(hue2rgb(p, q, newH) * 255);
  const outB = Math.round(hue2rgb(p, q, newH - 1/3) * 255);

  const toHex = x => x.toString(16).padStart(2, '0');
  return `#${toHex(outR)}${toHex(outG)}${toHex(outB)}`;
}

export const SHAPES = [
  { id: 'rectangle', name: 'Rectangle', defW: 0.82, defH: 0.38 },
  { id: 'horizon', name: 'Horizon Band', defW: 0.88, defH: 0.14 },
  { id: 'pillar', name: 'Tall Pillar', defW: 0.36, defH: 0.72 },
  { id: 'twin_bars', name: 'Twin Bars', defW: 0.82, defH: 0.42 },
  { id: 'oval', name: 'Soft Oval', defW: 0.75, defH: 0.45 }
];

export const TEXTURES = [
  { id: 'smooth', name: 'Smooth Wash', relief: 0.2 },
  { id: 'dry_brush', name: 'Dry Brush', relief: 0.5 },
  { id: 'impasto', name: 'Thick Impasto', relief: 0.9 }
];

export const EDGES = [
  { id: 'soft', name: 'Soft Halo', baseBlur: 35 },
  { id: 'rough', name: 'Rough Bristle', baseBlur: 22 },
  { id: 'crisp', name: 'Crisp Edge', baseBlur: 6 }
];

export const WALL_ARCHITECTURES = [
  { id: 'slate', name: 'Seagram Slate Wall', wallColor: '#171516', floorColor: '#0c0a0b' },
  { id: 'stucco', name: 'Warm Plaster Wall', wallColor: '#2b2623', floorColor: '#171412' },
  { id: 'concrete', name: 'Concrete Wall', wallColor: '#242526', floorColor: '#121314' },
  { id: 'white', name: 'Gallery White Wall', wallColor: '#3a3836', floorColor: '#1c1a19' }
];
