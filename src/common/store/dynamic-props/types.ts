export interface DynamicProps {
  steemPerMVests: number;
  base: number;
  quote: number;
  fundRewardBalance: number;
  fundRecentClaims: number;
  sbdPrintRate: number;
  sbdInterestRate: number;
  headBlock: number;
  totalVestingFund: number;
  totalVestingShares: number;
  virtualSupply: number;
  vestingRewardPercent: number;
}

export type State = DynamicProps;

export enum ActionTypes {
  FETCHED = "@dynamic-props/FETCHED",
}

export interface FetchedAction {
  type: ActionTypes.FETCHED;
  props: DynamicProps;
}

export type Actions = FetchedAction; // |..|..æ
