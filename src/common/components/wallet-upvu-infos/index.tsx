import React, { ChangeEvent, useState } from "react";
import { Button, Form, Col, FormControl, Spinner } from "react-bootstrap";

import { History } from "history";

import { Global } from "../../store/global/types";
import { Account } from "../../store/accounts/types";
import { DynamicProps } from "../../store/dynamic-props/types";
import { Transactions } from "../../store/transactions/types";
import { ActiveUser } from "../../store/active-user/types";
import { UpvuToken, UpvuTransaction } from "../../store/upvu-token/types";

import BaseComponent from "../base";
import LinearProgress from "../linear-progress";
import { OverlayTrigger, Tooltip, Modal } from "react-bootstrap";
import { getUPVUInfos, requestClaimTronReward, getRewardType, updateRewardType } from "../../api/private-api";
import Transfer, { TransferMode, TransferAsset } from "../transfer";
import { error, success } from "../feedback";

import { informationVariantSvg } from "../../img/svg";
import formattedNumber from "../../util/formatted-number";

import { _t } from "../../i18n";
import { ValueDescView } from "../value-desc-view";

import { witnessProxyKc, witnessProxy, witnessProxyHot } from "../../api/operations";
import moment from "moment";

interface Props {
  global: Global;
  history: History;
  dynamicProps: DynamicProps;
  account: Account;
  activeUser: ActiveUser | null;
  transactions: Transactions;
  signingKey: string;
  upvuToken: UpvuToken;
  addAccount: (data: Account) => void;
  updateActiveUser: (data?: Account) => void;
  setSigningKey: (key: string) => void;
  fetchPoints: (username: string, type?: number) => void;
  fetchUpvuToken: (username: string) => void;
  updateWalletValues: () => void;
}

interface VotingProps {
  planned_voting_dte: string;
  symbol: string;
  voter: string;
  author: string;
  permlink: string;
  posting_dte: string;
  posting_detect_dte: string;
  posting_detector: string;
  origin_voting_rate: string;
  applied_voting_rate: string;
  delegate_sp: string;
  token_amount: string;
  total_sp: string;
  voting_dte: string;
  voting_block_num: string;
  voting_trx_id: string;
  createdAt: string;
  updatedAt: string;
  banner: string;
  voting_value: number;
  sp_reward: number;
  sbd_reward: number;
}

interface RewardProps {
  reward_dte: string;
  data_dte: string;
  amount: number;
  symbol: string;
  steem_reward: string;
  tron_reward: string;
  voting_value: number;
  steem_krw: number;
  sbd_krw: number;
  trx_krw: number;
  steem_usd: number;
  sbd_usd: number;
  trx_usd: number;
  krwusd: number;
  author_sp: string;
  sp_reward_krw: number;
  sp_reward_usd: number;
  author_steem: string;
  steem_reward_krw: number;
  steem_reward_usd: number;
  author_sbd: string;
  sbd_reward_krw: number;
  sbd_reward_usd: number;
  total_krw_old: number;
  total_usd_old: number;
  annual_profit_old: number;
  total_krw: number;
  total_usd: number;
  annual_profit: number;
  transfer: string;
}

interface DelegationProps {
  sp: number;
  knd: string;
  date: string;
}

interface SummaryProps {
  total_reward: string;
  trx_reward: string;
  claimed_trx_reward: number;
  interest_trx_reward: string;
  remain_trx_reward: number;
  author_reward: number;
  total_sp: number;
  delegated_sp: number;
  token_amount: number;
  voting_count: number;
  today_voting_rate: number;
  proxy: string;
}

interface UserProps {
  account: string;
  reward_type: string;
  reply: string;
  proxy: string;
  admin: string;
  createdAt: string;
  updatedAt: string;
}

interface UPVUUserSpProps {
  total_sp: number;
  account_sp: number;
  delegatedIn_sp: number;
  delegatedOut_sp: number;
  powerdown_sp: number;
}

interface UpvuInfoProps {
  votings: VotingProps[];
  rewards: RewardProps[];
  delegate: DelegationProps[];
  summary: SummaryProps;
  user: UserProps;
  upvu_sp: UPVUUserSpProps;
  user_sp: UPVUUserSpProps;
  user_steem: string;
  upvu_delegate: number;
  tron_address: string;
  isKrw?: boolean;
  account?: string;
  upvuToken?: string;
  refund_steems: UpvuRefundSteemProps[];
  openTransferDialog?: any;
}

