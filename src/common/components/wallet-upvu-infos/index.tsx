import React, { ChangeEvent, useState } from "react";
import { Form, Col, FormControl } from "react-bootstrap";

import { History } from "history";

import { Global } from "../../store/global/types";
import { Account } from "../../store/accounts/types";
import { DynamicProps } from "../../store/dynamic-props/types";
import { Transactions } from "../../store/transactions/types";
import { ActiveUser } from "../../store/active-user/types";

import BaseComponent from "../base";
import LinearProgress from "../linear-progress";
import { OverlayTrigger, Tooltip, Modal } from "react-bootstrap";
import { getUPVUInfos, requestClaimTronReward } from "../../api/private-api";
import DelegatedVesting from "../delegated-vesting";
import Transfer, { TransferMode, TransferAsset } from "../transfer";

import { informationVariantSvg } from "../../img/svg";
import formattedNumber from "../../util/formatted-number";

import { _t } from "../../i18n";
import { ValueDescView } from "../value-desc-view";
import { render } from "../../../server/template";

interface Props {
  global: Global;
  history: History;
  dynamicProps: DynamicProps;
  account: Account;
  activeUser: ActiveUser | null;
  transactions: Transactions;
  signingKey: string;
  addAccount: (data: Account) => void;
  updateActiveUser: (data?: Account) => void;
  setSigningKey: (key: string) => void;
  fetchPoints: (username: string, type?: number) => void;
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
}

interface State {
  loading: boolean;
  upvuInfos: UpvuInfoProps | null;
  selectedHistory: string;
  isSmaeAccount: boolean;
  isUPVUUser: boolean;
  showTransferDialog: boolean;
  showDelegationDialog: boolean;
  transferMode: null | TransferMode;
  transferAsset: null | TransferAsset;
}

// {transfer && (
//   <Transfer
//     {...this.props}
//     activeUser={activeUser!}
//     to={isMyPage ? undefined : account.name}
//     mode={transferMode!}
//     asset={transferAsset!}
//     onHide={this.closeTransferDialog}

interface ValueDescWithTooltipProps {
  val: any;
  desc: string;
  children: JSX.Element;
  existIcon?: boolean;
}

interface DialogProps {
  showDialog: boolean;
  children: JSX.Element;
}

const historyKindArray = ["Voting History", "Reward History(KRW)", "Reward History(USD)", "Delegation History"];

export class WalletUPVUInfos extends BaseComponent<Props, State> {
  state: State = {
    loading: true,
    upvuInfos: null,
    selectedHistory: historyKindArray[0],
    isSmaeAccount: false,
    isUPVUUser: false,
    showTransferDialog: false,
    showDelegationDialog: false,
    transferMode: null,
    transferAsset: null,
  };

  componentDidMount() {
    const { activeUser } = this.props;
    const accountInPath = window.location.pathname.match(new RegExp(/@[\w.\-]+/));
    const account = activeUser ? activeUser?.username : "";

    if (account && accountInPath && accountInPath.length && accountInPath[0].indexOf(`@${account}`) > -1) {
      this.setState({ isSmaeAccount: true });
      getUPVUInfos(account).then((r) => {
        if (r.success) {
          const upvuInfo = r.infos as UpvuInfoProps;

          if (upvuInfo.summary.total_sp) {
            this.setState({ upvuInfos: r.infos, loading: false, isUPVUUser: true });
          } else {
            this.setState({ upvuInfos: r.infos, loading: false, isUPVUUser: false });
          }
        } else {
          alert("fail to load upvuInfos list");
        }
      });
    } else {
      this.setState({ isSmaeAccount: false });
    }
  }

  componentWillUnmount() {
    this.setState({ isSmaeAccount: false });
  }

  filterChanged = (e: React.ChangeEvent<typeof FormControl & HTMLInputElement>) => {
    this.setState({ selectedHistory: e.target.value });
  };

  openTransferDialog = (mode: TransferMode, asset: TransferAsset) => {
    this.setState({ showTransferDialog: true, transferMode: mode, transferAsset: asset });
  };

  closeTransferDialog = () => {
    this.setState({ showTransferDialog: false, transferMode: null, transferAsset: null });
  };

  // openDelegationDialog = (mode: TransferMode, asset: TransferAsset) => {
  //   this.setState({ showTransferDialog: true, transferMode: mode, transferAsset: asset });
  // };

  // closeDelegationDialog = () => {
  //   this.setState({ showDelegationDialog: false, transferMode: null, transferAsset: null });
  // };

