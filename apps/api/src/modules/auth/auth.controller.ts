import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Session,
  UseGuards,
} from "@nestjs/common";
import {SessionWithData} from "express-session";
import bcrypt from "bcryptjs";

import {User} from "@modules/user";
import {UploadService} from "@modules/upload";
import {avatars} from "@lib/avatars";

import {LoginDto, RegisterDto, VerifyUsernameDto} from "./dtos/controllers";
import {IsAuthenticatedViaHttpGuard} from "./guards";

@Controller("/auth")
export class AuthController {
  constructor(private readonly uploadService: UploadService) {}

  @Post("/verify/username")
  async verifyUsername(@Body() dto: VerifyUsernameDto): Promise<{ok: boolean}> {
    const amount = await User.count({
      where: {
        username: dto.username,
      },
    });

    const doesExist = amount > 0;

    return {ok: !doesExist};
  }

  @Post("/register")
  async register(
    @Body() dto: RegisterDto,
    @Session() session: SessionWithData,
  ) {
    const existed = await User.findOne({
      where: {
        username: dto.username,
      },
    });

    if (existed)
      throw new BadRequestException(
        "There is already a user with the same username",
      );

    const salt = await bcrypt.genSalt();
    const password = await bcrypt.hash(dto.password, salt);

    const avatar = avatars[Math.floor(Math.random() * avatars.length)];

    const user = User.create({
      username: dto.username,
      password,
      avatar,
    });

    await user.save();

    session.userId = user.id;
    session.user = user;

    return {
      credentials: user.public,
    };
  }

  @Post("/login")
  async login(@Body() dto: LoginDto, @Session() session: SessionWithData) {
    const user = await User.findOne({
      where: {
        username: dto.username,
      },
    });

    const exception = new BadRequestException("Invalid credentials");

    if (!user) throw exception;

    const doPasswordsMatch = await bcrypt.compare(dto.password, user.password);

    if (!doPasswordsMatch) throw exception;

    session.userId = user.id;
    session.user = user;

    return {
      credentials: user.public,
    };
  }

  @UseGuards(IsAuthenticatedViaHttpGuard)
  @Get("/credentials")
  async getCredentials(@Session() session: SessionWithData) {
    return {
      credentials: User.create(session.user).public,
    };
  }

  @Post("/logout")
  logout(@Session() session: SessionWithData): Promise<void> {
    return new Promise((resolve, reject) => {
      session.destroy((error) => {
        if (error) reject(error);

        resolve();
      });
    });
  }
}
