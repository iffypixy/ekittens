import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Session,
  UseGuards,
} from "@nestjs/common";
import {Sess} from "express-session";
import bcrypt from "bcryptjs";

import {UserPublic, UserService} from "@modules/user";
import {LoginDto, RegisterDto, VerifyUsernameDto} from "./dtos/controllers";
import {IsAuthenticatedGuard} from "./is-authenticated.guard";

@Controller("/auth")
export class AuthController {
  constructor(private readonly userService: UserService) {}

  @Post("/verify/username")
  async verifyUsername(
    @Body() dto: VerifyUsernameDto,
  ): Promise<{doesExist: boolean}> {
    const amount = await this.userService.count({
      where: {
        username: dto.username,
      },
    });

    const doesExist = amount > 0;

    return {doesExist};
  }

  @Post("/register")
  async register(
    @Body() dto: RegisterDto,
    @Session() session: Sess,
  ): Promise<{user: UserPublic}> {
    const existed = await this.userService.findOne({
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

    const user = await this.userService.create({
      username: dto.username,
      password,
    });

    session.userId = user.id;
    session.user = user;

    return {
      user: user.public,
    };
  }

  @Post("/login")
  async login(
    @Body() dto: LoginDto,
    @Session() session: Sess,
  ): Promise<{user: UserPublic}> {
    const user = await this.userService.findOne({
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
      user: user.public,
    };
  }

  @UseGuards(IsAuthenticatedGuard)
  @Get("/credentials")
  getCredentials(@Session() session: Sess): {user: UserPublic} {
    return {
      user: session.user.public,
    };
  }

  @Post("/logout")
  logout(@Session() session: Sess): Promise<void> {
    return new Promise((resolve, reject) => {
      session.destroy((error) => {
        if (error) reject(error);

        resolve();
      });
    });
  }
}
