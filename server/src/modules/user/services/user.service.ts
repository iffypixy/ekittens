import {Injectable} from "@nestjs/common";
import {InjectRepository} from "@nestjs/typeorm";
import {Repository} from "typeorm";

import {User} from "../entities";

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
  ) {}

  async create(partial: Partial<User>): Promise<User> {
    const entity = this.repository.create(partial);

    return this.repository.save(entity);
  }

  findOne = this.repository.findOne;
  save = this.repository.save;
  update = this.repository.update;
  find = this.repository.find;
}
