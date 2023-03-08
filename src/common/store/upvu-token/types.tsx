export type TransactionType = "issue" | "transfer";

export interface UpvuTransaction {
  account: string;
  transaction_id: string;
  from: string;
  to: string;
  type: TransactionType;
  amount: string;
  after_amount: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpvuToken {
  upvuToken: string;
  transactions: UpvuTransaction[];
  loading: boolean;
  filter: number;
}

export enum ActionTypes {
  ERROR = "@upvu-token/ERROR",
  FETCH = "@upvu-token/FETCH",
  FETCHED = "@upvu-token/FETCHED",
  RESET = "@upvu-token/RESET",
}

export interface FetchedAction {
  type: ActionTypes.FETCHED;
  upvuToken: string;
  transactions?: UpvuTransaction[];
}

export interface ErrorAction {
  type: ActionTypes.ERROR;
}

export interface FetchAction {
  type: ActionTypes.FETCH;
}

export interface ResetAction {
  type: ActionTypes.RESET;
}

export type Actions = FetchedAction | ErrorAction | FetchAction | ResetAction;
