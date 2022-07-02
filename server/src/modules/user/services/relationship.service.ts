import {Injectable} from "@nestjs/common";
import {InjectRepository} from "@nestjs/typeorm";
import {Repository} from "typeorm";

import {Relationship} from "../entities";

@Injectable()
export class RelationshipService {
  constructor(
    @InjectRepository(Relationship)
    private readonly repository: Repository<Relationship>,
  ) {}

  async create(partial: Partial<Relationship>): Promise<Relationship> {
    const entity = this.repository.create(partial);

    return this.repository.save(entity);
  }

  findOne = this.repository.findOne;
  save = this.repository.save;
  update = this.repository.update;
  find = this.repository.find;
}
