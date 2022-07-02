import {Injectable} from "@nestjs/common";
import {InjectRepository} from "@nestjs/typeorm";
import {Repository} from "typeorm";

import {Match} from "../entities";

@Injectable()
export class MatchService {
  constructor(
    @InjectRepository(Match) private readonly repository: Repository<Match>,
  ) {}

  async create(partial: Partial<Match>): Promise<Match> {
    const entity = this.repository.create(partial);

    return this.repository.save(entity);
  }

  save = this.repository.save;
  findOne = this.repository.findOne;
  update = this.repository.update;
}
