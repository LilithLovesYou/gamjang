const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { Deck, Card } = require("./deck");
const Hand = require("./hand");

class Game {
  constructor(playerID, bet, isWinningGame = false) {
    this.deck = new Deck();
    this.deck.shuffle();
    this.playerID = playerID;
    this.bet = bet;
    this.playerStand = false;
    this.playerBust = false;
    this.isWinningGame = isWinningGame;

    this.playerHand = new Hand();
    this.dealerHand = new Hand();

    if (isWinningGame) {
      this.playerHand.addCard(new Card("Hearts", "J"));
      this.playerHand.addCard(new Card("Spades", "A"));
      this.dealerHand.addCard(new Card("Hearts", "2"));
      this.playerStand = true;
    } else {
      let [ok, card] = this.deck.draw();
      if (ok) this.playerHand.addCard(card);
      [ok, card] = this.deck.draw();
      if (ok) this.playerHand.addCard(card);

      [ok, card] = this.deck.draw();
      if (ok) this.dealerHand.addCard(card);
      [ok, card] = this.deck.draw();
      if (ok) this.dealerHand.addCard(card);

      if (this.playerHand.total() === 21) {
        return new Game(playerID, bet, false);
      }
    }
  }

  render() {
    let playerHand =
      this.playerHand.cards.map((card) => card.toString()).join(" ") +
      ` (${this.playerHand.total()})`;
    let dealerHand =
      this.dealerHand.cards.map((card) => card.toString()).join(" ") +
      ` (${this.dealerHand.total()})`;

    let output = `\n\n**Your hand:** ${playerHand}\n**Dealer's hand:** ${dealerHand}\n\n**Bet:** ${this.bet} <:coin:1356375500632756224>\n`;

    if (this.playerBust) {
      output += "**You busted!**\n";
    }

    if (this.isWinningGame) {
      output += `**You won ${this.bet * 10} <:coin:1356375500632756224>!**\n`;
    }

    return output;
  }

  hit() {
    const [ok, card] = this.deck.draw();
    if (!ok) return false;

    this.playerHand.addCard(card);
    if (this.playerHand.total() === 21) {
      this.playerHand.cards = this.playerHand.cards.slice(
        0,
        this.playerHand.cards.length - 1
      );
      return this.hit();
    }

    if (this.playerHand.total() > 21) {
      this.playerBust = true;
      this.playerStand = true;
      this.deleteGame();
    }

    return true;
  }

  stand() {
    this.playerStand = true;
    while (this.dealerHand.total() < 17) {
      const [ok, card] = this.deck.draw();
      if (!ok) return false;

      this.dealerHand.addCard(card);
    }

    this.deleteGame();
    return true;
  }

  renderButtons() {
    if (this.playerStand) return [];

    return [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("hit")
          .setLabel("Hit")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId("stand")
          .setLabel("Stand")
          .setStyle(ButtonStyle.Primary)
      ),
    ];
  }

  deleteGame() {
    console.log(`Deleting game for player ${this.playerID}`);
  }
}

module.exports = { Game, Card };