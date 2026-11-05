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
    name: 'Crimson Wash',
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
    id: 'stain_slate',
    name: 'Dark Slate Ground',
    hex: '#212024',
    isRaw: false,
    description: 'Austere late-period charcoal-black primer'
  }
];

export const PIGMENTS = [
  { name: 'Crimson Red', hex: '#8c161c', halo: '#b83b28' },
  { name: 'Venetian Red', hex: '#a63328', halo: '#d4563b' },
  { name: 'Burnt Ochre', hex: '#ba5222', halo: '#e07e36' },
  { name: 'Deep Cadmium', hex: '#d99818', halo: '#f2bd38' },
  { name: 'Cinnabar Orange', hex: '#cf4b2b', halo: '#e8744b' },
  { name: 'Plum Aubergine', hex: '#3d1a2b', halo: '#692a4a' },
  { name: 'Ultramarine Noir', hex: '#161c36', halo: '#2d3766' },
  { name: 'Raw Umber', hex: '#3d251c', halo: '#5c3a2c' },
  { name: 'Obsidian Slate', hex: '#1c1b1f', halo: '#313038' },
  { name: 'Terracotta', hex: '#9e6d5a', halo: '#c28c78' }
];

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
