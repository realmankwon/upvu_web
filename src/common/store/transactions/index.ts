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
    // debugger;
    // let filters: any[] = [];
    // switch (group) {
    //   case "transfers":
    //     filters = utils.makeBitMaskFilter(ACCOUNT_OPERATION_GROUPS["transfers"]);
    //     break;
    //   case "market-orders":
    //     filters = utils.makeBitMaskFilter(ACCOUNT_OPERATION_GROUPS["market-orders"]);
    //     break;
    //   case "interests":
    //     filters = utils.makeBitMaskFilter(ACCOUNT_OPERATION_GROUPS["interests"]);
    //     break;
    //   case "stake-operations":
    //     filters = utils.makeBitMaskFilter(ACCOUNT_OPERATION_GROUPS["stake-operations"]);
    //     break;
    //   case "rewards":
    //     filters = utils.makeBitMaskFilter(ACCOUNT_OPERATION_GROUPS["rewards"]);
    //     break;
    //   default:
    //     filters = utils.makeBitMaskFilter(ALL_ACCOUNT_OPERATIONS); // all
    // }

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

    try {
      if (steemengine) {
        let r = await getSteemEngineAccountHistoryAsync(name, "", start, limit);

        // const mapped: Transaction[] = r.data.result.rows.map((x: any) => ({
        //   num: x[0],
        //   type: x[1].op[0],
        //   timestamp: x[1].timestamp,
        //   trx_id: x[1].trx_id,
        //   ...x[1].op[1],
        // }));
        const mapped: Transaction[] = r.data.map((x: any) => ({
          num: x.blockNumber,
          type: x.operation,
          timestamp: new Date(x.timestamp * 1000).toISOString().replace("T", " ").split(".")[0],
          trx_id: x.transactionId,
          ...x,
        }));

        // const transactions: Transaction[] = mapped.filter((x) => x !== null).sort((a: any, b: any) => b.num - a.num);
        const transactions: Transaction[] = mapped
          .filter((x) => x !== null)
          .sort((a: any, b: any) => +new Date(b.timestamp) - +new Date(a.timestamp));
        dispatch(fetchedAct(transactions));
      } else {
        let r = await getAccountHistory(name, filters, start, limit);

        // const mapped: Transaction[] = r.data.result.rows.map((x: any) => ({
        //   num: x[0],
        //   type: x[1].op[0],
        //   timestamp: x[1].timestamp,
        //   trx_id: x[1].trx_id,
        //   ...x[1].op[1],
        // }));
        const mapped: Transaction[] = r.data.result.rows.map((x: any) => ({
          num: x[0],
          type: x[6][0],
          timestamp: new Date(x[1] * 1000).toISOString().replace("T", " ").split(".")[0],
          trx_id: x[2],
          ...x[6][1],
        }));

        // const transactions: Transaction[] = mapped.filter((x) => x !== null).sort((a: any, b: any) => b.num - a.num);
        const transactions: Transaction[] = mapped
          .filter((x) => x !== null)
          .sort((a: any, b: any) => +new Date(b.timestamp) - +new Date(a.timestamp));
        dispatch(fetchedAct(transactions));
      }
    } catch (e) {
      console.log(e);
      console.log("catch");
      dispatch(fetchErrorAct());
    }

    // getAccountHistory(name, filters, start, limit)
    //   .then((r) => {
    //     const mapped: Transaction[] = r.map((x: any): Transaction[] | null => {
    //       const { op } = x[1];
    //       const { timestamp, trx_id } = x[1];
    //       const opName = op[0];
    //       const opData = op[1];

    //       return {
    //         num: x[0],
    //         type: opName,
    //         timestamp,
    //         trx_id,
    //         ...opData,
    //       };
    //     });

    //     const transactions: Transaction[] = mapped
    //       .filter((x) => x !== null)
    //       .sort((a: any, b: any) => b.num - a.num);

    //     dispatch(fetchedAct(transactions));
    //   })
    //   .catch((e) => {
    //     console.log(e);
    //     console.log("catch");
    //     dispatch(fetchErrorAct());
    //   });
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
