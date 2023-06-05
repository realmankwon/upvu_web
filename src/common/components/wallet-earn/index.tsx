import React, { ProviderProps, useCallback, useEffect, useRef, useState } from "react";
import { Button, Form, Col, FormControl, Spinner } from "react-bootstrap";
import { History } from "history";
import htmlParse from "html-react-parser";
import { vestsToSp } from "../../helper/vesting";
import parseAsset from "../../helper/parse-asset";
import { AssetSymbol } from "@upvu/dsteem";

import { Global } from "../../store/global/types";
import { Account } from "../../store/accounts/types";
import { DynamicProps } from "../../store/dynamic-props/types";
import { OperationGroup, Transactions } from "../../store/transactions/types";
import Transfer, { TransferMode, TransferAsset } from "../transfer";
import { ActiveUser } from "../../store/active-user/types";
import LinearProgress from "../linear-progress";
import BaseComponent from "../base";
import formattedNumber from "../../util/formatted-number";
import { _t } from "../../i18n";
import { ValueDescView } from "../value-desc-view";
import { OverlayTrigger, Tooltip, Modal } from "react-bootstrap";
import SteemWallet from "../../helper/steem-wallet";
import { informationVariantSvg } from "../../img/svg";

import WalletMenu from "../wallet-menu";
import {
  earnAccounts,
  earnUses,
  earnHsts,
  earnSummary,
  earnDepositSteem,
  earnUserInfo,
  earnSaveWalletAddress,
  earnLastClaimDte,
  earnClaim,
  earnAccountConfig,
  earnRefund,
  earnRefundHsts,
} from "../../api/private-api";
import { getVestingDelegations } from "../../api/steem";
import moment from "moment";
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

interface EarnUserProps {
  username: string;
  wallet_address: string;
}

interface EarnUsesProps {
  account: string;
  earn_type: string;
  earn_symbol: string;
}

interface EarnHstsProps {
  username: string;
  earn_account: string;
  reward_dte: string;
  delegate_dte: string;
  deposit_steem_amount: string;
  earn_steem: string;
  earn_steem_expected: string;
  earn_amount: number;
  fee: number;
  earn_symbol: string;
}

interface EarnSummaryProps {
  earn_symbol: string;
  earn_account: string;
  earn_steem: number;
  earn_amount: number;
  fee: number;
  claimed_amount: number;
  claimable_amount: number;
}

interface EarnSummaryArrayProps {
  username: string;
  earnSummary: EarnSummaryProps[];
  lastClaimedDte: string;
  earnLockTerm: number;
  minClaimAmount: number;
  earnSymbolPrice: number;
  earnType: string;
}

interface ValueDescWithTooltipProps {
  val: any;
  desc: string;
  children: JSX.Element;
  existIcon?: boolean;
}

interface DepositInfoProps {
  earnAccount: string;
  amount: number;
}

interface SteemWalletProps {
  userSp: number;
  userSteem: number;
  liquidEarnAccounts: EarnUsesProps[];
  delegateEarnAccounts: EarnUsesProps[];
}

interface EarnRefundSteemProps {
  request_dte: Date;
  earn_account: string;
  request_account: string;
  amount: number;
  request_trx_id: string;
  status: string;
  refund_block_num: string;
  refund_trx_id: string;
  refund_timestamp: Date;
}

interface State {
  loading: boolean;
  isSameAccount: boolean;
  isEarnUser: boolean;
  earnUsesInfo: EarnUsesProps[];
  showDelegateDialog: boolean;
  showTransferDialog: boolean;
  liquidEarnAccounts: EarnUsesProps[];
  previousEarnSteemAmount: DepositInfoProps;
  delegateEarnAccounts: EarnUsesProps[];
  previousEarnDelegateAmount: DepositInfoProps;
  selectedDelegateEarnAccount: string;
  selectedLiquidEarnAccount: string;
  earnUserInfo: EarnUserProps;
  refundSteems: EarnRefundSteemProps[];
}

export class WalletEarn extends BaseComponent<Props, State> {
  state: State = {
    loading: true,
    isSameAccount: false,
    isEarnUser: false,
    earnUsesInfo: [],
    showDelegateDialog: false,
    showTransferDialog: false,
    liquidEarnAccounts: [],
    previousEarnSteemAmount: { earnAccount: "", amount: 0 },
    delegateEarnAccounts: [],
    previousEarnDelegateAmount: { earnAccount: "", amount: 0 },
    selectedDelegateEarnAccount: "",
    selectedLiquidEarnAccount: "",
    earnUserInfo: { username: "", wallet_address: "" },
    refundSteems: [],
  };

  componentDidMount() {
    this.fetchEarnInfo();
  }

