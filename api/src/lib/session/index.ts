import sess from "express-session";
import connectRedis from "connect-redis";
import {Redis} from "ioredis";

const RedisStore = connectRedis(sess);

const month = 2629800000;

export const session = (client: Redis) =>
  sess({
    store: new RedisStore({client}),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      maxAge: month,
      httpOnly: true,
    },
  });
