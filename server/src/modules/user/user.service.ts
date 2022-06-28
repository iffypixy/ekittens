import {Injectable} from "@nestjs/common";
import {InjectRepository} from "@nestjs/typeorm";
import {Repository} from "typeorm";

import {User} from "./entities";

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
  ) {}

  findOne = this.repository.findOne;
  create = this.repository.create;
  save = this.repository.save;
  update = this.repository.update;
}
