class Card {
  constructor(suit, value) {
    this.suit = suit;
    this.value = value;
  }

  blackjackValue() {
    switch (this.value) {
      case "A":
        return 11;
      case "J":
      case "Q":
      case "K":
        return 10;
      default:
        return parseInt(this.value, 10) || 0;
    }
  }

  toString() {
    let suitSymbol = "";
    switch (this.suit) {
      case "Hearts":
        suitSymbol = "♥";
        break;
      case "Diamonds":
        suitSymbol = "♦";
        break;
      case "Clubs":
        suitSymbol = "♣";
        break;
      case "Spades":
        suitSymbol = "♠";
        break;
      default:
        suitSymbol = "?";
    }
    return `\`${suitSymbol}${this.value}\``;
  }
}

class Deck {
  constructor() {
    this.cards = [];
    const deckValues = [
      "A",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "10",
      "J",
      "Q",
      "K",
    ];
    const deckSuits = ["Hearts", "Diamonds", "Clubs", "Spades"];
    deckSuits.forEach((suit) => {
      deckValues.forEach((value) => {
        this.cards.push(new Card(suit, value));
      });
    });
  }

  shuffle() {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  draw() {
    if (this.cards.length === 0) return [false, null];
    const card = this.cards.pop();
    return [true, card];
  }
}

module.exports = { Deck, Card };
