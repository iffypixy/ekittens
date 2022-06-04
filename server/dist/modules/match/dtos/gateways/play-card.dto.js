"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlayCardDto = void 0;
const class_validator_1 = require("class-validator");
const deck_1 = require("../../lib/deck");
class PlayCardDto {
}
__decorate([
    (0, class_validator_1.IsString)({
        message: "MatchID must be a type of string",
    }),
    __metadata("design:type", String)
], PlayCardDto.prototype, "matchId", void 0);
__decorate([
    (0, class_validator_1.IsIn)(deck_1.cards, {
        message: "Card type must be valid",
    }),
    __metadata("design:type", String)
], PlayCardDto.prototype, "card", void 0);
__decorate([
    (0, class_validator_1.IsString)({
        message: "PlayerID must be a type of string",
    }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], PlayCardDto.prototype, "playerId", void 0);
exports.PlayCardDto = PlayCardDto;
//# sourceMappingURL=play-card.dto.js.map