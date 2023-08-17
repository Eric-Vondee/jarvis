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
  const command = "/search";
  const message = ctx.message.text;
  const errorMessage = "Command used wrongly, Use /help for guidance";
  const params = message
    .replace(command, "")
    .trim()
    .split(" ")
    .reduce((obj: any, param) => {
      const [key, value] = param.split("=");
      if (key) {
        obj[key] = value;
      }
      return obj;
    }, {});
  const regex = /^0x[a-fA-F0-9]{40}$/;
  if (!regex.test(params.tokenAddress)) {
    return ctx.reply(`Error: Invalid checksum/contract address`);
  }
  try {
    const token = await filterToken(params.network, params.tokenAddress);
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

bot.launch();
console.log("Running Jarvis");
console.log("Available networks: Ethereum - Matic - Celo - Bsc");

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
