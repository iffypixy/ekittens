import sess from "express-session";

const month = 2629800000;

export const session = () =>
  sess({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      maxAge: month,
      httpOnly: true,
    },
  });
