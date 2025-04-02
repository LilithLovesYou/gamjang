class Hand {
  constructor() {
    this.cards = [];
  }

  total() {
    let total = 0;
    let aces = 0;

    for (let card of this.cards) {
      total += card.blackjackValue();
      if (card.value === "A") {
        aces++;
      }
    }

    while (aces > 0 && total > 21) {
      total -= 10;
      aces--;
    }

    return total;
  }

  addCard(card) {
    this.cards.push(card);
  }
}

module.exports = Hand;