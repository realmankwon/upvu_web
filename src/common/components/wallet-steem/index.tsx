import React from "react";

import { History } from "history";

import { AssetSymbol } from "@upvu/dsteem";

import { Global } from "../../store/global/types";
import { Account } from "../../store/accounts/types";
import { DynamicProps } from "../../store/dynamic-props/types";
import { OperationGroup, Transactions } from "../../store/transactions/types";
import { ActiveUser } from "../../store/active-user/types";

import BaseComponent from "../base";
import Tooltip from "../tooltip";
import FormattedCurrency from "../formatted-currency";
import TransactionList from "../transactions";
import DelegatedVesting from "../delegated-vesting";
import ReceivedVesting from "../received-vesting";
import ConversionRequests from "../converts";
import SavingsWithdraw from "../savings-withdraw";
import OpenOrdersList from "../open-orders-list";

import DropDown from "../dropdown";
import Transfer, { TransferMode, TransferAsset } from "../transfer";
import { error, success } from "../feedback";
import WalletMenu from "../wallet-menu";
import WithdrawRoutes from "../withdraw-routes";

import SteemWallet from "../../helper/steem-wallet";

import { vestsToSp } from "../../helper/vesting";

import { getAccount, getConversionRequests, getSavingsWithdrawFrom, getOpenOrder } from "../../api/steem";

import { claimRewardBalance, formatError } from "../../api/operations";

import formattedNumber from "../../util/formatted-number";

import parseAsset from "../../helper/parse-asset";

import { _t } from "../../i18n";

import { plusCircle } from "../../img/svg";
import { dayDiff, dateToFullRelative } from "../../helper/parse-date";
import { UpvuToken } from "../../store/upvu-token/types";

interface Props {
  history: History;
  global: Global;
  dynamicProps: DynamicProps;
  activeUser: ActiveUser | null;
  transactions: Transactions;
  account: Account;
  signingKey: string;
  upvuToken: UpvuToken;
  addAccount: (data: Account) => void;
  updateActiveUser: (data?: Account) => void;
  setSigningKey: (key: string) => void;
  fetchTransactions: (username: string, steemengine: boolean, group?: OperationGroup | "") => void;
  fetchPoints: (username: string, type?: number) => void;
  fetchUpvuToken: (username: string) => void;
  updateWalletValues: () => void;
  steemengine: boolean;
}

interface State {
  delegatedList: boolean;
  convertList: boolean;
  receivedList: boolean;
  savingsWithdrawList: boolean;
  openOrdersList: boolean;
  tokenType: AssetSymbol;
  claiming: boolean;
  claimed: boolean;
  transfer: boolean;
  withdrawRoutes: boolean;
  transferMode: null | TransferMode;
  transferAsset: null | TransferAsset;
  converting: number;
  withdrawSavings: { sbd: string | number; steem: string | number };
  openOrders: { sbd: string | number; steem: string | number };
  aprs: { sbd: string | number; hp: string | number };
}

export class WalletSteem extends BaseComponent<Props, State> {
  state: State = {
    delegatedList: false,
    receivedList: false,
    convertList: false,
    savingsWithdrawList: false,
    openOrdersList: false,
    tokenType: "SBD",
    claiming: false,
    claimed: false,
    transfer: false,
    withdrawRoutes: false,
    transferMode: null,
    transferAsset: null,
    converting: 0,
    withdrawSavings: { sbd: 0, steem: 0 },
    openOrders: { sbd: 0, steem: 0 },
    aprs: { sbd: 0, hp: 0 },
  };

  componentDidMount() {
    this.fetchConvertingAmount();
    this.fetchWithdrawFromSavings();
    this.getOrders();
  }

