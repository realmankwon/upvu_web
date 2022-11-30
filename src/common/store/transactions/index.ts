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
