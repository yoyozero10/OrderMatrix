export interface DeviceHardwareSpec {
  key: string;
  displayName: string;
  category: 'laptop' | 'tablet' | 'phone' | 'watch' | 'audio' | 'charger' | 'cable';
  minPower?: number; // Watts
  recommendedPower?: number; // Watts
  maxPower?: number; // Watts
  isPowerSource?: boolean;
  outputPower?: number; // Watts
  isCable?: boolean;
  ports?: string[];
  chargingPorts?: string[];
  ends?: string[];
  connector?: string;
  colorGroup?: string;
  skuPrefix?: string;
  matchNames: string[];
}

export const APPLE_HARDWARE_SPECS: DeviceHardwareSpec[] = [
  {
    key: 'macbook_pro_16',
    displayName: 'MacBook Pro 16" M3 Max',
    category: 'laptop',
    minPower: 96,
    recommendedPower: 140,
    maxPower: 140,
    ports: ['magsafe3', 'thunderbolt4', 'hdmi', 'headphone'],
    chargingPorts: ['magsafe3', 'thunderbolt4'],
    colorGroup: 'dark/silver',
    skuPrefix: 'MBP16M3M',
    matchNames: ['MacBook Pro 16', 'MacBook Pro 16" M3 Max', 'MacBook Pro 16 M3 Max'],
  },
  {
    key: 'macbook_air_15',
    displayName: 'MacBook Air 15" M3',
    category: 'laptop',
    minPower: 35,
    recommendedPower: 70,
    maxPower: 70,
    ports: ['magsafe3', 'thunderbolt3', 'headphone'],
    chargingPorts: ['magsafe3', 'thunderbolt3'],
    colorGroup: 'midnight/starlight/spacegray/silver',
    skuPrefix: 'MBA15M3',
    matchNames: ['MacBook Air 15', 'MacBook Air 15" M3', 'MacBook Air 15 M3'],
  },
  {
    key: 'ipad_pro_m4',
    displayName: 'iPad Pro M4',
    category: 'tablet',
    minPower: 20,
    recommendedPower: 30,
    maxPower: 30,
    ports: ['thunderbolt'],
    chargingPorts: ['thunderbolt'],
    colorGroup: 'dark/silver',
    skuPrefix: 'IPADM4',
    matchNames: ['iPad Pro M4'],
  },
  {
    key: 'iphone_16_pro_max',
    displayName: 'iPhone 16 Pro Max',
    category: 'phone',
    minPower: 20,
    recommendedPower: 30,
    maxPower: 30,
    ports: ['usbc'],
    chargingPorts: ['usbc'],
    colorGroup: 'titanium',
    skuPrefix: 'IP16PM',
    matchNames: ['iPhone 16 Pro Max'],
  },
  {
    key: 'iphone_15_pro_max',
    displayName: 'iPhone 15 Pro Max',
    category: 'phone',
    minPower: 20,
    recommendedPower: 30,
    maxPower: 30,
    ports: ['usbc'],
    chargingPorts: ['usbc'],
    colorGroup: 'titanium',
    skuPrefix: 'IP15PM',
    matchNames: ['iPhone 15 Pro Max'],
  },
  {
    key: 'apple_watch_ultra_2',
    displayName: 'Apple Watch Ultra 2',
    category: 'watch',
    minPower: 5,
    recommendedPower: 5,
    maxPower: 5,
    ports: ['magnetic_usbc'],
    chargingPorts: ['magnetic_usbc'],
    colorGroup: 'titanium',
    skuPrefix: 'AWU2',
    matchNames: ['Apple Watch Ultra 2'],
  },
  {
    key: 'apple_watch_series_9',
    displayName: 'Apple Watch Series 9',
    category: 'watch',
    minPower: 5,
    recommendedPower: 5,
    maxPower: 5,
    ports: ['magnetic_usbc'],
    chargingPorts: ['magnetic_usbc'],
    colorGroup: 'dark/silver',
    skuPrefix: 'AWS9',
    matchNames: ['Apple Watch Series 9'],
  },
  {
    key: 'airpods_pro_2',
    displayName: 'AirPods Pro 2 (USB-C)',
    category: 'audio',
    minPower: 5,
    recommendedPower: 5,
    maxPower: 5,
    ports: ['usbc', 'magsafe'],
    chargingPorts: ['usbc', 'magsafe'],
    colorGroup: 'white',
    skuPrefix: 'APP2',
    matchNames: ['AirPods Pro 2', 'AirPods Pro 2 (USB-C)'],
  },
  {
    key: 'airpods_max',
    displayName: 'AirPods Max',
    category: 'audio',
    minPower: 5,
    recommendedPower: 5,
    maxPower: 5,
    ports: ['usbc'],
    chargingPorts: ['usbc'],
    colorGroup: 'multicolor',
    skuPrefix: 'APM',
    matchNames: ['AirPods Max'],
  },
  {
    key: 'adapter_20w',
    displayName: 'Củ sạc nhanh Apple 20W USB-C',
    category: 'charger',
    isPowerSource: true,
    outputPower: 20,
    ports: ['usbc'],
    skuPrefix: 'ADAPTER-20W',
    matchNames: ['Củ sạc nhanh Apple 20W', 'Củ sạc nhanh Apple 20W USB-C', '20W USB-C'],
  },
  {
    key: 'magsafe3_cable',
    displayName: 'Cáp sạc MagSafe 3 Apple (2m)',
    category: 'cable',
    isCable: true,
    maxPower: 140,
    connector: 'magsafe3_to_usbc',
    ends: ['magsafe3', 'usbc'],
    skuPrefix: 'MAGSAFE3',
    matchNames: ['Cáp sạc MagSafe 3 Apple', 'Cáp sạc MagSafe 3 Apple (2m)', 'MagSafe 3'],
  },
];

export interface ColorPaletteRule {
  id: string;
  name: string;
  hexes: string[];
}

export const COLOR_PALETTES: ColorPaletteRule[] = [
  {
    id: 'titanium',
    name: 'Titanium Tự Nhiên & Sa Mạc (Grade 5)',
    hexes: ['#C3A68F', '#9E978E', '#F2F1ED', '#1D1D1F', '#4B6CB7'],
  },
  {
    id: 'space_dark',
    name: 'Đen Không Gian & Midnight',
    hexes: ['#2E2F32', '#191F26', '#535150', '#1D1D1F'],
  },
  {
    id: 'silver_light',
    name: 'Bạc Nguyên Khối & Ánh Sao',
    hexes: ['#E3E4E5', '#F0E5D8', '#F2F1ED', '#FFFFFF'],
  },
  {
    id: 'vibrant',
    name: 'Màu Sắc Năng Động (Vibrant)',
    hexes: ['#2563EB', '#E05338', '#8B5CF6'],
  },
];