  getCurrentHpApr = (gprops: DynamicProps) => {
    // The inflation was set to 9.5% at block 7m
    const initialInflationRate = 9.5;
    const initialBlock = 7000000;

    // It decreases by 0.01% every 250k blocks
    const decreaseRate = 250000;
    const decreasePercentPerIncrement = 0.01;

    // How many increments have happened since block 7m?
    const headBlock = gprops.headBlock;
    const deltaBlocks = headBlock - initialBlock;
    const decreaseIncrements = deltaBlocks / decreaseRate;

    // Current inflation rate
    let currentInflationRate = initialInflationRate - decreaseIncrements * decreasePercentPerIncrement;

    // Cannot go lower than 0.95%
    if (currentInflationRate < 0.95) {
      currentInflationRate = 0.95;
    }

    // Now lets calculate the "APR"
    const vestingRewardPercent = gprops.vestingRewardPercent / 10000;
    const virtualSupply = gprops.virtualSupply;
    const totalVestingFunds = gprops.totalVestingFund;
    return (virtualSupply * currentInflationRate * vestingRewardPercent) / totalVestingFunds;
  };

  fetchConvertingAmount = async () => {
    const { account, dynamicProps } = this.props;
    const { aprs } = this.state;
    const { sbdInterestRate } = dynamicProps;

    let hp = this.getCurrentHpApr(dynamicProps).toFixed(3);
    this.setState({ aprs: { ...aprs, sbd: sbdInterestRate / 100, hp } });

    const crd = await getConversionRequests(account.name);
    if (crd.length === 0) {
      return;
    }

    let converting = 0;
    crd.forEach((x) => {
      converting += parseAsset(x.amount).amount;
    });
    this.stateSet({ converting });
  };

  fetchWithdrawFromSavings = async () => {
    const { account } = this.props;

    const swf = await getSavingsWithdrawFrom(account.name);
    if (swf.length === 0) {
      return;
    }

    let withdrawSavings = { sbd: 0, steem: 0 };
    swf.forEach((x) => {
      const aa = x.amount;
      if (aa.includes("STEEM")) {
        withdrawSavings.steem += parseAsset(x.amount).amount;
      } else {
        withdrawSavings.sbd += parseAsset(x.amount).amount;
      }
    });

    this.stateSet({ withdrawSavings });
  };

  getOrders = async () => {
    const { account } = this.props;

    const oo = await getOpenOrder(account.name);
    if (oo.length === 0) {
      return;
    }

    let openOrders = { steem: 0, sbd: 0 };
    oo.forEach((x) => {
      const bb = x.sell_price.base;
      if (bb.includes("STEEM")) {
        openOrders.steem += parseAsset(bb).amount;
      } else {
        openOrders.sbd += parseAsset(bb).amount;
      }
    });

    this.stateSet({ openOrders });
  };

  toggleDelegatedList = () => {
    const { delegatedList } = this.state;
    this.stateSet({ delegatedList: !delegatedList });
  };

  toggleConvertList = () => {
    const { convertList } = this.state;
    this.stateSet({ convertList: !convertList });
  };

  toggleSavingsWithdrawList = (tType: AssetSymbol) => {
    const { savingsWithdrawList } = this.state;
    this.stateSet({
      savingsWithdrawList: !savingsWithdrawList,
      tokenType: tType,
    });
  };

  toggleOpenOrdersList = (tType: AssetSymbol) => {
    const { openOrdersList } = this.state;
    this.stateSet({ openOrdersList: !openOrdersList, tokenType: tType });
  };

  toggleReceivedList = () => {
    const { receivedList } = this.state;
    this.stateSet({ receivedList: !receivedList });
  };

  toggleWithdrawRoutes = () => {
    const { withdrawRoutes } = this.state;
    this.stateSet({ withdrawRoutes: !withdrawRoutes });
  };

  toggleClaimInterest = () => {
    this.openTransferDialog("claim-interest", "SBD");
  };