  fetchEarnInfo = async () => {
    const { activeUser } = this.props;
    const accountInPath = window.location.pathname.match(new RegExp(/@[\w.\-]+/));
    const username = activeUser ? activeUser?.username : "";

    if (username && accountInPath && accountInPath.length && accountInPath[0] === `@${username}`) {
      this.setState({ isSameAccount: true });

      const [resultEarnUses, resultEarnAccounts, resultEarnUser] = await Promise.all([
        earnUses(username),
        earnAccounts(username),
        earnUserInfo(username),
      ]);

      const liquidEarnAccounts: EarnUsesProps[] = [];
      const delegateEarnAccounts: EarnUsesProps[] = [];

      resultEarnAccounts.map((data: EarnUsesProps) => {
        if (data.earn_type === "L") {
          liquidEarnAccounts.push(data);
        } else {
          delegateEarnAccounts.push(data);
        }
      });

      if (resultEarnUses.length > 0) {
        this.setState({
          earnUsesInfo: resultEarnUses,
          isEarnUser: true,
          loading: false,
          liquidEarnAccounts,
          delegateEarnAccounts,
          earnUserInfo: resultEarnUser,
        });
      } else {
        this.setState({
          earnUsesInfo: [],
          isEarnUser: false,
          loading: false,
          liquidEarnAccounts,
          delegateEarnAccounts,
          earnUserInfo: resultEarnUser,
        });
      }
    } else {
      this.setState({ isSameAccount: false });
    }
  };

  componentWillUnmount() {
    this.setState({ isSameAccount: false });
  }

  delegateEarnAccountChanged = (e: React.ChangeEvent<typeof FormControl & HTMLInputElement>) => {
    const { account, dynamicProps } = this.props;
    const { steemPerMVests } = dynamicProps;
    const earnAccount = e.target.value;

    getVestingDelegations(account.name, earnAccount, 1).then((res) => {
      const delegateAccount =
        res &&
        res.length > 0 &&
        res!.find((item) => (item as any).delegatee === earnAccount && (item as any).delegator === account.name);

      if (delegateAccount) {
        this.setState({
          selectedDelegateEarnAccount: earnAccount,
          previousEarnDelegateAmount: {
            earnAccount,
            amount: vestsToSp(+parseAsset(delegateAccount!.vesting_shares).amount, steemPerMVests),
          },
        });
      } else {
        this.setState({
          selectedDelegateEarnAccount: earnAccount,
          previousEarnDelegateAmount: { earnAccount: "", amount: 0 },
        });
      }
    });
  };

  liquidEarnAccountChanged = async (e: React.ChangeEvent<typeof FormControl & HTMLInputElement>) => {
    const { account } = this.props;

    const earnAccount = e.target.value;
    const [previousEarnSteem, refundSteems] = await Promise.all([
      earnDepositSteem(account.name, earnAccount),
      earnRefundHsts(account.name, earnAccount),
    ]);

    this.setState({
      selectedLiquidEarnAccount: earnAccount,
    });

    if (previousEarnSteem) {
      this.setState({
        previousEarnSteemAmount: {
          earnAccount,
          amount: +previousEarnSteem.total_amount,
        },
      });
    } else {
      this.setState({
        previousEarnSteemAmount: {
          earnAccount: "",
          amount: 0,
        },
      });
    }

    if (refundSteems.success) {
      this.setState({
        refundSteems: refundSteems.result,
      });
    }
  };

  openDelegateDialog = () => {
    this.setState({ showDelegateDialog: true });
  };

  closeDelegateDialog = () => {
    this.setState({ showDelegateDialog: false });
  };

  openTransferDialog = () => {
    this.setState({ showTransferDialog: true });
  };

  closeTransferDialog = () => {
    this.setState({ showTransferDialog: false });
  };

