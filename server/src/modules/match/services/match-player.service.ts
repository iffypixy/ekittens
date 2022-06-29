import {Injectable} from "@nestjs/common";
import {InjectRepository} from "@nestjs/typeorm";
import {Repository} from "typeorm";

import {MatchPlayer} from "../entities";

@Injectable()
export class MatchPlayerService {
  constructor(
    @InjectRepository(MatchPlayer)
    private readonly repository: Repository<MatchPlayer>,
  ) {}

  create = this.repository.create;
  save = this.repository.save;
  update = this.repository.update;
  count = this.repository.count;
  findOne = this.repository.findOne;
}
