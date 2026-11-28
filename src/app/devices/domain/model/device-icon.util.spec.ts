import {
  getDefaultIconIdForCategory,
  getDeviceIconOption,
  getSavedDeviceIconId,
  resolveDeviceIconOption,
  saveDeviceIconId
} from './device-icon.util';

describe('device-icon.util (Heuristic #4 Visual Iconography)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should resolve appropriate default icons per commercial or residential category', () => {
    expect(getDefaultIconIdForCategory('Refrigeración')).toBe('refrigeration');
    expect(getDefaultIconIdForCategory('Maquinaria')).toBe('machinery');
    expect(getDefaultIconIdForCategory('Cocina')).toBe('oven');
    expect(getDefaultIconIdForCategory('Climatización')).toBe('hvac');
    expect(getDefaultIconIdForCategory('Unknown')).toBe('general');
  });

  it('should persist and resolve custom icon selection by device ID', () => {
    saveDeviceIconId(42, 'coffee');

    expect(getSavedDeviceIconId(42)).toBe('coffee');
    const resolved = resolveDeviceIconOption(42, 'Cocina');
    expect(resolved.id).toBe('coffee');
    expect(resolved.icon).toBe('coffee_maker');
  });

  it('should fall back to category icon when icon ID is unknown or missing', () => {
    const resolved = getDeviceIconOption('non-existent', 'Maquinaria');
    expect(resolved.id).toBe('machinery');
    expect(resolved.icon).toBe('precision_manufacturing');
  });
});
