import { SensorAssembler } from './sensors-assembler';
import { SensorResource } from './sensors-response';

describe('SensorAssembler business area association', () => {
  const assembler = new SensorAssembler();

  const resource: SensorResource = {
    id: 10,
    name: 'Sensor refrigeradora',
    model: 'Shelly Plug S',
    serialNumber: 'SN-TEST-001',
    status: 'En línea',
    currentPowerKw: 2.5,
    todayKwh: 8,
    assignedDeviceId: 5,
    lastSync: '2026-11-27T08:00:00'
  };

  it('should map an explicit business area ID', () => {
    const sensor = assembler.toEntity({
      ...resource,
      businessAreaId: 3
    });

    expect(sensor.businessAreaId).toBe(3);
    expect(sensor.assignedDeviceId).toBe(5);
  });

  it('should support sensors without a business area', () => {
    const sensor = assembler.toEntity({
      ...resource,
      businessAreaId: null
    });

    expect(sensor.businessAreaId).toBeNull();
  });

  it('should support legacy responses without area ID', () => {
    const sensor = assembler.toEntity(resource);

    expect(sensor.businessAreaId).toBeNull();
  });

  it('should preserve area assignment without a device', () => {
    const sensor = assembler.toEntity({
      ...resource,
      assignedDeviceId: null,
      businessAreaId: 3
    });

    expect(sensor.businessAreaId).toBe(3);
    expect(sensor.isAssigned).toBe(false);
  });

  it('should preserve telemetry when mapping the area', () => {
    const sensor = assembler.toEntity({
      ...resource,
      businessAreaId: 3
    });

    expect(sensor.currentPowerKw).toBe(2.5);
    expect(sensor.todayKwh).toBe(8);
  });
});
