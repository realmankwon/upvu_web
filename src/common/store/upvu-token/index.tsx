import { Dispatch } from "redux";

import {
  UpvuToken,
  UpvuTransaction,
  Actions,
  ActionTypes,
  ResetAction,
  FetchAction,
  FetchedAction,
  ErrorAction,
} from "./types";

import { upvuTokenBalance, upvuTokenTransactions } from "../../api/private-api";

export const initialState: UpvuToken = {
  upvuToken: "0.000",
  transactions: [],
  loading: false,
  filter: 0,
};

export default (state: UpvuToken = initialState, action: Actions): UpvuToken => {
  switch (action.type) {
    case ActionTypes.FETCH: {
      return { ...state, transactions: [], loading: true };
    }
    case ActionTypes.FETCHED: {
      return {
        ...state,
        upvuToken: action.upvuToken,
        transactions: action.transactions || [...state.transactions],
        loading: false,
      };
    }
    case ActionTypes.ERROR: {
      return { ...state, loading: false };
    }
    case ActionTypes.RESET: {
      return { ...initialState };
    }
    default:
      return state;
  }
};

/* Actions */

export const fetchUpvuToken = (username: string) => async (dispatch: Dispatch) => {
  dispatch(fetchAct());

  const name = username.replace("@", "");

  let upvuToken;
  try {
    upvuToken = await upvuTokenBalance(name);
  } catch (e) {
    dispatch(errorAct());
    return;
  }

  let transactions;
  try {
    transactions = await upvuTokenTransactions(name);
  } catch (e) {
    dispatch(errorAct());
    return;
  }

  dispatch(fetchedAct(upvuToken, transactions));
};

export const resetUpvuToken = () => (dispatch: Dispatch) => {
  dispatch(resetAct());
};

/* Action Creators */
export const resetAct = (): ResetAction => {
  return {
    type: ActionTypes.RESET,
  };
};

export const errorAct = (): ErrorAction => {
  return {
    type: ActionTypes.ERROR,
  };
};

export const fetchAct = (): FetchAction => {
  return {
    type: ActionTypes.FETCH,
  };
};

export const fetchedAct = (upvuToken: string, transactions?: UpvuTransaction[]): FetchedAction => {
  return {
    type: ActionTypes.FETCHED,
    upvuToken,
    transactions,
  };
};
