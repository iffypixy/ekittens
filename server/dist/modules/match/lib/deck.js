"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deck = exports.cards = void 0;
const shuffle_1 = require("../../../lib/shuffle");
exports.cards = [
    "exploding-kitten",
    "defuse",
    "attack",
    "nope",
    "shuffle",
    "skip",
    "see-the-future",
];
const special = ["exploding-kitten", "defuse"];
const ordinary = exports.cards.filter((card) => !special.includes(card));
const INITIAL_CARDS_QUANTITY = 4;
const generate = (quantity) => {
    const total = quantity * 10;
    const deck = new Array(Math.ceil(total / ordinary.length))
        .fill(ordinary)
        .flat();
    deck.length = total;
    const shuffled = (0, shuffle_1.shuffle)(deck);
    const individual = Array.from(new Array(quantity), () => []);
    for (let i = 0; i < quantity; i++) {
        for (let j = 0; j < INITIAL_CARDS_QUANTITY; j++) {
            const idx = j + i * INITIAL_CARDS_QUANTITY;
            individual[i].push(shuffled[idx]);
        }
    }
    shuffled.splice(0, quantity * INITIAL_CARDS_QUANTITY);
    const exploding = new Array(quantity - 1).fill("exploding-kitten");
    const defuse = new Array(quantity).fill("defuse");
    shuffled.push(...exploding);
    shuffled.push(...defuse);
    return {
        individual,
        main: (0, shuffle_1.shuffle)(shuffled),
    };
};
exports.deck = { generate };
//# sourceMappingURL=deck.js.map