# ekittens

A web/browser adaptation of the popular board game named "exploding kittens".

## Overview

You’ll have a deck of cards containing some "exploding kitten" cards. You play the game by putting the deck face down and taking turns drawing cards until someone draws an exploding kitten.

When that happens, that person explodes. They are now dead and out of the game. This process continues until there’s only one player left, who wins the game.

And all of the other cards will lessen your chances of blowing up.

## Features

- 🎮 Online matchmaking system
- 🔒 Creating private lobbies
- 👥 Adding/removing friends
- 🏆 Global rating ladder
- 👤 Personal player profiles
- 💬 In-game real-time chat
- 🌐 Internationalization enabled 
- 🎨 Multiple color themes

## Getting started

### Requirements

This project requires Node.js, PostgreSQL and Redis running.

### Steps

Clone the repository:

```
git clone https://github.com/iffypixy/ekittens
cd ./ekittens-[branch]
```

Insert your env variables:

```
cp .env.sample .env
```

Install dependencies and run:

```
npm i
npm run start
```

## License

[MIT](https://choosealicense.com/licenses/mit/)
