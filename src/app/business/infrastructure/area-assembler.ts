import { Area } from '../domain/model/area.entity';
import { AreaResource } from './area-response';

export class AreaAssembler {
  toEntity(resource: AreaResource): Area {
    return new Area({
      id: resource.id,
      name: resource.name,
      description: resource.description,
      floor: resource.floor,
      icon: resource.icon,
      userId: resource.userId
    });
  }

  toEntities(resources: AreaResource[]): Area[] {
    return (resources ?? []).map((r) => this.toEntity(r));
  }

  toResource(entity: Area): AreaResource {
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description,
      floor: entity.floor,
      icon: entity.icon,
      userId: entity.userId
    };
  }
}
