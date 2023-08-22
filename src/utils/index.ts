import config from "../../config/index";
import fetch from "node-fetch";

export const filterToken = async (
  blockchain: string,
  tokenAddress: string,
  ctx: any,
) => {
  const date = new Date();
  const currentDate =
    date.getFullYear() +
    "-" +
    ("0" + (date.getMonth() + 1)) +
    "-" +
    ("0" + date.getDate()).slice(-2);
  const queryPath = `${config.dext.baseUrl}/v1/token?chain=${blockchain}&address=${tokenAddress}`;
  const response = await fetch(queryPath, {
    method: "get",
    timeout: 3600000,
    headers: {
      "X-API-KEY": config.dext.apiKey,
    },
  });

  let data = await response.json();
  let tokenInfo = data.data;
  if (tokenInfo == null)
    return { status: false, message: "Error:Token doesn't exist" };
  let blockchainInfo = getBlockchainParams(blockchain);
  if (tokenInfo.pairs.length == 0)
    return {
      status: false,
      message: "Error:No liquidity pool associated with token",
    };
  let splitPairAddresses = tokenInfo.pairs[0].address.split("-");
  let pairAddress = splitPairAddresses[0];
  const { dailyTxnCount, dailyVolume } = await getDailyPoolInfo(
    pairAddress,
    blockchainInfo.network,
    currentDate,
  );
  const { totalPoolTxns, totalTradeAmount, totalBuyAmount, totalSellAmount } =
    await getPoolInfo(pairAddress, blockchainInfo.network);
  let convertAuditedDate = new Date(tokenInfo.audit.date);
  let auditedDate =
    convertAuditedDate.getFullYear() +
    "-" +
    ("0" + (convertAuditedDate.getMonth() + 1)) +
    "-" +
    ("0" + convertAuditedDate.getDate()).slice(-2);
  return {
    status: true,
    message: "",
    blockchain: blockchain,
    name: tokenInfo.name,
    symbol: tokenInfo.symbol,
    poolSymbol: tokenInfo.pairs[0].tokenRef.symbol,
    description: tokenInfo.info.description,
    holders: tokenInfo.metrics.holders,
    circulatingSupply:
      tokenInfo.metrics.circulatingSupply == undefined
        ? "unknown"
        : tokenInfo.metrics.circulatingSupply,
    totalSupply: tokenInfo.totalSupply,
    audited:
      tokenInfo.audit.codeVerified == undefined
        ? false
        : tokenInfo.audit.codeVerified,
    auditedDate: !tokenInfo.audit.date ? "" : auditedDate,
    dextScore: tokenInfo.pairs[0].dextScore,
    dailyTxnCount: dailyTxnCount,
    dailyVolume: dailyVolume,
    totalPoolTxnCount: totalPoolTxns,
    totalTradeAmount: totalTradeAmount,
    totalBuyAmount: totalBuyAmount,
    totalSellAmount: totalSellAmount,
    poolUrl: `${blockchainInfo.explorer}/${pairAddress}`,
  };
};

const getDailyPoolInfo = async (
  pairAddress: string,
  blockchain: string,
  date: string,
) => {
  const query = `
    query totalPoolVolume($pairAddress: String!, $date:ISO8601DateTime!){
      ethereum(network: ${blockchain}){
        dexTrades(
          date:{is:$date}
          smartContractAddress: {is: $pairAddress}
        ){
          count
          tradeAmount(in: USD)
        }
      }
    }
    `;
  const variables = {
    pairAddress: pairAddress,
    date: date,
  };
  const response = await fetch(config.bitquery.baseUrl, {
    method: "post",
    timeout: 3600000,
    headers: {
      "X-API-KEY": config.bitquery.apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });
  const data = await response.json();
  const poolInfo = data.data.ethereum.dexTrades[0];
  return {
    dailyTxnCount: poolInfo.count,
    dailyVolume: poolInfo.tradeAmount,
  };
};

const getPoolInfo = async (pairAddress: string, blockchain: string) => {
  const query = `
  query totalPoolVolume($pairAddress:String!){
    ethereum(network: ${blockchain}){
      dexTrades(
        smartContractAddress:{is:$pairAddress}
      ){
        count
        tradeAmount(in: USD)
        buyAmount(in: USD)
        sellAmount(in: USD)
      }
    }
  }
  `;
  const variables = {
    pairAddress: pairAddress,
  };
  const response = await fetch(config.bitquery.baseUrl, {
    method: "post",
    timeout: 3600000,
    headers: {
      "X-API-KEY": config.bitquery.apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });
  const data = await response.json();
  const poolInfo = data.data.ethereum.dexTrades[0];
  return {
    totalPoolTxns: poolInfo.count,
    totalTradeAmount: poolInfo.tradeAmount,
    totalBuyAmount: poolInfo.buyAmount,
    totalSellAmount: poolInfo.sellAmount,
  };
};

const getBlockchainParams = (network: string) => {
  let params = {
    network: "",
    explorer: "",
  };
  switch (network) {
    case "celo":
      params.network = "celo_mainnet";
      params.explorer = "https://celoscan.io/address";
      break;
    case "bsc":
      params.network = "bsc";
      params.explorer = "https://bscscan.com/address";
      break;
    case "polygon":
      params.network = "matic";
      params.explorer = "https://polygonscan.com/address";
      break;
    case "ether":
      params.network = "ethereum";
      params.explorer = "https://etherscan.io/address";
    default:
      break;
  }
  return params;
};
