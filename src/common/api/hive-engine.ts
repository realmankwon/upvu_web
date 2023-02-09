import axios from "axios";
import SteemEngineToken from "../helper/steem-engine-wallet";
import { TransactionConfirmation } from "@upvu/dsteem";
import { broadcastPostingJSON } from "./operations";

interface TokenBalance {
  symbol: string;
  balance: string;
  stake: string;
  pendingUnstake: string;
  delegationsIn: string;
  delegationsOut: string;
  pendingUndelegations: string;
}

interface Token {
  issuer: string;
  symbol: string;
  name: string;
  metadata: string;
  precision: number;
  maxSupply: string;
  supply: string;
  circulatingSupply: string;
  stakingEnabled: boolean;
  unstakingCooldown: number;
  delegationEnabled: boolean;
  undelegationCooldown: number;
  numberTransactions: number;
  totalStaked: string;
}

interface TokenMetadata {
  desc: string;
  url: string;
  icon: string;
}

export interface TokenStatus {
  symbol: string;
  pending_token: number;
  precision: number;
}

const STEEM_ENGINE_RPC_URL = "https://api.steem-engine.net/rpc/contracts";

export const getTokenBalances = (account: string): Promise<TokenBalance[]> => {
  const data = {
    jsonrpc: "2.0",
    method: "find",
    params: {
      contract: "tokens",
      table: "balances",
      query: {
        account: account,
      },
    },
    id: 1,
  };

  return axios
    .post(STEEM_ENGINE_RPC_URL, data, {
      headers: { "Content-type": "application/json" },
    })
    .then((r) => r.data.result)
    .catch((e) => {
      return [];
    });
};

const getTokens = (tokens: string[]): Promise<Token[]> => {
  const data = {
    jsonrpc: "2.0",
    method: "find",
    params: {
      contract: "tokens",
      table: "tokens",
      query: {
        symbol: { $in: tokens },
      },
    },
    id: 2,
  };

  return axios
    .post(STEEM_ENGINE_RPC_URL, data, {
      headers: { "Content-type": "application/json" },
    })
    .then((r) => r.data.result)
    .catch((e) => {
      return [];
    });
};

export const getSteemEngineTokenBalances = async (account: string): Promise<SteemEngineToken[]> => {
  // commented just to try removing the non-existing unknowing SteemEngineTokenBalance type
  // ): Promise<SteemEngineTokenBalance[]> => {
  const balances = await getTokenBalances(account);
  const tokens = await getTokens(balances.map((t) => t.symbol));

  return balances.map((balance) => {
    const token = tokens.find((t) => t.symbol == balance.symbol);
    const tokenMetadata = token && (JSON.parse(token!.metadata) as TokenMetadata);

    return new SteemEngineToken({
      ...balance,
      ...token,
      ...tokenMetadata,
    } as any);
  });
};

export const getUnclaimedRewards = async (account: string): Promise<TokenStatus[]> => {
  return (
    axios
      .get(`https://scot-api.steem-engine.net/@${account}?steem=1`)
      .then((r) => r.data)
      .then((r) => Object.values(r))
      .then((r) => r.filter((t) => (t as TokenStatus).pending_token > 0)) as any
  ).catch(() => {
    return [];
  });
};

export const claimRewards = async (account: string, tokens: string[]): Promise<TransactionConfirmation> => {
  const json = JSON.stringify(
    tokens.map((r) => {
      return { symbol: r };
    })
  );

  return broadcastPostingJSON(account, "scot_claim_token", json);
};

export const stakeTokens = async (account: string, token: string, amount: string): Promise<TransactionConfirmation> => {
  const json = JSON.stringify({
    contractName: "tokens",
    contractAction: "stake",
    contractPayload: {
      symbol: token,
      to: account,
      quantity: amount,
    },
  });

  return broadcastPostingJSON(account, "ssc-mainnet1", json);
};

export const getSteemEngineAccountHistoryAsync = async (
  account: string,
  tokenSymbol: string = "",
  start: number = 0,
  limit: number = 100
): Promise<any> => {
  start = start;
  tokenSymbol = "";
  return axios({
    url: `https://api.steem-engine.net/history/accountHistory`,
    method: "GET",
    params: {
      account,
      limit: limit,
      offset: start,
      type: "user",
      // symbol: tokenSymbol,
      v: new Date().getTime(),
    },
  });
};
