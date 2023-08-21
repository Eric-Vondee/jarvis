import { Telegraf } from "telegraf";
import config from "../config/index";
import { initMessage } from "./utils/messages";
import { filterToken } from "./utils";

const { apiKey } = config.telegram;
const bot = new Telegraf(apiKey);

bot.start((ctx) => {
  ctx.reply(initMessage);
});

bot.help((ctx) => {
  ctx.reply(initMessage);
});

bot.command("search", async (ctx) => {
  const commandList = [{ text: "Search Token", callback_data: "search" }];
  const options = {
    reply_markup: {
      inline_keyboard: [commandList],
    },
  };
  ctx.sendMessage("Welcome! Please select a command:", options);
});

let chain = "";
bot.on("text", async (ctx) => {
  console.log(ctx);
  const tokenAddress = ctx.update.message.text;
  const regex = /^0x[a-fA-F0-9]{40}$/;
  if (!regex.test(tokenAddress)) {
    return ctx.reply(`Error: Invalid checksum/contract address`);
  }
  try {
    const token: any = await filterToken(chain, tokenAddress, ctx);
    if (!token.status) {
      ctx.reply(token.message);
      return;
    }
    const output = `
  Blockchain: ${token.blockchain.toUpperCase()} \n
  Name: ${token.name}, \n 
  Symbol: ${token.symbol}, \n
  Pool symbol: ${token.symbol}/${token.poolSymbol}, \n
  Holders: ${token.holders}, \n
  Circulating Supply: ${token.circulatingSupply}, \n
  Total Supply: ${token.totalSupply}, \n
  Dext Score: ${token.dextScore}, \n
  Daily Transactions: ${token.dailyTxnCount}, \n
  Daily Volume: $${token.dailyVolume}, \n
  Total trades: ${token.totalPoolTxnCount}, \n
  Total volume traded: $${token.totalTradeAmount}, \n
  Total Volume(Buy): $${token.totalBuyAmount}, \n
  Total Volume(Sell): $${token.totalSellAmount}, \n
  Audited: ${token.audited}, \n
  Audited Date: ${token.auditedDate}, \n
  URL: ${token.poolUrl}, \n
  NOTE: This isn't a financial advise, DYOR.
  WAGMI!!!
  `;
    return ctx.reply(output);
  } catch (e) {
    if (e instanceof Error) {
      console.log(e);
    }
  }
});
bot.on("callback_query", async (ctx) => {
  //@ts-ignore
  const functionData = ctx.update.callback_query.data;

  switch (functionData) {
    case "search":
      const defaultValuesRow = [
        { text: "BSC", callback_data: "default:bsc" },
        { text: "Celo", callback_data: "default:celo" },
        { text: "Ethereum", callback_data: "default:ether" },
        { text: "Polygon", callback_data: "default:polygon" },
      ];
      const options = {
        reply_markup: {
          inline_keyboard: [defaultValuesRow],
        },
      };
      ctx.sendMessage("Please select the blockchain:", options);
      break;
    case "default:bsc":
    case "default:celo":
    case "default:ether":
    case "default:polygon":
      const selectedValue = functionData.split(":")[1];
      chain = selectedValue;
      ctx.sendMessage(`You selected: ${selectedValue} chain`);
      ctx.reply("Please input token address");
      break;
    default:
      ctx.sendMessage("Invalid option. Please select a valid option.");
      break;
  }
});

bot.launch();
console.log("Running Jarvis");
console.log("Available networks: Ethereum - Matic - Celo - Bsc");

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
