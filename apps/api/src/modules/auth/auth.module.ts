import {Module} from "@nestjs/common";

import {UploadModule} from "@modules/upload";
import {UserModule} from "@modules/user";
import {AuthController} from "./auth.controller";

@Module({
  imports: [UserModule, UploadModule],
  controllers: [AuthController],
})
export class AuthModule {}
