import { Dispatch } from "redux";
import { utils } from "@upvu/dsteem";

import {
  OperationGroup,
  Transaction,
  Transactions,
  Actions,
  ActionTypes,
  FetchAction,
  FetchedAction,
  FetchErrorAction,
  ResetAction,
} from "./types";

import { getAccountHistory } from "../../api/hive";
import { getSteemEngineAccountHistoryAsync } from "../../api/hive-engine";

export const initialState: Transactions = {
  list: [],
  loading: false,
  group: "",
};

export default (state: Transactions = initialState, action: Actions): Transactions => {
  switch (action.type) {
    case ActionTypes.FETCH: {
      return {
        ...state,
        group: action.group,
        list: [],
        loading: true,
      };
    }
    case ActionTypes.FETCHED: {
      return {
        ...state,
        list: action.transactions,
        loading: false,
      };
    }
    case ActionTypes.FETCH_ERROR: {
      return {
        ...state,
        list: [],
        loading: false,
      };
    }
    case ActionTypes.RESET: {
      return { ...initialState };
    }
    default:
      return state;
  }
};

/* Actions */
export const fetchTransactions =
  (username: string, steemengine: boolean, group: OperationGroup | "" = "", start: number = -1, limit: number = 100) =>
  async (dispatch: Dispatch) => {
    dispatch(fetchAct(group));

    const name = username.replace("@", "");
<<<<<<< HEAD
=======

    let filters: string;
    let transfers_filters: string = "transfer,transfer_to_savings,cancel_transfer_from_savings";
    let orders_filters: string =
      "fill_convert_request,fill_order,limit_order_create2,limit_order_create,limit_order_cancel";
    let interests_filters: string = "interest";
    let stake_filters: string =
      "return_vesting_delegation,withdraw_vesting,transfer_to_vesting,set_withdraw_vesting_route,update_proposal_votes,fill_vesting_withdraw,account_witness_proxy,delegate_vesting_shares";
    let rewards_filters: string =
      "author_reward,curation_reward,producer_reward,claim_reward_balance,comment_benefactor_reward,liquidity_reward";

    switch (group) {
      case "transfers":
        filters = transfers_filters;
        break;
      case "market-orders":
        filters = orders_filters;
        break;
      case "interests":
        filters = interests_filters;
        break;
      case "stake-operations":
        filters = stake_filters;
        break;
      case "rewards":
        filters = rewards_filters;
        break;
      default:
        filters = `${transfers_filters},${orders_filters},${interests_filters},${stake_filters},${rewards_filters}`; // all
    }
>>>>>>> e7a4ba86d23d853f2d3dbe027b6e0c6caba07334

    try {
      let num = start;

      if (steemengine) {
        let r = await getSteemEngineAccountHistoryAsync(name, "", start, limit);

        const mapped: Transaction[] = r.data.map((x: any) => ({
          num: num++,
          type: x.operation,
          timestamp: new Date(x.timestamp * 1000).toISOString().replace("T", " ").split(".")[0],
          trx_id: x.transactionId,
          transaction: x,
        }));

        const transactions: Transaction[] = mapped
          .filter((x) => x !== null)
          .sort((a: any, b: any) => +new Date(b.timestamp) - +new Date(a.timestamp));
        dispatch(fetchedAct(transactions));
      } else {
        getAccountHistory(name, start, limit).then((r) => {
          const mapped: Transaction[] = r.map((x: any): Transaction[] | null => {
            const { op } = x[1];
            const { timestamp, trx_id } = x[1];
            const opName = op[0];
            const opData = op[1];

            return {
              num: x[0],
              type: opName,
              timestamp,
              trx_id,
              ...opData,
            };
          });

          const transactions: Transaction[] = mapped.filter((x) => x !== null).sort((a: any, b: any) => b.num - a.num);

          dispatch(fetchedAct(transactions));
        });
      }
    } catch (e) {
      console.log(e);
      console.log("catch");
      dispatch(fetchErrorAct());
    }
  };

export const resetTransactions = () => (dispatch: Dispatch) => {
  dispatch(resetAct());
};

/* Action Creators */
export const fetchAct = (group: OperationGroup | ""): FetchAction => {
  return {
    type: ActionTypes.FETCH,
    group,
  };
};

export const fetchedAct = (transactions: Transaction[]): FetchedAction => {
  return {
    type: ActionTypes.FETCHED,
    transactions,
  };
};

export const fetchErrorAct = (): FetchErrorAction => {
  return {
    type: ActionTypes.FETCH_ERROR,
  };
};

export const resetAct = (): ResetAction => {
  return {
    type: ActionTypes.RESET,
  };
};
