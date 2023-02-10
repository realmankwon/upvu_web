import { Account } from "../store/accounts/types";
import { DynamicProps } from "../store/dynamic-props/types";

import parseAsset from "./parse-asset";
import { vestsToSp } from "./vesting";
import isEmptyDate from "./is-empty-date";
import parseDate from "./parse-date";

export default class SteemWallet {
  public balance: number = 0;
  public savingBalance: number = 0;

  public sbdBalance: number = 0;
  public savingBalanceSbd: number = 0;

  public rewardSteemBalance: number = 0;
  public rewardSbdBalance: number = 0;
  public rewardVestingSteem: number = 0;
  public hasUnclaimedRewards: boolean = false;

  public isPoweringDown: boolean = false;
  public nextVestingWithdrawalDate: Date = new Date();
  public nextVestingSharesWithdrawal: number = 0;
  public nextVestingSharesWithdrawalSteem: number = 0;

  public vestingShares: number = 0;
  public vestingSharesDelegated: number = 0;
  public vestingSharesReceived: number = 0;
  public vestingSharesTotal: number = 0;
  public vestingSharesAvailable: number = 0;

  public totalSteem: number = 0;
  public totalSbd: number = 0;
  public totalSp: number = 0;

  public estimatedValue: number = 0;

  constructor(account: Account, dynamicProps: DynamicProps, convertingSBD: number = 0) {
    const { steemPerMVests, base, quote } = dynamicProps;
    const pricePerSteem = base / quote;

    if (!account.__loaded) {
      return;
    }

    this.balance = parseAsset(account.balance).amount;
    this.savingBalance = parseAsset(account.savings_balance).amount;

    this.sbdBalance = parseAsset(account.sbd_balance).amount;
    this.savingBalanceSbd = parseAsset(account.savings_sbd_balance).amount;

    this.rewardSteemBalance = parseAsset(account.reward_steem_balance).amount;
    this.rewardSbdBalance = parseAsset(account.reward_sbd_balance).amount;
    this.rewardVestingSteem = parseAsset(account.reward_vesting_steem).amount;
    this.hasUnclaimedRewards = this.rewardSteemBalance > 0 || this.rewardSbdBalance > 0 || this.rewardVestingSteem > 0;

    this.isPoweringDown = !isEmptyDate(account.next_vesting_withdrawal);

    this.nextVestingWithdrawalDate = parseDate(account.next_vesting_withdrawal);

    this.nextVestingSharesWithdrawal = this.isPoweringDown
      ? Math.min(
          parseAsset(account.vesting_withdraw_rate).amount,
          (Number(account.to_withdraw) - Number(account.withdrawn)) / 1e6
        )
      : 0;
    this.nextVestingSharesWithdrawalSteem = this.isPoweringDown
      ? vestsToSp(this.nextVestingSharesWithdrawal, steemPerMVests)
      : 0;

    this.vestingShares = parseAsset(account.vesting_shares).amount;
    this.vestingSharesDelegated = parseAsset(account.delegated_vesting_shares).amount;
    this.vestingSharesReceived = parseAsset(account.received_vesting_shares).amount;
    this.vestingSharesTotal =
      this.vestingShares - this.vestingSharesDelegated + this.vestingSharesReceived - this.nextVestingSharesWithdrawal;
    this.vestingSharesAvailable = this.isPoweringDown
      ? this.vestingShares -
        (Number(account.to_withdraw) - Number(account.withdrawn)) / 1e6 -
        this.vestingSharesDelegated
      : this.vestingShares - this.vestingSharesDelegated;

    this.totalSteem = vestsToSp(this.vestingShares, steemPerMVests) + this.balance + this.savingBalance;
    this.totalSp = vestsToSp(this.vestingShares, steemPerMVests);
    this.totalSbd = this.sbdBalance + this.savingBalanceSbd + convertingSBD;

    this.estimatedValue = this.totalSteem * pricePerSteem + this.totalSbd;
  }
}
