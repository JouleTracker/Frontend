export interface DeviceIconOption {
  id: string;
  icon: string;
  labelKey: string;
  color: string;
  bgColor: string;
  defaultCategories?: string[];
}

export const DEVICE_ICON_OPTIONS: readonly DeviceIconOption[] = [
  {
    id: 'refrigeration',
    icon: 'kitchen',
    labelKey: 'DEVICES.ICON_LABELS.REFRIGERATION',
    color: '#0284c7',
    bgColor: '#e0f2fe',
    defaultCategories: ['Refrigeración']
  },
  {
    id: 'oven',
    icon: 'local_fire_department',
    labelKey: 'DEVICES.ICON_LABELS.OVEN',
    color: '#ea580c',
    bgColor: '#ffedd5',
    defaultCategories: ['Cocina']
  },
  {
    id: 'hvac',
    icon: 'ac_unit',
    labelKey: 'DEVICES.ICON_LABELS.HVAC',
    color: '#0891b2',
    bgColor: '#cffafe',
    defaultCategories: ['Climatización']
  },
  {
    id: 'lighting',
    icon: 'lightbulb',
    labelKey: 'DEVICES.ICON_LABELS.LIGHTING',
    color: '#ca8a04',
    bgColor: '#fef9c3',
    defaultCategories: ['Iluminación']
  },
  {
    id: 'machinery',
    icon: 'precision_manufacturing',
    labelKey: 'DEVICES.ICON_LABELS.MACHINERY',
    color: '#4f46e5',
    bgColor: '#e0e7ff',
    defaultCategories: ['Maquinaria']
  },
  {
    id: 'office',
    icon: 'computer',
    labelKey: 'DEVICES.ICON_LABELS.OFFICE',
    color: '#2563eb',
    bgColor: '#dbeafe',
    defaultCategories: ['Oficina']
  },
  {
    id: 'entertainment',
    icon: 'tv',
    labelKey: 'DEVICES.ICON_LABELS.ENTERTAINMENT',
    color: '#7c3aed',
    bgColor: '#ede9fe',
    defaultCategories: ['Entretenimiento']
  },
  {
    id: 'coffee',
    icon: 'coffee_maker',
    labelKey: 'DEVICES.ICON_LABELS.COFFEE',
    color: '#9a3412',
    bgColor: '#ffedd5'
  },
  {
    id: 'home',
    icon: 'home',
    labelKey: 'DEVICES.ICON_LABELS.HOME',
    color: '#16a34a',
    bgColor: '#dcfce7',
    defaultCategories: ['Hogar']
  },
  {
    id: 'general',
    icon: 'bolt',
    labelKey: 'DEVICES.ICON_LABELS.GENERAL',
    color: '#475569',
    bgColor: '#f1f5f9',
    defaultCategories: ['Otros']
  }
];

const DEVICE_ICONS_STORAGE_KEY = 'jouletracker_device_icons';

function readIconsMap(): Record<string, string> {
  try {
    const raw = localStorage.getItem(DEVICE_ICONS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function getDefaultIconIdForCategory(category?: string): string {
  if (!category) return 'general';
  const match = DEVICE_ICON_OPTIONS.find((opt) =>
    opt.defaultCategories?.includes(category)
  );
  return match?.id ?? 'general';
}

export function getDeviceIconOption(
  iconId?: string | null,
  category?: string
): DeviceIconOption {
  const byId = iconId
    ? DEVICE_ICON_OPTIONS.find((opt) => opt.id === iconId)
    : undefined;
  if (byId) return byId;

  const fallbackId = getDefaultIconIdForCategory(category);
  return (
    DEVICE_ICON_OPTIONS.find((opt) => opt.id === fallbackId) ??
    DEVICE_ICON_OPTIONS[DEVICE_ICON_OPTIONS.length - 1]
  );
}

export function getSavedDeviceIconId(deviceId: number): string | null {
  if (!deviceId) return null;
  const map = readIconsMap();
  return map[String(deviceId)] ?? null;
}

export function saveDeviceIconId(deviceId: number, iconId: string): void {
  if (!deviceId || !iconId) return;
  const map = readIconsMap();
  map[String(deviceId)] = iconId;
  try {
    localStorage.setItem(DEVICE_ICONS_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Ignore storage quota errors
  }
}

export function resolveDeviceIconOption(
  deviceId: number,
  category?: string
): DeviceIconOption {
  return getDeviceIconOption(getSavedDeviceIconId(deviceId), category);
}
