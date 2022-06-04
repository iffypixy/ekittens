"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plain = void 0;
exports.plain = {
    match: (match) => {
        const { id, deck, pile, players, turn } = match;
        const mapped = players.map((player) => ({
            id: player.id,
            username: player.username,
            avatar: player.avatar,
            left: player.cards.length,
        }));
        return {
            id,
            pile,
            turn,
            left: deck.length,
            players: mapped,
        };
    },
};
//# sourceMappingURL=plain.js.map