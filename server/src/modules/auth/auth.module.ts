import {UserModule} from "@modules/user";
import {Module} from "@nestjs/common";

import {AuthController} from "./auth.controller";

@Module({
  imports: [UserModule],
  controllers: [AuthController],
})
export class AuthModule {}
