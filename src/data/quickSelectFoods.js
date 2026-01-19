// Quick select foods data
// Protein values are per 100g

export const QUICK_SELECT_FOODS = {
  'kiaušinis': {
    description: 'Kiaušinis',
    protein: 13.0,
    icon: '🥚',
    serving: 60
  },
  'vištiena': {
    description: 'Vištienos krūtinėlė',
    protein: 31.0,
    icon: '🐔',
    serving: 150
  },
  'varškė': {
    description: 'Varškė',
    protein: 18.0,
    icon: '☁️',
    serving: 100
  },
  'kiauliena': {
    description: 'Kiaulienos nugarinė',
    protein: 21.0,
    icon: '🐷',
    serving: 150
  },
  'sūris': {
    description: 'Sūris',
    protein: 25.0,
    icon: '🧀',
    serving: 30
  },
  'jautiena': {
    description: 'Jautiena',
    protein: 26.0,
    icon: '🐮',
    serving: 150
  },
  'jogurtas': {
    description: 'Graikiškas jogurtas',
    protein: 10.0,
    icon: '🥛',
    serving: 150
  },
  'žuvis': {
    description: 'Lašiša',
    protein: 25.0,
    icon: '🐟',
    serving: 150
  },
  'riešutai': {
    description: 'Migdolai',
    protein: 21.0,
    icon: '🥜',
    serving: 30
  },
  'proteino milteliai': {
    description: 'Proteino milteliai',
    protein: 80.0,
    icon: '💪',
    serving: 30
  }
};

// Get ordered array of foods for display
export const getQuickSelectFoodsArray = () => {
  return Object.entries(QUICK_SELECT_FOODS).map(([key, food]) => ({
    key,
    ...food
  }));
};

// Calculate protein amount based on serving
export const calculateProtein = (proteinPer100g, servingGrams) => {
  return Math.round((proteinPer100g * servingGrams) / 100);
};
