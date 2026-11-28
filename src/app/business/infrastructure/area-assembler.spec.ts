import { AreaAssembler } from './area-assembler';

describe('AreaAssembler notification recipients', () => {
  const assembler = new AreaAssembler();

  const resource = {
    id: 1,
    userId: 1,
    name: 'Cocina',
    floor: 'Piso 1',
    description: 'Área comercial',
    icon: 'restaurant'
  };

  it('should map shared recipients from the API', () => {
    const area = assembler.toEntity({
      ...resource,
      notificationRecipients: [
        'admin@example.com',
        'supervisor@example.com'
      ]
    });

    expect(area.notificationRecipients).toEqual([
      'admin@example.com',
      'supervisor@example.com'
    ]);
  });

  it('should support legacy areas without recipients', () => {
    const area = assembler.toEntity(resource);

    expect(area.notificationRecipients).toEqual([]);
  });

  it('should include recipients when serializing an area', () => {
    const area = assembler.toEntity({
      ...resource,
      notificationRecipients: ['admin@example.com']
    });

    const result = assembler.toResource(area);

    expect(result.notificationRecipients).toEqual([
      'admin@example.com'
    ]);
  });

  it('should preserve an empty recipient list', () => {
    const area = assembler.toEntity({
      ...resource,
      notificationRecipients: []
    });

    expect(
      assembler.toResource(area).notificationRecipients
    ).toEqual([]);
  });
});
