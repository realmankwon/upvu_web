import { Dispatch } from "redux";
import { utils } from "@hiveio/dhive";

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

const ops = utils.operationOrders;

export const ACCOUNT_OPERATION_GROUPS: Record<OperationGroup, number[]> = {
  transfers: [
    ops.transfer,
    ops.transfer_to_savings,
    ops.cancel_transfer_from_savings,
    ops.recurrent_transfer,
    ops.fill_recurrent_transfer,
    ops.proposal_pay,
  ],
  "market-orders": [
    ops.fill_convert_request,
    ops.fill_order,
    ops.fill_collateralized_convert_request,
    ops.limit_order_create2,
    ops.limit_order_create,
    ops.limit_order_cancel,
  ],
  interests: [ops.interest],
  "stake-operations": [
    ops.return_vesting_delegation,
    ops.withdraw_vesting,
    ops.transfer_to_vesting,
    ops.set_withdraw_vesting_route,
    ops.update_proposal_votes,
    ops.fill_vesting_withdraw,
    ops.account_witness_proxy,
    ops.delegate_vesting_shares,
  ],
  rewards: [
    ops.author_reward,
    ops.curation_reward,
    ops.producer_reward,
    ops.claim_reward_balance,
    ops.comment_benefactor_reward,
    ops.liquidity_reward,
    ops.comment_reward,
  ],
};

const ALL_ACCOUNT_OPERATIONS = [...Object.values(ACCOUNT_OPERATION_GROUPS)].reduce((acc, val) => acc.concat(val), []);

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

          // debugger;
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