  render() {
    const { account, activeUser } = this.props;
    const {
      upvuInfos,
      loading,
      selectedHistory,
      isSmaeAccount,
      isUPVUUser,
      showTransferDialog,
      showDelegationDialog,
      transferMode,
      transferAsset,
    } = this.state;

    if (!account.__loaded) {
      return null;
    }

    return (
      <div className="wallet-upvu">
        {isSmaeAccount ? (
          loading ? (
            <LinearProgress />
          ) : (
            <div>
              {isUPVUUser && upvuInfos ? (
                <div>
                  <MyUpvuPower {...upvuInfos} />
                  <UPVUStatus {...upvuInfos} />
                  <MyRewards {...upvuInfos} />
                  <DelegationSP {...upvuInfos} openTransferDialog={this.openTransferDialog} />
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
                  ) : (
                    <DelegationHistory {...upvuInfos} />
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
                  <DelegationSP {...upvuInfos} />
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
            to={isSmaeAccount ? undefined : account.name}
            mode={transferMode!}
            asset={transferAsset!}
            onHide={this.closeTransferDialog}
          />
        )}

        {/* <ShowDialog showDialog={} /> */}
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

const MyUpvuPower = ({ user_sp, summary }: UpvuInfoProps) => {
  return (
    <>
      <div className="view-container">
        <div className="header">My UPVU Power</div>

        <div className="content">
          <ValueDescWithTooltip val={formattedNumber(summary.total_sp, { fractionDigits: 0 })} desc={"Total Amount"}>
            <>
              <p>Delegated SP + UPVU Token</p>
            </>
          </ValueDescWithTooltip>

          <ValueDescWithTooltip
            val={formattedNumber(summary.delegated_sp, { fractionDigits: 2 })}
            desc={"Delegated SP"}
          >
            <>
              <p>Delegated Amount to @upvu</p>
            </>
          </ValueDescWithTooltip>
          <ValueDescWithTooltip val={formattedNumber(summary.token_amount, { fractionDigits: 2 })} desc={"UPVU Token"}>
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

const UPVUStatus = ({ summary, user }: UpvuInfoProps) => {
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
          <ValueDescWithTooltip val={`${user.reward_type}`} desc={"Reward Type"}>
            <>
              <p>You receive Selected Reward Type Daily</p>
            </>
          </ValueDescWithTooltip>
          <div className="tooltip-format min-width-150">
            <Form.Row className="width-full">
              <Col lg={12}>
                <Form.Group>
                  {/* <Form.Label> </Form.Label> */}
                  <Form.Control className="claim-btn" type="button" value="Set Type" onClick={() => {}} />
                </Form.Group>
              </Col>
            </Form.Row>
          </div>
          <ValueDescWithTooltip val={`${user.proxy}`} desc={"Boost Reward"}>
            <>
              <p>You can get 100% STEEM Reward when you set up a proxy with @upvu.proxy. (otherwise 50%)</p>
            </>
          </ValueDescWithTooltip>
          <div className="tooltip-format min-width-150">
            <Form.Row className="width-full">
              <Col lg={12}>
                <Form.Group>
                  {/* <Form.Label> </Form.Label> */}
                  <Form.Control className="claim-btn" type="button" value="Set Proxy" onClick={() => {}} />
                </Form.Group>
              </Col>
            </Form.Row>
          </div>
        </div>
      </div>
    </>
  );
};

const MyRewards = ({ summary, user }: UpvuInfoProps) => {
  return (
    <>
      {/* Additional Information */}
      <div className="view-container">
        <div className="header">My Rewards</div>

        <div className="content">
          <ValueDescWithTooltip
            val={`${formattedNumber(summary.total_reward, { fractionDigits: 2 })}`}
            desc="Liquid Steem"
          >
            <>
              <p>Your Total Liquid Steem Reward</p>
            </>
          </ValueDescWithTooltip>
          <ValueDescWithTooltip
            val={`${formattedNumber(summary.author_reward, { fractionDigits: 2 })}`}
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
      {/* Tron Information */}
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
      requestClaimTronReward(account, address, amount)
        .then((r) => {
          console.log(r);
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

const DelegationSP = ({ summary, user_sp, upvu_delegate, user_steem, openTransferDialog }: UpvuInfoProps | any) => {
  // const [delegationAmount, setDelegationAmount] = useState(0);
  // const [transferAmount, setTransferAmount] = useState(0);
  // const maxDelegationAmount = user_sp.account_sp - user_sp.delegatedOut_sp + upvu_delegate;
  // const maxTransferAmount = parseFloat(user_steem);

  // const onClickDelegationMax = () => {
  //   setDelegationAmount(maxDelegationAmount);
  // };

  // const onChangeDelegation = (e: ChangeEvent<HTMLInputElement>): void => {
  //   const val = parseFloat(e.target.value);

  //   setDelegationAmount(val < 0 ? 0 : val);
  // };

  const onClickDelegation = () => {
    openTransferDialog("delegate", "SP");
  };

  // const onClickTransferMax = () => {
  //   setTransferAmount(maxTransferAmount);
  // };

  // const onChangeTransfer = (e: ChangeEvent<HTMLInputElement>): void => {
  //   const val = parseFloat(e.target.value);

  //   setTransferAmount(val < 0 ? 0 : val);
  // };

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
                  {/* <Form.Label></Form.Label> */}
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
                  {/* <Form.Label></Form.Label> */}
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

const ShowDialog = ({ showDialog, children }: DialogProps) => {
  const [show, setShow] = useState(showDialog);

  const onClickClose = () => {
    setShow(false);
  };

  return (
    <Modal
      animation={false}
      show={show}
      centered={true}
      onHide={onClickClose}
      keyboard={false}
      className="transfer-dialog modal-thin-header"
      size="lg"
    >
      <Modal.Header closeButton={true} />
      <Modal.Body>{children}</Modal.Body>
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
    addAccount: p.addAccount,
    updateActiveUser: p.updateActiveUser,
    setSigningKey: p.setSigningKey,
    updateWalletValues: p.updateWalletValues,
    fetchPoints: p.fetchPoints,
  };

  return <WalletUPVUInfos {...props} />;
};