  claimRewardBalance = () => {
    const { activeUser, updateActiveUser } = this.props;
    const { claiming } = this.state;

    if (claiming || !activeUser) {
      return;
    }

    this.stateSet({ claiming: true });

    return getAccount(activeUser?.username!)
      .then((account) => {
        const {
          reward_steem_balance: steemBalance = account.reward_steem_balance,
          reward_sbd_balance: sbdBalance = account.reward_sbd_balance,
          reward_vesting_balance: vestingBalance,
        } = account;

        return claimRewardBalance(activeUser?.username!, steemBalance!, sbdBalance!, vestingBalance!);
      })
      .then(() => getAccount(activeUser.username))
      .then((account) => {
        success(_t("wallet.claim-reward-balance-ok"));
        this.stateSet({ claiming: false, claimed: true });
        updateActiveUser(account);
      })
      .catch((err) => {
        error(formatError(err));
        this.stateSet({ claiming: false });
      });
  };

  openTransferDialog = (mode: TransferMode, asset: TransferAsset) => {
    this.stateSet({ transfer: true, transferMode: mode, transferAsset: asset });
  };

  closeTransferDialog = () => {
    this.stateSet({ transfer: false, transferMode: null, transferAsset: null });
  };

  render() {
    const { global, dynamicProps, account, activeUser, history } = this.props;
    const {
      claiming,
      claimed,
      transfer,
      transferAsset,
      transferMode,
      converting,
      withdrawSavings,
      aprs: { sbd, hp },
      openOrders,
      tokenType,
    } = this.state;

    if (!account.__loaded) {
      return null;
    }

    const { steemPerMVests } = dynamicProps;
    const isMyPage = activeUser && activeUser.username === account.name;
    const w = new SteemWallet(account, dynamicProps, converting);

    const lastIPaymentRelative =
      account.savings_sbd_last_interest_payment == "1970-01-01T00:00:00"
        ? null
        : dateToFullRelative(account.savings_sbd_last_interest_payment);
    const lastIPaymentDiff = dayDiff(
      account.savings_sbd_last_interest_payment == "1970-01-01T00:00:00"
        ? account.savings_sbd_seconds_last_update
        : account.savings_sbd_last_interest_payment
    );
    const interestAmount = (Number(sbd) / 100) * (w.savingBalanceSbd / (12 * 30)) * lastIPaymentDiff;
    const estimatedInterest = formattedNumber(interestAmount, { suffix: "$" });
    const remainingDays = 30 - lastIPaymentDiff;

    const totalSP = formattedNumber(vestsToSp(w.vestingShares, steemPerMVests), {
      suffix: "SP",
    });
    const totalDelegated = formattedNumber(vestsToSp(w.vestingSharesDelegated, steemPerMVests), {
      prefix: "-",
      suffix: "SP",
    });

    return (
      <div className="wallet-steem">
        <div className="wallet-main">
          <div className="wallet-info">
            {w.hasUnclaimedRewards && !claimed && (
              <div className="unclaimed-rewards">
                <div className="title">{_t("wallet.unclaimed-rewards")}</div>
                <div className="rewards">
                  {w.rewardSteemBalance > 0 && <span className="reward-type">{`${w.rewardSteemBalance} STEEM`}</span>}
                  {w.rewardSbdBalance > 0 && <span className="reward-type">{`${w.rewardSbdBalance} SBD`}</span>}
                  {w.rewardVestingSteem > 0 && <span className="reward-type">{`${w.rewardVestingSteem} SP`}</span>}
                  {isMyPage && (
                    <Tooltip content={_t("wallet.claim-reward-balance")}>
                      <a className={`claim-btn ${claiming ? "in-progress" : ""}`} onClick={this.claimRewardBalance}>
                        {plusCircle}
                      </a>
                    </Tooltip>
                  )}
                </div>
              </div>
            )}

            <div className="balance-row steem">
              <div className="balance-info">
                <div className="title">{_t("wallet.steem")}</div>
                <div className="description">{_t("wallet.steem-description")}</div>
              </div>
              <div className="balance-values">
                <div className="amount">
                  {(() => {
                    let dropDownConfig: any;
                    if (isMyPage) {
                      dropDownConfig = {
                        history: this.props.history,
                        label: "",
                        items: [
                          {
                            label: _t("wallet.transfer"),
                            onClick: () => {
                              this.openTransferDialog("transfer", "STEEM");
                            },
                          },
                          {
                            label: _t("wallet.transfer-to-savings"),
                            onClick: () => {
                              this.openTransferDialog("transfer-saving", "STEEM");
                            },
                          },
                          {
                            label: _t("wallet.power-up"),
                            onClick: () => {
                              this.openTransferDialog("power-up", "STEEM");
                            },
                          },
                          {
                            label: _t("market-data.trade"),
                            onClick: () => {
                              this.props.history.push("/market");
                            },
                          },
                        ],
                      };
                    } else if (activeUser) {
                      dropDownConfig = {
                        history: this.props.history,
                        label: "",
                        items: [
                          {
                            label: _t("wallet.transfer"),
                            onClick: () => {
                              this.openTransferDialog("transfer", "STEEM");
                            },
                          },
                        ],
                      };
                    }
                    return (
                      <div className="amount-actions">
                        <DropDown {...dropDownConfig} float="right" />
                      </div>
                    );
                  })()}

                  <span>{formattedNumber(w.balance, { suffix: "STEEM" })}</span>
                </div>
                {openOrders && +openOrders.steem > 0 && (
                  <div className="amount amount-passive converting-sbd">
                    <Tooltip content={_t("wallet.reserved-amount")}>
                      <span className="amount-btn" onClick={() => this.toggleOpenOrdersList("STEEM")}>
                        {"+"} {formattedNumber(openOrders.steem, { suffix: "STEEM" })}
                      </span>
                    </Tooltip>
                  </div>
                )}
                {withdrawSavings && +withdrawSavings.steem > 0 && (
                  <div className="amount amount-passive converting-sbd">
                    <Tooltip content={_t("wallet.withdrawing-amount")}>
                      <span className="amount-btn" onClick={() => this.toggleSavingsWithdrawList("STEEM")}>
                        {"+"}{" "}
                        {formattedNumber(withdrawSavings.steem, {
                          suffix: "STEEM",
                        })}
                      </span>
                    </Tooltip>
                  </div>
                )}
              </div>
            </div>

            <div className="balance-row steem-power alternative">
              <div className="balance-info">
                <div className="title">{_t("wallet.steem-power")}</div>
                <div className="description">{_t("wallet.steem-power-description")}</div>
                <div className="description font-weight-bold mt-2">
                  {_t("wallet.steem-power-apr-rate", { value: hp })}
                </div>
              </div>

              <div className="balance-values">
                <div className="amount">
                  {(() => {
                    let dropDownConfig: any;
                    if (isMyPage) {
                      dropDownConfig = {
                        history: this.props.history,
                        label: "",
                        items: [
                          {
                            label: _t("wallet.delegate"),
                            onClick: () => {
                              this.openTransferDialog("delegate", "SP");
                            },
                          },
                          {
                            label: _t("wallet.power-down"),
                            onClick: () => {
                              this.openTransferDialog("power-down", "SP");
                            },
                          },
                          {
                            label: _t("wallet.withdraw-routes"),
                            onClick: () => {
                              this.toggleWithdrawRoutes();
                            },
                          },
                        ],
                      };
                    } else if (activeUser) {
                      dropDownConfig = {
                        history: this.props.history,
                        label: "",
                        items: [
                          {
                            label: _t("wallet.delegate"),
                            onClick: () => {
                              this.openTransferDialog("delegate", "SP");
                            },
                          },
                          {
                            label: _t("wallet.power-up"),
                            onClick: () => {
                              this.openTransferDialog("power-up", "STEEM");
                            },
                          },
                        ],
                      };
                    }
                    return (
                      <div className="amount-actions">
                        <DropDown {...dropDownConfig} float="right" />
                      </div>
                    );
                  })()}
                  {totalSP}
                </div>

                {w.vestingSharesDelegated > 0 && (
                  <div className="amount amount-passive delegated-shares">
                    <Tooltip content={_t("wallet.steem-power-delegated")}>
                      <span className="amount-btn" onClick={this.toggleDelegatedList}>
                        {formattedNumber(vestsToSp(w.vestingSharesDelegated, steemPerMVests), {
                          prefix: "-",
                          suffix: "SP",
                        })}
                      </span>
                    </Tooltip>
                  </div>
                )}

                {(() => {
                  if (w.vestingSharesReceived <= 0) {
                    return null;
                  }

                  const strReceived = formattedNumber(vestsToSp(w.vestingSharesReceived, steemPerMVests), {
                    prefix: "+",
                    suffix: "SP",
                  });

                  // if (global.developingPrivate) {
                  return (
                    <div className="amount amount-passive received-shares">
                      <Tooltip content={_t("wallet.steem-power-received")}>
                        <span className="amount-btn" onClick={this.toggleReceivedList}>
                          {strReceived}
                        </span>
                      </Tooltip>
                    </div>
                  );
                  // }

                  // return (
                  //   <div className="amount amount-passive received-shares">
                  //     <Tooltip content={_t("wallet.steem-power-received")}>
                  //       <span className="amount">{strReceived}</span>
                  //     </Tooltip>
                  //   </div>
                  // );
                })()}

                {w.nextVestingSharesWithdrawal > 0 && (
                  <div className="amount amount-passive next-power-down-amount">
                    <Tooltip content={_t("wallet.next-power-down-amount")}>
                      <span>
                        {formattedNumber(vestsToSp(w.nextVestingSharesWithdrawal, steemPerMVests), {
                          prefix: "-",
                          suffix: "SP",
                        })}
                      </span>
                    </Tooltip>
                  </div>
                )}

                {(w.vestingSharesDelegated > 0 || w.vestingSharesReceived > 0 || w.nextVestingSharesWithdrawal > 0) && (
                  <div className="amount total-steem-power">
                    <Tooltip content={_t("wallet.steem-power-total")}>
                      <span>
                        {formattedNumber(vestsToSp(w.vestingSharesTotal, steemPerMVests), {
                          prefix: "=",
                          suffix: "SP",
                        })}
                      </span>
                    </Tooltip>
                  </div>
                )}
              </div>
            </div>

            <div className="balance-row steem-dollars">
              <div className="balance-info">
                <div className="title">{_t("wallet.steem-dollars")}</div>
                <div className="description">{_t("wallet.steem-dollars-description")}</div>
              </div>
              <div className="balance-values">
                <div className="amount">
                  {(() => {
                    let dropDownConfig: any;
                    if (isMyPage) {
                      dropDownConfig = {
                        history: this.props.history,
                        label: "",
                        items: [
                          {
                            label: _t("wallet.transfer"),
                            onClick: () => {
                              this.openTransferDialog("transfer", "SBD");
                            },
                          },
                          {
                            label: _t("wallet.transfer-to-savings"),
                            onClick: () => {
                              this.openTransferDialog("transfer-saving", "SBD");
                            },
                          },
                          {
                            label: _t("wallet.convert"),
                            onClick: () => {
                              this.openTransferDialog("convert", "SBD");
                            },
                          },
                          {
                            label: _t("market-data.trade"),
                            onClick: () => {
                              this.props.history.push("/market");
                            },
                          },
                        ],
                      };
                    } else if (activeUser) {
                      dropDownConfig = {
                        history: this.props.history,
                        label: "",
                        items: [
                          {
                            label: _t("wallet.transfer"),
                            onClick: () => {
                              this.openTransferDialog("transfer", "SBD");
                            },
                          },
                        ],
                      };
                    }
                    return (
                      <div className="amount-actions">
                        <DropDown {...dropDownConfig} float="right" />
                      </div>
                    );
                  })()}
                  <span>{formattedNumber(w.sbdBalance, { prefix: "$" })}</span>
                </div>

                {converting > 0 && (
                  <div className="amount amount-passive converting-sbd">
                    <Tooltip content={_t("wallet.converting-sbd-amount")}>
                      <span className="amount-btn" onClick={this.toggleConvertList}>
                        {"+"} {formattedNumber(converting, { prefix: "$" })}
                      </span>
                    </Tooltip>
                  </div>
                )}

                {withdrawSavings && +withdrawSavings.sbd > 0 && (
                  <div className="amount amount-passive converting-sbd">
                    <Tooltip content={_t("wallet.withdrawing-amount")}>
                      <span className="amount-btn" onClick={() => this.toggleSavingsWithdrawList("SBD")}>
                        {"+"} {formattedNumber(withdrawSavings.sbd, { prefix: "$" })}
                      </span>
                    </Tooltip>
                  </div>
                )}

                {openOrders && +openOrders.sbd > 0 && (
                  <div className="amount amount-passive converting-sbd">
                    <Tooltip content={_t("wallet.reserved-amount")}>
                      <span className="amount-btn" onClick={() => this.toggleOpenOrdersList("SBD")}>
                        {"+"} {formattedNumber(openOrders.sbd, { prefix: "$" })}
                      </span>
                    </Tooltip>
                  </div>
                )}
              </div>
            </div>

            <div className="balance-row savings alternative">
              <div className="balance-info">
                <div className="title">{_t("wallet.savings")}</div>
                <div className="description">{_t("wallet.savings-description")}</div>
                <div className="description font-weight-bold mt-2">
                  {_t("wallet.steem-dollars-apr-rate", { value: sbd })}
                </div>
                {w.savingBalanceSbd > 0 && (
                  <div className="description font-weight-bold mt-2">
                    {_t("wallet.steem-dollars-apr-claim", {
                      value: lastIPaymentRelative,
                    })}{" "}
                    {estimatedInterest}
                  </div>
                )}
                {isMyPage && w.savingBalanceSbd > 0 && (
                  <div className="unclaimed-rewards" style={{ marginBottom: "0" }}>
                    <div className="rewards" style={{ height: "40px" }}>
                      <a
                        className={`claim-btn ${remainingDays >= 0 ? "disabled" : ""}`}
                        onClick={this.toggleClaimInterest}
                      >
                        {remainingDays >= 0
                          ? _t("wallet.steem-dollars-apr-when", {
                              value: remainingDays,
                            })
                          : _t("wallet.steem-dollars-apr-now")}{" "}
                        {plusCircle}
                      </a>
                    </div>
                  </div>
                )}
              </div>
              <div className="balance-values">
                <div className="amount">
                  {(() => {
                    let dropDownConfig: any;
                    if (isMyPage) {
                      dropDownConfig = {
                        history: this.props.history,
                        label: "",
                        items: [
                          {
                            label: _t("wallet.withdraw-steem"),
                            onClick: () => {
                              this.openTransferDialog("withdraw-saving", "STEEM");
                            },
                          },
                        ],
                      };
                    } else if (activeUser) {
                      dropDownConfig = {
                        history: this.props.history,
                        label: "",
                        items: [
                          {
                            label: _t("wallet.transfer"),
                            onClick: () => {
                              this.openTransferDialog("transfer-saving", "STEEM");
                            },
                          },
                        ],
                      };
                    }
                    return (
                      <div className="amount-actions">
                        <DropDown {...dropDownConfig} float="right" />
                      </div>
                    );
                  })()}
                  <span>{formattedNumber(w.savingBalance, { suffix: "STEEM" })}</span>
                </div>
                <div className="amount">
                  {(() => {
                    let dropDownConfig: any;
                    if (isMyPage) {
                      dropDownConfig = {
                        history: this.props.history,
                        label: "",
                        items: [
                          {
                            label: _t("wallet.withdraw-sbd"),
                            onClick: () => {
                              this.openTransferDialog("withdraw-saving", "SBD");
                            },
                          },
                        ],
                      };
                    } else if (activeUser) {
                      dropDownConfig = {
                        history: this.props.history,
                        label: "",
                        items: [
                          {
                            label: _t("wallet.transfer"),
                            onClick: () => {
                              this.openTransferDialog("transfer-saving", "SBD");
                            },
                          },
                        ],
                      };
                    }
                    return (
                      <div className="amount-actions">
                        <DropDown {...dropDownConfig} float="right" />
                      </div>
                    );
                  })()}

                  <span>{formattedNumber(w.savingBalanceSbd, { suffix: "$" })}</span>
                </div>
              </div>
            </div>

            <div className="balance-row estimated alternative">
              <div className="balance-info">
                <div className="title">{_t("wallet.estimated")}</div>
                <div className="description">{_t("wallet.estimated-description")}</div>
              </div>
              <div className="balance-values">
                <div className="amount amount-bold">
                  <FormattedCurrency {...this.props} value={w.estimatedValue} fixAt={3} />
                </div>
              </div>
            </div>

            {w.isPoweringDown && (
              <div className="next-power-down">
                {_t("wallet.next-power-down", {
                  time: dateToFullRelative(w.nextVestingWithdrawalDate.toString()),
                  amount: formattedNumber(w.nextVestingSharesWithdrawalSteem, {
                    suffix: "STEEM",
                  }),
                })}
              </div>
            )}

            {TransactionList({ ...this.props })}
          </div>
          <WalletMenu global={global} username={account.name} active="steem" />
        </div>

        {transfer && (
          <Transfer
            {...this.props}
            activeUser={activeUser!}
            to={isMyPage ? undefined : account.name}
            mode={transferMode!}
            asset={transferAsset!}
            onHide={this.closeTransferDialog}
          />
        )}

        {this.state.delegatedList && (
          <DelegatedVesting
            {...this.props}
            account={account}
            onHide={this.toggleDelegatedList}
            totalDelegated={totalDelegated.replace("- ", "")}
          />
        )}

        {this.state.receivedList && (
          <ReceivedVesting {...this.props} account={account} onHide={this.toggleReceivedList} />
        )}

        {this.state.convertList && (
          <ConversionRequests {...this.props} account={account} onHide={this.toggleConvertList} />
        )}

        {this.state.savingsWithdrawList && (
          <SavingsWithdraw
            {...this.props}
            tokenType={tokenType}
            account={account}
            onHide={() => this.toggleSavingsWithdrawList("SBD")}
          />
        )}

        {this.state.openOrdersList && (
          <OpenOrdersList
            {...this.props}
            tokenType={tokenType}
            account={account}
            onHide={() => this.toggleOpenOrdersList("SBD")}
          />
        )}

        {this.state.withdrawRoutes && (
          <WithdrawRoutes {...this.props} activeUser={activeUser!} onHide={this.toggleWithdrawRoutes} />
        )}
      </div>
    );
  }
}

export default (p: Props) => {
  const props = {
    history: p.history,
    global: p.global,
    dynamicProps: p.dynamicProps,
    activeUser: p.activeUser,
    transactions: p.transactions,
    account: p.account,
    signingKey: p.signingKey,
    upvuToken: p.upvuToken,
    addAccount: p.addAccount,
    updateActiveUser: p.updateActiveUser,
    setSigningKey: p.setSigningKey,
    fetchTransactions: p.fetchTransactions,
    updateWalletValues: p.updateWalletValues,
    fetchPoints: p.fetchPoints,
    fetchUpvuToken: p.fetchUpvuToken,
    steemengine: false,
  };

  return <WalletSteem {...props} />;
};
