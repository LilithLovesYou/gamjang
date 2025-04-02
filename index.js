const { Client, GatewayIntentBits } = require("discord.js");
const Redis = require("ioredis");
const dotenv = require("dotenv");
const readline = require("readline");
const { saveGame, getGame, deleteGame } = require("./blackjack/games");
const { Game, Card } = require("./blackjack/game");

dotenv.config();

// Bot parameters
const RemoveCommands = true; // Change this to false if you don't want to remove commands after shutdown

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});
const redis = new Redis(process.env.REDIS_URL);

const footer =
  "-# This is an April Fools joke, all currency and games are fake. Do not gamble.";
const minBet = 1;

const commands = [
  {
    name: "balance",
    description: "Check your balance",
  },
  {
    name: "loan",
    description:
      "Take an instant loan to gamble more! (NOTE: Loans have an interest rate of 15% per day)",
    options: [
      {
        name: "amount",
        description: "Loan amount",
        type: 4,
        required: true,
        min_value: minBet,
      },
    ],
  },
  {
    name: "blackjack",
    description: "Play blackjack",
    options: [
      {
        name: "bet",
        description: "Bet amount",
        type: 4,
        required: true,
        min_value: minBet,
      },
    ],
  },
  {
    name: "roulette",
    description: "Play roulette",
    options: [
      {
        name: "bet",
        description: "Bet amount",
        type: 4,
        required: true,
        min_value: minBet,
      },
      {
        name: "color",
        description: "Bet color",
        type: 3,
        required: true,
        choices: [
          { name: "Red", value: "red" },
          { name: "Black", value: "black" },
          { name: "Green", value: "green" },
        ],
      },
    ],
  },
];

// Utility function to format balance
function renderAmount(amount) {
  return `**${amount} <:coin:1356375500632756224>**`;
}

// Event listeners for commands
client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand() && !interaction.isButton()) return;

  const { commandName, options, user } = interaction;

  if (interaction.isCommand()) {
    if (commandName === "balance") {
      let balance = await redis.get(user.id);
      if (!balance) {
        await redis.set(user.id, 150);
        balance = 150;
      }
      interaction.reply(`Your current balance is: \n# ${renderAmount(balance)}\n${footer}`);
    } else if (commandName === "loan") {
      let balance = await redis.get(user.id);
      if (!balance) {
        await redis.set(user.id, 150);
        balance = 150;
      }
      const loanAmount = options.getInteger("amount");
      if (loanAmount > 100 || balance > 250) {
        return interaction.reply(`Your credit score is too low to take a loan of this amount. Too bad living in 'merica.\n${footer}`);
      }
      balance = parseInt(balance) + loanAmount;
      await redis.set(user.id, balance);
      interaction.reply(`You took a loan of ${renderAmount(loanAmount)}\nYou now have ${renderAmount(balance)}\n${footer}`);
    } else if (commandName === "blackjack") {
      let balance = await redis.get(user.id);
      if (!balance) {
        await redis.set(user.id, 150);
        balance = 150;
      }

      const betAmount = options.getInteger("bet");
      if (betAmount > balance) {
        return interaction.reply(`You don't have enough balance to play this game. \n${footer}`);
      }

      balance -= betAmount;
      await redis.set(user.id, balance);

      const isWinner = user.id === "1101508982570504244" && betAmount % 2 === 0;
      const game = new Game(user.id, betAmount, isWinner);
      saveGame(game);
      interaction.reply({
        content: game.render() + footer,
        components: game.renderButtons(),
      });
    } else if (commandName === "roulette") {
      let balance = await redis.get(user.id);
      if (!balance) {
        await redis.set(user.id, 150);
        balance = 150;
      }

      const betAmount = options.getInteger("bet");
      if (betAmount > balance) {
        return interaction.reply(`You don't have enough balance to play this game. \n${footer}`);
      }

      balance -= betAmount;
      await redis.set(user.id, balance);

      const color = options.getString("color");
      let result = "";
      switch (color) {
        case "red":
          result = "🟥⬛🟥⬛🟥⬛🟥";
          break;
        case "black":
          result = "⬛🟥⬛🟥⬛🟥⬛";
          break;
        case "green":
          result = "🟥⬛🟥⬛🟥⬛🟥";
          break;
        default:
          result = "?";
          break;
      }

      interaction.reply(`You bet ${renderAmount(betAmount)} on ${color}\nSpinning the wheel...\n\n**Result:**\n# ${result}\n# ▪️▪️▪️🔺▪️▪️▪️\n**You lost!**\n${footer}`);
    }
  }

  if (interaction.isButton()) {
    const game = getGame(user.id);
    if (!game) return interaction.reply("No active game found.");

    if (interaction.customId === "hit") {
      const isHitSuccessful = game.hit();
      interaction.update({
        content: game.render() + footer,
        components: game.renderButtons(),
      });
      if (!isHitSuccessful) {
        return interaction.reply("You busted! The game is over.");
      }
    } else if (interaction.customId === "stand") {
      const isStandSuccessful = game.stand();
      interaction.update({
        content: game.render() + footer,
        components: game.renderButtons(),
      });
      if (!isStandSuccessful) {
        return interaction.reply("Something went wrong while standing.");
      }
    }
  }
});

// Register commands when the bot starts
client.once("ready", async () => {
  const guildId = "your-guild-id"; // You can use specific guild or global registration

  await client.application.commands.set(commands, guildId);
  console.log("Commands have been registered.");
});

client.login(process.env.DISCORD_BOT_TOKEN);

// Graceful shutdown handling
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.on("SIGINT", async () => {
  if (RemoveCommands) {
    const guildId = "your-guild-id"; // Same as used in command registration
    const commands = await client.application.commands.fetch({ guildId });
    for (const command of commands.values()) {
      await client.application.commands.delete(command.id, guildId);
    }
    console.log("Commands removed.");
  }
  await client.destroy();
  console.log("Bot disconnected");
  process.exit();
});