interface UpvuRefundSteemProps {
  transaction_id: string;
  str_timestamp: string;
  account: string;
  send_dte: string;
  amount: number;
  transfer: string;
  transfer_block_num: string;
  transfer_trx_id: string;
  transfer_timestamp: Date;
}

interface RewardTypeProps {
  id: number;
  reward_type: string;
  use_tag?: string;
  sort?: number;
  enabled?: string;
  chain?: string;
  fee?: number;
  fee_unit?: string;
  image_url?: string;
}

interface UpvuStatusProps {
  summary: SummaryProps;
  user: UserProps;
  rewardTypeList: RewardTypeProps[];
  selectedRewardType: string;
  showDialog: () => void;
}

interface ValueDescWithTooltipProps {
  val: any;
  desc: string;
  children: JSX.Element;
  existIcon?: boolean;
}

interface SetTypeDialogProps {
  onHide: () => void;
  children: JSX.Element;
}

interface State {
  loading: boolean;
  upvuInfos: UpvuInfoProps | null;
  selectedHistory: string;
  selectedRewardType: string;
  isSameAccount: boolean;
  isUPVUUser: boolean;
  showTransferDialog: boolean;
  showSetTypeDialog: boolean;
  transferMode: null | TransferMode;
  transferAsset: null | TransferAsset;
  rewardTypeList: RewardTypeProps[];
  transferUpvu: boolean;
}

const historyKindArray = [
  "Voting History",
  "Reward History(KRW)",
  "Reward History(USD)",
  "Delegation History",
  "UPVU Token Transaction",
];

export class WalletUPVUInfos extends BaseComponent<Props, State> {
  state: State = {
    loading: true,
    upvuInfos: null,
    selectedHistory: historyKindArray[0],
    selectedRewardType: "",
    isSameAccount: false,
    isUPVUUser: false,
    showTransferDialog: false,
    showSetTypeDialog: false,
    transferMode: null,
    transferAsset: null,
    rewardTypeList: [],
    transferUpvu: true,
  };

  componentDidMount() {
    const { activeUser } = this.props;
    const accountInPath = window.location.pathname.match(new RegExp(/@[\w.\-]+/));
    const account = activeUser ? activeUser?.username : "";

    if (account && accountInPath && accountInPath.length && accountInPath[0] === `@${account}`) {
      this.setState({ isSameAccount: true });
      getUPVUInfos(account).then((r) => {
        if (r.success) {
          const upvuInfo = r.infos as UpvuInfoProps;

          if (upvuInfo.summary.total_sp) {
            this.setState({
              upvuInfos: upvuInfo,
              loading: false,
              isUPVUUser: true,
              selectedRewardType: upvuInfo.user.reward_type,
            });
          } else {
            this.setState({ upvuInfos: upvuInfo, loading: false, isUPVUUser: false });
          }
        } else {
          alert("fail to load upvuInfos list");
        }
      });
    } else {
      this.setState({ isSameAccount: false });
    }

    getRewardType().then((r) => {
      console.log("getRewardType", r);
      if (r.success) {
        this.setState({ rewardTypeList: r.list });
      } else {
        error("Fail to load reward type list");
      }
    });
  }

  componentWillUnmount() {
    this.setState({ isSameAccount: false });
  }

  filterChanged = (e: React.ChangeEvent<typeof FormControl & HTMLInputElement>) => {
    if (e.target.value == "UPVU Token Transaction") {
      const { fetchUpvuToken, account } = this.props;
      fetchUpvuToken(account.name);
    }
    this.setState({ selectedHistory: e.target.value });
  };

  openTransferDialog = (mode: TransferMode, asset: TransferAsset, transferUpvu: boolean = true) => {
    this.setState({ showTransferDialog: true, transferMode: mode, transferAsset: asset, transferUpvu });
  };

  closeTransferDialog = () => {
    const { fetchUpvuToken, account } = this.props;
    fetchUpvuToken(account.name);

    this.setState({ showTransferDialog: false, transferMode: null, transferAsset: null, transferUpvu: false });
  };

  openSetRewardTypeDialog = () => {
    this.setState({ showSetTypeDialog: true });
  };

  closeSetRewardTypeDialog = () => {
    this.setState({ showSetTypeDialog: false });
  };

  selectRewardType = (e?: React.MouseEvent<HTMLElement>) => {
    if (e) {
      e.stopPropagation();
    }
  };