  render() {
    const { global, dynamicProps, account, activeUser, history } = this.props;
    const {
      isSameAccount,
      loading,
      earnUsesInfo,
      isEarnUser,
      showDelegateDialog,
      showTransferDialog,
      liquidEarnAccounts,
      previousEarnSteemAmount,
      delegateEarnAccounts,
      previousEarnDelegateAmount,
      selectedDelegateEarnAccount,
      selectedLiquidEarnAccount,
      earnUserInfo,
      refundSteems,
    } = this.state;

    if (!account.__loaded) {
      return null;
    }

    const w = new SteemWallet(account, dynamicProps);
    let userInfo: EarnUserProps = { username: "", wallet_address: "" };
    if (earnUserInfo.username) {
      userInfo = earnUserInfo;
    } else {
      userInfo = { username: account.name, wallet_address: "" };
    }

    return (
      <div className="wallet-earn">
        <div className="wallet-main">
          <div className="wallet-info">
            <div className="balance-row alternative">
              <div className="balance-info">
                <div className="title">{_t("wallet-earn.title")}</div>
                <div className="description">{htmlParse(_t("wallet-earn.description"))}</div>
              </div>
            </div>
            {isSameAccount ? (
              loading ? (
                <LinearProgress />
              ) : (
                <>
                  {/* <WalletMetamask /> */}
                  <WalletMetamask {...userInfo} />
                  <DelegationSP
                    previousSp={previousEarnDelegateAmount.amount}
                    availableSp={w.availableForDelegateSp}
                    delegateEarnAccounts={delegateEarnAccounts}
                    selectedDelegateEarnAccount={selectedDelegateEarnAccount}
                    openDelegateDialog={this.openDelegateDialog}
                    delegateEarnAccountChanged={this.delegateEarnAccountChanged}
                  />
                  <TransferSteem
                    username={userInfo.username}
                    previousSteem={previousEarnSteemAmount.amount}
                    userSteem={w.balance}
                    liquidEarnAccounts={liquidEarnAccounts}
                    selectedLiquidEarnAccount={selectedLiquidEarnAccount}
                    openTransferDialog={this.openTransferDialog}
                    liquidEarnAccountChanged={this.liquidEarnAccountChanged}
                    refundSteems={refundSteems}
                  />
                  {isEarnUser && earnUsesInfo ? (
                    <div>
                      <EarnHistory earnUsesInfo={earnUsesInfo} username={account.name} />
                    </div>
                  ) : (
                    <div />
                  )}
                </>
              )
            ) : (
              <div className="view-container warn-box">
                <div className="header">WARNING</div>
                <div className="content">
                  <div>
                    <p>The dashboard is only visible to the OWNER of the account.</p>
                    <p>If you are this account owner, please log in first.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
          <WalletMenu global={global} username={account.name} active="earn" />
        </div>

        {showDelegateDialog && (
          <Transfer
            {...this.props}
            activeUser={activeUser!}
            to={isSameAccount ? selectedDelegateEarnAccount : account.name}
            mode="delegate"
            asset="SP"
            onHide={this.closeDelegateDialog}
          />
        )}

        {showTransferDialog && (
          <Transfer
            {...this.props}
            activeUser={activeUser!}
            to={isSameAccount ? selectedLiquidEarnAccount : account.name}
            mode="transfer"
            asset="STEEM"
            onHide={this.closeTransferDialog}
          />
        )}
      </div>
    );
  }
}

const ValueDescWithTooltip = ({ val, desc, children, existIcon = true }: ValueDescWithTooltipProps) => {
  return (
    <div className="tooltip-format">
      <ValueDescView val={val} desc={desc} />
      <div className="">
        <OverlayTrigger
          delay={{ show: 0, hide: 300 }}
          key={"bottom"}
          placement={"top"}
          overlay={
            <Tooltip id={`tooltip-info`}>
              <div className="tooltip-inner">
                <div className="profile-info-tooltip-content">{children}</div>
              </div>
            </Tooltip>
          }
        >
          <div className="d-flex align-items-center">
            <span className="info-icon mr-0 mr-md-2">{existIcon ? informationVariantSvg : ""}</span>
          </div>
        </OverlayTrigger>
      </div>
    </div>
  );
};

const DelegationSP = ({
  previousSp,
  availableSp,
  delegateEarnAccounts,
  selectedDelegateEarnAccount,
  openDelegateDialog,
  delegateEarnAccountChanged,
}: {
  previousSp: number;
  availableSp: number;
  delegateEarnAccounts: EarnUsesProps[];
  selectedDelegateEarnAccount: string;
  openDelegateDialog: any;
  delegateEarnAccountChanged: any;
}) => {
  const onClickDelegation = () => {
    openDelegateDialog();
  };

  const ondelegateEarnAccountChanged = (e: React.ChangeEvent<typeof FormControl & HTMLInputElement>) => {
    delegateEarnAccountChanged(e);
  };

  return (
    <>
      <div className="view-container">
        <div className="header">Deposit SP</div>

        <div className="content">
          <div className="select-delegate-earn-account">
            <FormControl
              className="select-box"
              as="select"
              value={selectedDelegateEarnAccount}
              onChange={ondelegateEarnAccountChanged}
            >
              <option key="empty" value="-">
                Select
              </option>
              {delegateEarnAccounts.map((data: EarnUsesProps) => (
                <option key={data.account} value={data.account}>
                  {data.earn_symbol}
                </option>
              ))}
            </FormControl>
          </div>
          <ValueDescWithTooltip
            val={`${formattedNumber(previousSp, {
              fractionDigits: 3,
            })}`}
            desc={"Previous Amount"}
          >
            <>
              <p>Maximum Delegation Possible Amount.</p>
              <p>You must leave a minimum amount for the activity.</p>
              <p>Depending on the % of the current voting power, the available amount may vary.</p>
            </>
          </ValueDescWithTooltip>
          <ValueDescWithTooltip
            val={`${formattedNumber(availableSp, {
              fractionDigits: 3,
            })}`}
            desc={"Available Amount"}
          >
            <>
              <p>Maximum Delegation Possible Amount.</p>
              <p>You must leave a minimum amount for the activity.</p>
              <p>Depending on the % of the current voting power, the available amount may vary.</p>
            </>
          </ValueDescWithTooltip>
          <div className="tooltip-format min-width-150">
            <Form.Row className="width-full">
              <Col lg={12}>
                <Form.Group>
                  <Form.Control className="blue-btn" type="button" value="Delegate" onClick={onClickDelegation} />
                </Form.Group>
              </Col>
            </Form.Row>
          </div>
        </div>
      </div>
    </>
  );
};

const TransferSteem = ({
  username,
  previousSteem,
  userSteem,
  liquidEarnAccounts,
  selectedLiquidEarnAccount,
  openTransferDialog,
  liquidEarnAccountChanged,
  refundSteems,
}: {
  username: string;
  previousSteem: number;
  userSteem: number;
  liquidEarnAccounts: EarnUsesProps[];
  selectedLiquidEarnAccount: string;
  openTransferDialog: any;
  liquidEarnAccountChanged: any;
  refundSteems: EarnRefundSteemProps[];
}) => {
  const onClickTransfer = () => {
    openTransferDialog();
  };

  const onLiquidEarnAccountChanged = (e: React.ChangeEvent<typeof FormControl & HTMLSelectElement>) => {
    setEarnSymbol(liquidEarnAccounts[e.target.selectedOptions[0].innerText]);
    liquidEarnAccountChanged(e);
  };

  const [refundAmount, setRefundAmount] = useState(0);
  const [maxRefund, setMaxRefund] = useState(previousSteem);
  const [earnSymbol, setEarnSymbol] = useState("");

  useEffect(() => {
    setMaxRefund(previousSteem);
    changeMaxRefund(refundAmount);
  }, [refundAmount, previousSteem]);

  const handleChange = (event: any) => {
    changeMaxRefund(+event.target.value);
  };

  const changeMaxRefund = (maxValue: number) => {
    const newValue = maxValue;
    if (newValue > previousSteem) {
      setRefundAmount(previousSteem);
    } else {
      setRefundAmount(newValue);
    }
  };

  const onClickRefund = () => {
    earnRefund(username, earnSymbol, selectedLiquidEarnAccount, refundAmount)
      .then((result) => {
        if (result.success) alert("Refund Requested");
        else alert(result.result);

        window.location.reload();
      })
      .catch((e) => {});
  };

  const calculateRefundDate = (requestDate: string) => {
    const nextMonday = new Date(requestDate);
    nextMonday.setDate(new Date(requestDate).getDate() + ((7 - new Date(requestDate).getDay()) % 7) + 1);
    const diffInDays = Math.round((nextMonday.getTime() - new Date(requestDate).getTime()) / (1000 * 60 * 60 * 24));
    return moment(requestDate)
      .add(diffInDays + 7, "day")
      .format("YYYY-MM-DD");
  };

  return (
    <>
      <div className="view-container">
        <div className="header">Deposit Steem</div>

        <div className="content">
          <div className="select-delegate-earn-account">
            <FormControl
              className="select-box"
              as="select"
              value={selectedLiquidEarnAccount}
              defaultValue="-"
              onChange={onLiquidEarnAccountChanged}
            >
              <option key="empty" value="-">
                Select
              </option>
              {liquidEarnAccounts.map((data: EarnUsesProps) => (
                <option key={data.account} value={data.account}>
                  {data.earn_symbol}
                </option>
              ))}
            </FormControl>
          </div>
          <ValueDescWithTooltip
            val={`${formattedNumber(previousSteem, {
              fractionDigits: 3,
            })}`}
            desc={"Previous Steem"}
          >
            <>
              <p>Current STEEM Amount</p>
            </>
          </ValueDescWithTooltip>

          <ValueDescWithTooltip
            val={`${formattedNumber(userSteem, {
              fractionDigits: 3,
            })}`}
            desc={"Steem Balance"}
          >
            <>
              <p>Current STEEM Amount</p>
            </>
          </ValueDescWithTooltip>

          <div className="tooltip-format min-width-150">
            <Form.Row className="width-full">
              <Col lg={12}>
                <Form.Group>
                  <Form.Control className="blue-btn" type="button" value="Transfer" onClick={onClickTransfer} />
                </Form.Group>
              </Col>
            </Form.Row>
          </div>
        </div>
        <div className="content" style={{ display: "flex", justifyContent: "flex-end" }}>
          <div className="tooltip-format min-width-150">
            <Form.Row className="width-full">
              <Col lg={12}>
                <Form.Group>
                  <Form.Control type="number" min="0" max={maxRefund} value={refundAmount} onChange={handleChange} />
                </Form.Group>
              </Col>
            </Form.Row>
          </div>
          <div className="tooltip-format min-width-150">
            <Form.Row className="width-full">
              <Col lg={12}>
                <Form.Group>
                  <Form.Control className="blue-btn" type="button" value="Refund" onClick={onClickRefund} />
                </Form.Group>
              </Col>
            </Form.Row>
          </div>
          {refundSteems && refundSteems.length > 0 && (
            <div
              className="transaction-list-item col-header"
              style={{
                backgroundColor: "#96c0ff",
                textAlign: "center",
                marginTop: "10px",
              }}
            >
              <div className="upvu-token-title refund-timestamp">
                <div className="transaction-upper">Request Date</div>
              </div>
              <div className="upvu-token-title refund-timestamp">
                <div className="transaction-upper">Refund Date</div>
              </div>
              <div className="upvu-token-title amount">
                <div className="transaction-upper">Refund Amount</div>
              </div>
              <div className="upvu-token-title amount">
                <div className="transaction-upper">Status</div>
              </div>
            </div>
          )}
          {refundSteems &&
            refundSteems.map((data: any, idx: number) => (
              <div className="transaction-list-item" key={idx}>
                <div className="upvu-token-title refund-timestamp">
                  <div className="upvu-token-upper">
                    {moment(new Date(data.request_dte)).format("YYYY-MM-DD HH:mm:ss")}
                  </div>
                </div>
                <div className="upvu-token-title refund-timestamp">
                  <div className="upvu-token-upper">
                    {calculateRefundDate(moment(new Date(data.request_dte)).format("YYYY-MM-DD HH:mm:ss"))}
                  </div>
                </div>
                <div className="upvu-token-title amount">
                  <div className="upvu-token-upper">
                    {`${formattedNumber(data.amount, {
                      fractionDigits: 3,
                    })}`}
                  </div>
                </div>
                <div className="upvu-token-title amount">
                  <div className="upvu-token-upper">{data.status === "R" ? "Requested" : "Not Processed"}</div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </>
  );
};

const MyEarns = ({
  username,
  earnSummary,
  lastClaimedDte,
  earnLockTerm,
  minClaimAmount,
  earnSymbolPrice,
  earnType,
}: EarnSummaryArrayProps) => {
  const datelastClaimedDte = new Date(lastClaimedDte);
  const countDownDate = datelastClaimedDte.setDate(datelastClaimedDte.getDate() + earnLockTerm);
  const countDown = countDownDate - new Date().getTime();

  const [remainingPeriod, setRemainingPeriod] = useState("");
  const [unableToClaimReason, setUnableToClaimReason] = useState("");
  const [stopInterval, setStopInterval] = useState(false);
  // const [loading, setLoading] = useState(true);

  const handleClickClaim = () => {
    setStopInterval(true);
    earnClaim(
      username,
      earnSummary[earnSummary.length - 1].earn_symbol,
      earnSummary[earnSummary.length - 1].earn_account
    ).then((result) => {
      if (result.success) alert("Congratulations, your claim has been successfully processed!");
      else alert(`I'm sorry, but your claim has failed. ${result.error}`);

      setStopInterval(false);
      window.location.reload();
    });
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const days = Math.floor(countDown / (1000 * 60 * 60 * 24));
      const hours = Math.floor((countDown % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((countDown % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((countDown % (1000 * 60)) / 1000);

      if (isNaN(days) && isNaN(hours) && isNaN(minutes) && isNaN(seconds)) {
      } else if (days >= 0 && hours >= 0 && minutes >= 0 && seconds >= 0) {
        setRemainingPeriod(`${days}d ${hours}h ${minutes}m ${seconds}s`);
        setUnableToClaimReason("There is no time period to claim.");
      } else {
        if (!earnSummary || earnSummary.length == 0) {
          setRemainingPeriod("Unable to claim");
          setUnableToClaimReason("There is no record to claim.");

          return;
        }

        if (earnSummary[earnSummary.length - 1].claimable_amount == 0) {
          setRemainingPeriod("Unable to claim");
          setUnableToClaimReason(
            `The claimable amount is not enough.(${earnSummary[earnSummary.length - 1].claimable_amount} ${
              earnSummary[earnSummary.length - 1].earn_symbol
            })`
          );
          return;
        }

        if (earnSymbolPrice * earnSummary[earnSummary.length - 1].claimable_amount < minClaimAmount) {
          setRemainingPeriod("Unable to claim");
          setUnableToClaimReason(
            `Your claimable amount(${earnSummary[earnSummary.length - 1].claimable_amount} ${
              earnSummary[earnSummary.length - 1].earn_symbol
            } = $${(earnSummary[earnSummary.length - 1].claimable_amount * earnSymbolPrice).toFixed(
              3
            )}) is less than min claimable amount($${minClaimAmount}).`
          );
          return;
        }

        if (stopInterval) setRemainingPeriod("Unable to claim");
        else setRemainingPeriod("Claimable");
      }
    }, 1000);
    return () => clearTimeout(interval);
  }, [countDown]);

  return (
    <>
      <div className="view-container">
        <div className="header">My Earn Status</div>
        <div className="content">
          {earnSummary &&
            earnSummary.map((summary) => (
              <>
                <Form.Row className="width-full" key={summary.earn_symbol}>
                  <Col lg={3}>
                    <ValueDescWithTooltip
                      val={`${formattedNumber(summary.earn_steem, { fractionDigits: 3 })}`}
                      desc="Earned Steem"
                    >
                      <>
                        <p>Earned Steem</p>
                      </>
                    </ValueDescWithTooltip>
                  </Col>
                  <Col lg={3}>
                    <ValueDescWithTooltip val={`${summary.earn_amount} ${summary.earn_symbol}`} desc={"Total Earned"}>
                      <>
                        <p>Total Earned</p>
                      </>
                    </ValueDescWithTooltip>
                  </Col>
                  <Col lg={3}>
                    <ValueDescWithTooltip
                      val={`${summary.claimed_amount} ${summary.earn_symbol}`}
                      desc={"Already Claimed"}
                    >
                      <>
                        <p>Already Claimed</p>
                      </>
                    </ValueDescWithTooltip>
                  </Col>
                  <Col lg={3}>
                    <ValueDescWithTooltip val={`${summary.claimable_amount} ${summary.earn_symbol}`} desc={"Claimable"}>
                      <>
                        <p>Claimable</p>
                      </>
                    </ValueDescWithTooltip>
                  </Col>
                </Form.Row>
              </>
            ))}

          <Form.Row className="width-full">
            <Col lg={3}>
              <ValueDescWithTooltip val={remainingPeriod} desc={"Remaing Period"}>
                <>{unableToClaimReason}</>
              </ValueDescWithTooltip>
            </Col>
            <Col lg={3}>
              <Form.Control
                className="green-btn"
                type="button"
                disabled={remainingPeriod === "Claimable" ? false : true}
                value="Claim"
                onClick={handleClickClaim}
              />
            </Col>
          </Form.Row>
        </div>
      </div>
    </>
  );
};

const EarnHistory = ({ earnUsesInfo, username }: { earnUsesInfo: EarnUsesProps[]; username: string }) => {
  const LIMIT = 100;
  const [selectedValue, setSelectedValue] = useState("");
  const [earnStatus, setEarnStatus] = useState({
    username: "",
    earnSummary: [],
    lastClaimedDte: "",
    earnLockTerm: 0,
    minClaimAmount: 0,
    earnSymbolPrice: 0,
  });
  const [earnHstInfo, setEarnHstInfo] = useState<EarnHstsProps[]>([]);
  const [offset, setOffset] = useState(0);
  const [count, setCount] = useState(LIMIT);
  const [hasMore, setHasMore] = useState(true);
  const [symbol, setSymbol] = useState("");
  const [earnSymbolPrice, setEarnSymbolPrice] = useState(0);
  const [steemPrice, setSteemPrice] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      const earnAccount = selectedValue.split(":")[0];
      const [resultEarnHsts, resultEarnSummary, lastClaimDte, accountConfig] = await Promise.all([
        earnHsts(username, earnAccount, offset, count),
        earnSummary(username, earnAccount),
        earnLastClaimDte(username, earnAccount),
        earnAccountConfig(username, earnAccount),
      ]);

      setEarnHstInfo((prevItems) => [...prevItems, ...resultEarnHsts]);
      setEarnStatus({
        username,
        earnSummary: resultEarnSummary,
        lastClaimedDte: lastClaimDte.last_claimed_dte,
        earnLockTerm: accountConfig.earn_lock_term,
        minClaimAmount: accountConfig.min_claim_amount,
        earnSymbolPrice: earnSymbolPrice,
      });
      setHasMore(resultEarnHsts.length === count);
    };
    fetchData();
  }, [offset, count, selectedValue]);

  const handleLoadMore = () => {
    setOffset((prevOffset) => prevOffset + count);
  };

  const handleSelectChange = (e: React.ChangeEvent<typeof FormControl & HTMLInputElement>) => {
    setSelectedValue(e.target.value);
    setSymbol(e.target.value.split(":")[2]);
    setOffset(0);
    setEarnHstInfo([]);
  };

  useEffect(() => {
    const currentSymbol = earnUsesInfo[0].earn_symbol;
    setSelectedValue(`${earnUsesInfo[0].account}:${earnUsesInfo[0].earn_type}:${currentSymbol}`);
    setSymbol(currentSymbol);
    fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${currentSymbol}BUSD`)
      .then((response) => response.json())
      .then((json) => {
        setEarnSymbolPrice(+json.price); // 가져온 데이터 1~100위 담기
        // setLoading(false); // 로딩 멈추기
      });
    fetch(`https://api.binance.com/api/v3/ticker/price?symbol=STEEM${currentSymbol}`)
      .then((response) => response.json())
      .then((json) => {
        setSteemPrice(+json.price); // 가져온 데이터 1~100위 담기
        // setLoading(false); // 로딩 멈추기
      });
  }, []);
  useEffect(() => {
    const interval = setInterval(() => {
      fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}BUSD`)
        .then((response) => response.json())
        .then((json) => {
          setEarnSymbolPrice(+json.price); // 가져온 데이터 1~100위 담기
          // setLoading(false); // 로딩 멈추기
        });
    }, 10000);

    return () => clearTimeout(interval);
  }, [symbol]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetch(`https://api.binance.com/api/v3/ticker/price?symbol=STEEM${symbol}`)
        .then((response) => response.json())
        .then((json) => {
          setSteemPrice(+json.price); // 가져온 데이터 1~100위 담기
          // setLoading(false); // 로딩 멈추기
        });
    }, 10000);
    return () => clearTimeout(interval);
  }, [symbol]);

  return (
    <>
      <div className="transaction-list-header">
        <h2>History</h2>
        <div className="select-history">
          <FormControl className="select-box" as="select" value={selectedValue} onChange={handleSelectChange}>
            {earnUsesInfo.map((earnAccount) => (
              <option
                key={earnAccount.account}
                value={`${earnAccount.account}:${earnAccount.earn_type}:${earnAccount.earn_symbol}`}
              >
                {`${earnAccount.earn_type === "D" ? "Delegate SP" : "Liquid Steem"}-${earnAccount.earn_symbol}`}
              </option>
            ))}
          </FormControl>
        </div>
      </div>
      <MyEarns
        username={earnStatus.username}
        earnSummary={earnStatus.earnSummary}
        lastClaimedDte={earnStatus.lastClaimedDte}
        earnLockTerm={earnStatus.earnLockTerm}
        minClaimAmount={earnStatus.minClaimAmount}
        earnSymbolPrice={earnSymbolPrice}
        earnType={selectedValue.split(":")[1]}
      />
      <div>
        <div
          className="transaction-list-item col-header"
          style={{
            backgroundColor: "#96c0ff",
            textAlign: "center",
          }}
        >
          <div className="transaction-title date">
            <div className="transaction-upper">Reward Date</div>
          </div>
          <div className="transaction-title date">
            <div className="transaction-upper">Deposit Date</div>
          </div>
          <div className="transaction-title permlink">
            <div className="transaction-upper">Deposit Steem</div>
          </div>
          <div className="transaction-title">
            <div className="transaction-upper">Earn Steem {earnStatus.earnSummary.length == 0 && "(Expected)"}</div>
          </div>
          <div className="transaction-title">
            <div className="transaction-upper">Earn Amount {earnStatus.earnSummary.length == 0 && "(Expected)"}</div>
          </div>
        </div>

        {earnHstInfo ? (
          earnHstInfo.map((earnHst: EarnHstsProps, idx: number) => (
            <div className="transaction-list-item" key={idx}>
              <div className="transaction-title date">
                <div className="transaction-upper">{earnHst.reward_dte}</div>
              </div>
              <div className="transaction-title date">
                <div className="transaction-upper">{earnHst.delegate_dte}</div>
              </div>
              <div className="transaction-title permlink">
                <div className="transaction-upper">
                  {formattedNumber(earnHst.deposit_steem_amount, { fractionDigits: 3 })} STEEM
                </div>
              </div>
              <div className="transaction-title">
                <div className="transaction-upper">
                  {earnStatus.earnSummary.length == 0
                    ? formattedNumber(earnHst.earn_steem_expected, { fractionDigits: 3 })
                    : formattedNumber(earnHst.earn_steem, { fractionDigits: 3 })}{" "}
                  STEEM
                </div>
              </div>
              <div className="transaction-title">
                <div className="transaction-upper">
                  {earnStatus.earnSummary.length == 0
                    ? `${(+earnHst.earn_steem_expected * steemPrice).toFixed(8)} ${symbol}`
                    : `${earnHst.earn_amount} ${earnHst.earn_symbol ? earnHst.earn_symbol : symbol}`}{" "}
                </div>
              </div>
            </div>
          ))
        ) : (
          <LinearProgress />
        )}

        {hasMore && (
          <Button block={true} onClick={handleLoadMore} className="mt-2">
            {_t("g.load-more")}
          </Button>
        )}
      </div>
    </>
  );
};

const WalletMetamask = ({ username, wallet_address }: EarnUserProps) => {
  const [chainId, setChainId] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [savedWalletAddress, setSavedWalletAddress] = useState("");
  const [active, setActive] = useState(false);

  const network = {
    chainId: "0xa4b1", // "42161"
    chainName: "Arbitrum One",
    blockExplorerUrls: ["https://arbiscan.io"],
    rpcUrls: ["https://arb1.arbitrum.io/rpc"],
    nativeCurrency: {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
    },
  };

  const getRequestAccounts = async () => {
    const walletAddress = await window.ethereum.request({
      method: "eth_requestAccounts",
      params: [
        {
          eth_accounts: {},
        },
      ],
    });

    return walletAddress;
  };

  useEffect(() => {
    if (window.ethereum) {
      if (window.ethereum.selectedAddress) {
        setWalletAddress(window.ethereum.selectedAddress);
        setActive(true);
      }
    }

    setSavedWalletAddress(wallet_address);
  }, []);

  useEffect(() => {
    if (window.ethereum) {
      if (window.ethereum.selectedAddress) {
        setWalletAddress(window.ethereum.selectedAddress);
      }
    }
  }, [walletAddress]);

  window.ethereum.on("accountsChanged", (value: any) => {
    if (value.length > 0) setWalletAddress(value[0]);
    else setWalletAddress("");
  });

  window.ethereum.on("chainChanged", async (value: any) => {
    if (value != network.chainId) {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: network.chainId }],
      });
      setChainId(network.chainId);
    }
  });

  const connectWallet = async () => {
    try {
      if (typeof window.ethereum !== "undefined") {
        if (active) {
          await window.ethereum.request({
            method: "wallet_requestPermissions",
            params: [
              {
                eth_accounts: {},
              },
            ],
          });
          setActive(false);
          setWalletAddress("");
        } else {
          const resultChainId = window.ethereum.chainId;

          if (resultChainId !== network.chainId) {
            await window.ethereum
              .request({
                method: "wallet_switchEthereumChain",
                params: [{ chainId: network.chainId }],
              })
              .catch(async (e: any) => {
                //Unrecognized chain ID
                if (e.code == 4902) {
                  await window.ethereum.request({
                    method: "wallet_addEthereumChain",
                    params: [network],
                  });
                }
              });
          }

          const resultConnect = await getRequestAccounts();
          if (resultConnect.length > 0) {
            setActive(true);
            setWalletAddress(resultConnect[0]);
          }
        }
      } else {
        alert("please install MetaMask");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const saveWalletAddress = async () => {
    try {
      const result = await earnSaveWalletAddress(username, walletAddress);

      if (result) {
        const prevWalletAddress = savedWalletAddress;
        setSavedWalletAddress(walletAddress);
        alert(`Changed from ${prevWalletAddress} to ${walletAddress}`);
      }
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="view-container">
      <div className="header">My Wallet Address</div>
      <div className="content">
        <Form.Row className="width-full">
          <Col lg={8}>
            <Form.Group>
              <Form.Label>Metamask Address</Form.Label>
              <Form.Control type="text" value={walletAddress} maxLength={50} data-var="name" />
            </Form.Group>
          </Col>
          <Col lg={2}>
            <Form.Group>
              <Form.Label>Connect</Form.Label>
              <Form.Control
                className="green-btn"
                type="button"
                value={active ? "Connected" : "Connect"}
                onClick={connectWallet}
              />
            </Form.Group>
          </Col>
        </Form.Row>
        <Form.Row className="width-full">
          <Col lg={8}>
            <Form.Group>
              <Form.Label>Saved My Address</Form.Label>
              <Form.Control type="text" value={savedWalletAddress} maxLength={50} data-var="name" />
            </Form.Group>
          </Col>
          <Col lg={2}>
            <Form.Group>
              <Form.Label>Save</Form.Label>
              <Form.Control
                className="blue-btn"
                type="button"
                value={savedWalletAddress ? "Change" : "Save"}
                onClick={saveWalletAddress}
              />
            </Form.Group>
          </Col>
        </Form.Row>
      </div>
    </div>
  );
};

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

  return <WalletEarn {...props} />;
};