  render() {
    const { account, activeUser, upvuToken } = this.props;
    const {
      upvuInfos,
      loading,
      selectedHistory,
      selectedRewardType,
      isSameAccount,
      isUPVUUser,
      showTransferDialog,
      showSetTypeDialog,
      transferMode,
      transferAsset,
      rewardTypeList,
      transferUpvu,
    } = this.state;

    if (!account.__loaded) {
      return null;
    }

    if (upvuInfos) {
      upvuInfos.upvuToken = upvuToken.upvuToken;
    }

    return (
      <div className="wallet-upvu">
        {isSameAccount ? (
          loading ? (
            <LinearProgress />
          ) : (
            <div>
              {upvuInfos ? (
                <div>
                  <MyUpvuPower {...upvuInfos} />
                  <UPVUStatus
                    summary={upvuInfos.summary}
                    user={upvuInfos.user}
                    rewardTypeList={rewardTypeList}
                    showDialog={this.openSetRewardTypeDialog}
                    selectedRewardType={selectedRewardType}
                  />
                  <MyRewards {...upvuInfos} />
                  <DelegationSP {...upvuInfos} openTransferDialog={this.openTransferDialog} />
                  <RefundSteem {...upvuInfos} openTransferDialog={this.openTransferDialog} />
                  <TronInformation {...upvuInfos} />
                  <TronClaim {...upvuInfos} account={account.name} />
                  <hr />

                  <div className="transaction-list-header">
                    <h2>History</h2>
                    <div className="select-history">
                      <FormControl
                        className="select-box"
                        as="select"
                        value={selectedHistory}
                        onChange={this.filterChanged}
                      >
                        {historyKindArray.map((kind) => (
                          <option key={kind} value={kind}>
                            {kind}
                          </option>
                        ))}
                      </FormControl>
                    </div>
                  </div>
                  {selectedHistory === historyKindArray[0] ? (
                    <VotingHistory {...upvuInfos} />
                  ) : selectedHistory === historyKindArray[1] ? (
                    <RewardHistory {...upvuInfos} isKrw={true} />
                  ) : selectedHistory === historyKindArray[2] ? (
                    <RewardHistory {...upvuInfos} isKrw={false} />
                  ) : selectedHistory === historyKindArray[3] ? (
                    <DelegationHistory {...upvuInfos} />
                  ) : (
                    <UpvuTokenTransaction {...upvuToken} />
                  )}
                </div>
              ) : upvuInfos ? (
                <div>
                  <div className="view-container warn-box">
                    <div className="header">Information</div>
                    <div className="content">
                      <div>
                        <p>Oh! You are not yet a member of UPVU.</p>
                        <p>Delegate your SP to @upvu and become a UPVU member.</p>
                        <p>Enjoy Steemit with more rewards! (Min amount : 200 SP)</p>
                      </div>
                    </div>
                  </div>
                  <DelegationSP {...upvuInfos} openTransferDialog={this.openTransferDialog} />
                </div>
              ) : (
                <div />
              )}
            </div>
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

        {showTransferDialog && (
          <Transfer
            {...this.props}
            activeUser={activeUser!}
            to={isSameAccount ? (transferUpvu ? "upvu" : undefined) : account.name}
            mode={transferMode!}
            asset={transferAsset!}
            onHide={this.closeTransferDialog}
          />
        )}

        {showSetTypeDialog && activeUser?.username && (
          <ShowSetTypeDialog onHide={this.closeSetRewardTypeDialog}>
            <div className="dialog-content">
              {rewardTypeList.map((rewardType, idx) => (
                <button
                  className={`rewardtype-row ${selectedRewardType === rewardType.reward_type ? "selected" : ""}`}
                  key={idx}
                  onClick={() => {
                    updateRewardType(activeUser.username, rewardType.reward_type).then((r) => {
                      if (r.success) {
                        this.setState({
                          selectedRewardType: rewardType.reward_type,
                        });

                        this.closeSetRewardTypeDialog();

                        success(`Update reward type to ${rewardType.reward_type} successfully!`);
                      } else {
                        error("Fail to update reward type");
                      }
                    });
                  }}
                >
                  <img className="image" src={`${rewardType.image_url}`} />
                  <div className="reward-type">{rewardType.reward_type}</div>
                </button>
              ))}
            </div>
          </ShowSetTypeDialog>
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

const MyUpvuPower = ({ summary }: UpvuInfoProps) => {
  return (
    <>
      <div className="view-container">
        <div className="header">My UPVU Power</div>

        <div className="content">
          <ValueDescWithTooltip val={formattedNumber(summary.total_sp, { fractionDigits: 3 })} desc={"Total Amount"}>
            <>
              <p>Delegated SP + UPVU Token</p>
            </>
          </ValueDescWithTooltip>

          <ValueDescWithTooltip
            val={formattedNumber(summary.delegated_sp, { fractionDigits: 3 })}
            desc={"Delegated SP"}
          >
            <>
              <p>Delegated Amount to @upvu</p>
            </>
          </ValueDescWithTooltip>
          <ValueDescWithTooltip val={formattedNumber(summary.token_amount, { fractionDigits: 3 })} desc={"UPVU Token"}>
            <>
              <p>UPVU tokens you hold</p>
            </>
          </ValueDescWithTooltip>
          <ValueDescWithTooltip
            val={`${formattedNumber(summary.today_voting_rate / 100, { fractionDigits: 2 })}%`}
            desc={"VP Weight"}
          >
            <>
              <p>Today Voting Power Weight from @upvu</p>
            </>
          </ValueDescWithTooltip>
        </div>
      </div>
    </>
  );
};

const UPVUStatus = ({ summary, user, showDialog, selectedRewardType }: UpvuStatusProps) => {
  const [proxy, setProxy] = useState(user ? user.proxy : "N");
  const [inProgress, setInProgress] = useState(false);
  const spinner = <Spinner animation="grow" variant="light" size="sm" style={{ marginRight: "6px" }} />;

  const onClickSetProxy = () => {
    if (proxy === "Y") {
      success("You already set proxy.");
      return;
    }

    setInProgress(true);

    witnessProxyKc(user.account, "upvu.proxy")
      .then((r) => {
        console.log(r);
        setProxy("Y");
        success("Set proxy successfully!");
        setInProgress(false);
      })
      .catch((err) => {
        console.log(err);
        error("Fail to set proxy");
        setInProgress(false);
      });
  };

  return (
    <>
      <div className="view-container">
        <div className="header">UPVU Status</div>

        <div className="content">
          <ValueDescWithTooltip
            val={`${formattedNumber(
              ((parseFloat(summary.total_reward) + summary.author_reward) / summary.total_sp) * 100,
              {
                fractionDigits: 2,
              }
            )}%`}
            desc={"Earning Rate"}
          >
            <>
              <p>(Liquid Steem Reward + Author Reward) / Your UPVU Power * 100</p>
            </>
          </ValueDescWithTooltip>
          <ValueDescWithTooltip val={`${selectedRewardType}`} desc={"Reward Type"}>
            <>
              <p>You receive Selected Reward Type Daily</p>
            </>
          </ValueDescWithTooltip>
          <div className="tooltip-format min-width-150">
            <Form.Row className="width-full">
              <Col lg={12}>
                <Form.Group>
                  <Form.Control className="claim-btn" type="button" value="Change Type" onClick={showDialog} />
                </Form.Group>
              </Col>
            </Form.Row>
          </div>
          <ValueDescWithTooltip val={`${proxy}`} desc={"Boost Reward"}>
            <>
              <p>You can get 100% STEEM Reward when you set up a proxy with @upvu.proxy. (otherwise 50%)</p>
            </>
          </ValueDescWithTooltip>
          <div className="tooltip-format min-width-150">
            <Form.Row className="width-full">
              <Col lg={12}>
                <Form.Group>
                  <Button disabled={proxy === "Y" || inProgress} block={true} onClick={onClickSetProxy}>
                    {inProgress && spinner}
                    Set Proxy
                  </Button>
                </Form.Group>
              </Col>
            </Form.Row>
          </div>
        </div>
      </div>
    </>
  );
};

const MyRewards = ({ summary }: UpvuInfoProps) => {
  return (
    <>
      <div className="view-container">
        <div className="header">My Rewards</div>

        <div className="content">
          <ValueDescWithTooltip
            val={`${formattedNumber(summary.total_reward, { fractionDigits: 3 })}`}
            desc="Liquid Steem"
          >
            <>
              <p>Your Total Liquid Steem Reward</p>
            </>
          </ValueDescWithTooltip>
          <ValueDescWithTooltip
            val={`${formattedNumber(summary.author_reward, { fractionDigits: 3 })}`}
            desc={"Author Reward"}
          >
            <>
              <p>Your Total Author Steem Reward</p>
            </>
          </ValueDescWithTooltip>
          <ValueDescWithTooltip
            val={`${formattedNumber(summary.trx_reward, {
              fractionDigits: 0,
            })}`}
            desc={"Tron Reward"}
          >
            <>
              <p>Total Received Tron Reward</p>
            </>
          </ValueDescWithTooltip>
          <ValueDescWithTooltip
            val={`${summary.interest_trx_reward ? summary.interest_trx_reward : 0}`}
            desc={"Tron Interest"}
          >
            <>
              <p>Interest on Vault operated by Tron</p>
            </>
          </ValueDescWithTooltip>
        </div>
      </div>
    </>
  );
};

const TronInformation = ({ summary }: UpvuInfoProps) => {
  return (
    <>
      <div className="view-container">
        <div className="header">Tron Rewards</div>

        <div className="content">
          <ValueDescWithTooltip
            val={`${formattedNumber(summary.trx_reward, {
              fractionDigits: 0,
            })}`}
            desc="Total Reward"
          >
            <>
              <p>Total Received Tron Reward</p>
            </>
          </ValueDescWithTooltip>

          <ValueDescWithTooltip
            val={`${formattedNumber(summary.claimed_trx_reward, {
              fractionDigits: 2,
            })}`}
            desc="Already Claimed"
          >
            <>
              <p>Claimed TRON Amount So Far</p>
            </>
          </ValueDescWithTooltip>

          <ValueDescWithTooltip
            val={`${formattedNumber(summary.remain_trx_reward, { fractionDigits: 2 })}`}
            desc="Available"
          >
            <>
              <p>Unclaimed remaining amount(Amount that can be claimed)</p>
            </>
          </ValueDescWithTooltip>
        </div>
      </div>
    </>
  );
};

const TronClaim = ({ account, summary, tron_address }: UpvuInfoProps) => {
  const [amount, setAmount] = useState(0);
  const [address, setAddress] = useState(tron_address ? tron_address : "");

  const onClickMax = () => {
    setAmount(summary.remain_trx_reward);
  };

  const onChangeAddress = (e: ChangeEvent<HTMLInputElement>): void => {
    setAddress(e.target.value);
  };

  const onChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const val = parseFloat(e.target.value);

    setAmount(val < 0 ? 0 : val);
  };

  const onClickClaim = () => {
    if (account) {
      if (!amount) {
        error("Please input amount.");
        return;
      }

      if (summary.remain_trx_reward < amount) {
        error("The quantity requested is greater than the claimable quantity.");
        return;
      }

      if (10 > amount) {
        error("The minimum claimable quantity is 10.");
        return;
      }

      requestClaimTronReward(account, address, amount)
        .then((r) => {
          console.log(r);
          if (r.result) {
            success("The claim was successful(It will be sent within 5 minutes.)");
          } else {
            error("Claim failed. Please refresh and try again.");
          }
        })
        .catch((err) => {
          console.log(err);
        });
    } else {
      console.log("Please login first");
    }
  };

  return (
    <>
      <div className="view-container">
        <div className="header">Claim Tron Reward</div>

        <div className="content">
          <Form.Row className="width-full">
            <Col lg={6}>
              <Form.Group>
                <Form.Label>Tron Address</Form.Label>
                <Form.Control type="text" value={address} maxLength={50} data-var="name" onChange={onChangeAddress} />
              </Form.Group>
            </Col>
            <Col lg={2}>
              <Form.Group>
                <Form.Label>Amount</Form.Label>
                <Form.Control type="number" value={amount} maxLength={10} data-var="name" onChange={onChange} />
              </Form.Group>
            </Col>
            <Col lg={2}>
              <Form.Group>
                <Form.Label>Max</Form.Label>
                <Form.Control className="max-btn" type="button" value="Max" onClick={onClickMax} />
              </Form.Group>
            </Col>
            <Col lg={2}>
              <Form.Group>
                <Form.Label>Claim</Form.Label>
                <Form.Control className="claim-btn" type="button" value="Claim Tron" onClick={onClickClaim} />
              </Form.Group>
            </Col>
          </Form.Row>
        </div>
      </div>
    </>
  );
};

const DelegationSP = ({ user_sp, upvu_delegate, user_steem, openTransferDialog }: UpvuInfoProps) => {
  const onClickDelegation = () => {
    openTransferDialog("delegate", "SP");
  };

  const onClickTransfer = () => {
    openTransferDialog("transfer", "STEEM");
  };

  return (
    <>
      <div className="view-container">
        <div className="header">Delegate Steem Power</div>

        <div className="content">
          <ValueDescWithTooltip
            val={`${formattedNumber(user_sp.account_sp - user_sp.delegatedOut_sp + upvu_delegate, {
              fractionDigits: 0,
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
                  <Form.Control className="claim-btn" type="button" value="Delegate" onClick={onClickDelegation} />
                </Form.Group>
              </Col>
            </Form.Row>
          </div>
          <ValueDescWithTooltip
            val={`${formattedNumber(user_steem, {
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
                  <Form.Control className="claim-btn" type="button" value="Transfer" onClick={onClickTransfer} />
                </Form.Group>
              </Col>
            </Form.Row>
          </div>
        </div>
      </div>
    </>
  );
};

const RefundSteem = ({ upvuToken, refund_steems, openTransferDialog }: UpvuInfoProps) => {
  const onClickTransferUpvu = () => {
    openTransferDialog("transfer", "UPVU", false);
  };

  const onClickRefundSteem = () => {
    openTransferDialog("transfer", "UPVU");
  };

  const calculateRefundDate = (requestDate: string) => {
    const nextMonday = new Date(requestDate);
    nextMonday.setDate(new Date(requestDate).getDate() + ((7 - new Date(requestDate).getDay()) % 7) + 1);
    const diffInDays = Math.round((nextMonday.getTime() - new Date(requestDate).getTime()) / (1000 * 60 * 60 * 24));
    return moment(requestDate)
      .add(diffInDays + 7, "day")
      .format("YYYY-MM-DD");
  };
  debugger;
  return (
    <>
      {
        <div className="view-container">
          <div className="header">UPVU Token & Refund Steem</div>

          <div className="content">
            <ValueDescWithTooltip
              val={`${
                upvuToken
                  ? formattedNumber(upvuToken, {
                      fractionDigits: 3,
                    })
                  : "0.000"
              }`}
              desc={"UPVU token balance"}
            >
              <>
                <p>Current UPVU token Amount</p>
              </>
            </ValueDescWithTooltip>
            <div className="tooltip-format min-width-150">
              <Form.Row className="width-full">
                <Col lg={12}>
                  <Form.Group>
                    <Form.Control
                      className="claim-btn"
                      type="button"
                      value="Transfer UPVU"
                      onClick={onClickTransferUpvu}
                    />
                  </Form.Group>
                </Col>
              </Form.Row>
            </div>
            <div className="tooltip-format min-width-150">
              <Form.Row className="width-full">
                <Col lg={12}>
                  <Form.Group>
                    <Form.Control
                      className="claim-btn"
                      type="button"
                      value="Refund Steem"
                      onClick={onClickRefundSteem}
                    />
                  </Form.Group>
                </Col>
              </Form.Row>
            </div>

            {refund_steems && refund_steems.length > 0 && (
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
              </div>
            )}
            {refund_steems &&
              refund_steems.map((data: any, idx: number) => (
                <div className="transaction-list-item" key={idx}>
                  <div className="upvu-token-title refund-timestamp">
                    <div className="upvu-token-upper">
                      {moment(new Date(data.str_timestamp)).format("YYYY-MM-DD HH:mm:ss")}
                    </div>
                  </div>
                  <div className="upvu-token-title refund-timestamp">
                    <div className="upvu-token-upper">
                      {calculateRefundDate(moment(new Date(data.str_timestamp)).format("YYYY-MM-DD HH:mm:ss"))}
                    </div>
                  </div>
                  <div className="upvu-token-title amount">
                    <div className="upvu-token-upper">
                      {`${formattedNumber(data.amount, {
                        fractionDigits: 3,
                      })}`}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      }
    </>
  );
};

const VotingHistory = ({ votings }: UpvuInfoProps) => {
  return (
    <div>
      <div
        className="transaction-list-item col-header"
        style={{
          backgroundColor: "#96c0ff",
          textAlign: "center",
        }}
      >
        <div className="transaction-title date">
          <div className="transaction-upper">Date</div>
        </div>
        <div className="transaction-title permlink">
          <div className="transaction-upper">Permlink</div>
        </div>
        <div className="transaction-title">
          <div className="transaction-upper">Delegation SP</div>
          <div className="transaction-bottom">UPVU Token</div>
        </div>
        <div className="transaction-title">
          <div className="transaction-upper">Voting Percent</div>
          <div className="transaction-bottom">Voting Value</div>
        </div>
        <div className="transaction-title">
          <div className="transaction-upper">SP Reward</div>
          <div className="transaction-bottom">SBD Reward</div>
        </div>
      </div>

      {votings ? (
        votings.map((voting, idx) => (
          <div className="transaction-list-item" key={idx}>
            <div className="transaction-title date">
              <div className="transaction-upper">{voting.planned_voting_dte}</div>
            </div>
            <div className="transaction-title permlink">
              <div className="transaction-upper">{voting.permlink}</div>
            </div>
            <div className="transaction-title">
              <div className="transaction-upper">{formattedNumber(voting.delegate_sp, { fractionDigits: 0 })} SP</div>
              <div className="transaction-bottom">
                {formattedNumber(voting.token_amount, { fractionDigits: 0 })} UPVU
              </div>
            </div>
            <div className="transaction-title">
              <div className="transaction-upper">{parseFloat(voting.applied_voting_rate) / 100}%</div>
              <div className="transaction-bottom">${voting.voting_value}</div>
            </div>
            <div className="transaction-title">
              <div className="transaction-upper">{voting.sp_reward} SP</div>
              <div className="transaction-bottom">{voting.sbd_reward} SBD</div>
            </div>
          </div>
        ))
      ) : (
        <LinearProgress />
      )}
    </div>
  );
};

const RewardHistory = ({ rewards, isKrw }: UpvuInfoProps) => {
  return (
    <div>
      <div
        className="transaction-list-item col-header"
        style={{
          backgroundColor: "#96c0ff",
          textAlign: "center",
        }}
      >
        <div className="transaction-title date">
          <div className="transaction-upper">Date</div>
          <div className="transaction-bottom">Joined Amount</div>
        </div>
        <div className="transaction-title">
          <div className="transaction-upper">{`Price(${isKrw ? "원" : "USD"})`}</div>
          <div className="transaction-bottom">STEEM/SBD/TRON</div>
        </div>
        <div className="transaction-title">
          <div className="transaction-upper">UPVU Reward</div>
        </div>
        <div className="transaction-title">
          <div className="transaction-upper">Posting Reward</div>
        </div>
        <div className="transaction-title">
          <div className="transaction-upper">Total Reward</div>
        </div>
        <div className="transaction-title">
          <div className="transaction-upper">APR</div>
        </div>
      </div>

      {rewards ? (
        rewards.map((reward, idx) => (
          <div className="transaction-list-item" key={idx}>
            <div className="transaction-title date">
              <div className="transaction-upper">{reward.reward_dte}</div>
              <div className="transaction-bottom">{formattedNumber(reward.amount, { fractionDigits: 0 })}</div>
            </div>
            <div className="transaction-title">
              <div className="transaction-upper center">
                {isKrw
                  ? `${reward.steem_krw}/${reward.sbd_krw}/${reward.trx_krw}`
                  : `${reward.steem_usd}/${reward.sbd_usd}/${reward.trx_usd}`}
              </div>
            </div>
            <div className="transaction-title">
              <div className="transaction-upper center">
                {formattedNumber(reward.steem_reward, { fractionDigits: 3 })} STEEM
              </div>
              <div className="transaction-bottom center">
                {formattedNumber(reward.tron_reward, { fractionDigits: 3 })} TRX
              </div>
            </div>
            <div className="transaction-title">
              <div className="transaction-upper center">
                {formattedNumber(reward.author_sp, { fractionDigits: 3 })} SP
              </div>
              <div className="transaction-bottom center">
                {formattedNumber(reward.author_sbd, { fractionDigits: 3 })} SBD
              </div>
              <div className="transaction-bottom center">
                {formattedNumber(reward.author_steem, { fractionDigits: 3 })} STEEM
              </div>
            </div>
            <div className="transaction-title">
              <div className="transaction-upper center">
                {isKrw
                  ? formattedNumber(reward.total_krw, { fractionDigits: 0 })
                  : formattedNumber(reward.total_usd, { fractionDigits: 1 })}{" "}
                {`${isKrw ? "원" : "USD"}`}
              </div>
            </div>
            <div className="transaction-title">
              <div className="transaction-upper center">
                {formattedNumber(reward.annual_profit, { fractionDigits: 2 })}%
              </div>
            </div>
          </div>
        ))
      ) : (
        <LinearProgress />
      )}
    </div>
  );
};

const DelegationHistory = ({ delegate }: UpvuInfoProps) => {
  return (
    <div>
      <div
        className="transaction-list-item col-header"
        style={{
          backgroundColor: "#96c0ff",
          textAlign: "center",
        }}
      >
        <div className="transaction-title date">
          <div className="transaction-upper">Date</div>
        </div>

        <div className="transaction-title">
          <div className="transaction-upper">Kind</div>
        </div>
        <div className="transaction-title">
          <div className="transaction-upper">Steem Power</div>
        </div>
      </div>

      {delegate ? (
        delegate.map((delegation, idx) => (
          <div className="transaction-list-item" key={idx}>
            <div className="transaction-title date">
              <div className="transaction-upper">{delegation.date}</div>
            </div>
            <div className="transaction-title">
              <div className="transaction-upper center">{delegation.knd}</div>
            </div>
            <div className="transaction-title">
              <div className="transaction-upper center">{delegation.sp}</div>
            </div>
          </div>
        ))
      ) : (
        <LinearProgress />
      )}
    </div>
  );
};

const UpvuTokenTransaction = ({ transactions }: UpvuToken) => {
  return (
    <div>
      <div
        className="transaction-list-item col-header"
        style={{
          backgroundColor: "#96c0ff",
          textAlign: "center",
        }}
      >
        <div className="upvu-token-title timestamp">
          <div className="upvu-token-upper">Date</div>
        </div>

        <div className="upvu-token-title account">
          <div className="upvu-token-upper">From</div>
        </div>
        <div className="upvu-token-title account">
          <div className="upvu-token-upper">To</div>
        </div>
        <div className="upvu-token-title type">
          <div className="upvu-token-upper">Type</div>
        </div>
        <div className="upvu-token-title amount">
          <div className="upvu-token-upper">Amount</div>
        </div>
        <div className="upvu-token-title amount">
          <div className="upvu-token-upper">Balance</div>
        </div>
      </div>

      {transactions ? (
        transactions.map((transaction, idx) => (
          <div className="transaction-list-item" key={idx}>
            <div className="upvu-token-title timestamp">
              <div className="upvu-token-upper">
                {moment(new Date(transaction.createdAt)).format("YYYY-MM-DD HH:mm:ss")}
              </div>
            </div>
            <div className="upvu-token-title account">
              <div className="upvu-token-upper center">@{transaction.from}</div>
            </div>
            <div className="upvu-token-title account">
              <div className="upvu-token-upper">@{transaction.to}</div>
            </div>
            <div className="upvu-token-title type">
              <div className="upvu-token-upper">{transaction.type}</div>
            </div>
            <div className="upvu-token-title amount">
              <div className="upvu-token-upper">{formattedNumber(transaction.amount, { fractionDigits: 3 })}</div>
            </div>
            <div className="upvu-token-title amount">
              <div className="upvu-token-upper">{formattedNumber(transaction.after_amount, { fractionDigits: 3 })}</div>
            </div>
          </div>
        ))
      ) : (
        <LinearProgress />
      )}
    </div>
  );
};

const ShowSetTypeDialog = ({ onHide, children }: SetTypeDialogProps) => {
  return (
    <Modal animation={false} show={true} centered={true} onHide={onHide} keyboard={false} className="dialog" size="lg">
      <Modal.Header className="dialog-header" closeButton={true}>
        Choose Reward Type
      </Modal.Header>
      <Modal.Body className="dialog-body">{children}</Modal.Body>
    </Modal>
  );
};

export default (p: Props) => {
  const props = {
    global: p.global,
    history: p.history,
    dynamicProps: p.dynamicProps,
    account: p.account,
    activeUser: p.activeUser,
    transactions: p.transactions,
    signingKey: p.signingKey,
    upvuToken: p.upvuToken,
    addAccount: p.addAccount,
    updateActiveUser: p.updateActiveUser,
    setSigningKey: p.setSigningKey,
    updateWalletValues: p.updateWalletValues,
    fetchPoints: p.fetchPoints,
    fetchUpvuToken: p.fetchUpvuToken,
  };

  return <WalletUPVUInfos {...props} />;
};
