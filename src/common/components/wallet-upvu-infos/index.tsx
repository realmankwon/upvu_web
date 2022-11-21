import React, { ChangeEvent, useState } from "react";
import { Form, Col, FormControl } from "react-bootstrap";

import { Global } from "../../store/global/types";
import { Account } from "../../store/accounts/types";
import { DynamicProps } from "../../store/dynamic-props/types";
import { Transactions } from "../../store/transactions/types";
import { ActiveUser } from "../../store/active-user/types";

import BaseComponent from "../base";
import LinearProgress from "../linear-progress";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { getUPVUInfos, requestClaimTronReward } from "../../api/private-api";

import { informationVariantSvg } from "../../img/svg";
import formattedNumber from "../../util/formatted-number";

import { _t } from "../../i18n";
import { ValueDescView } from "../value-desc-view";

interface Props {
  global: Global;
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
}

const historyKindArray = ["Voting History", "Reward History(KRW)", "Reward History(USD)", "Delegation History"];

export class WalletUPVUInfos extends BaseComponent<Props, State> {
  state: State = {
    loading: true,
    upvuInfos: null,
    selectedHistory: historyKindArray[0],
    isSmaeAccount: false,
    isUPVUUser: false,
  };

  componentDidMount() {
    const { activeUser } = this.props;
    const accountInPath = window.location.pathname.match(new RegExp(/@[\w]+/));
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

  render() {
    const { account } = this.props;
    const { upvuInfos, loading, selectedHistory, isSmaeAccount, isUPVUUser } = this.state;

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
                  <MyInformation {...upvuInfos} />
                  <AdditionalInformation {...upvuInfos} />
                  <TronInformation {...upvuInfos} />
                  <TronClaim {...upvuInfos} account={account} />
                  <DelegationSP {...upvuInfos} />
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
                        {historyKindArray.map((x) => (
                          <option key={x} value={x}>
                            {x}
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
                  <div className="header">
                    <div>You are not UPVU user.</div>
                    <div>You can become a UPVU user by delegating Steem power or sending Steem to @upvu account.</div>
                    <div>Effective from the next day after SP delegation or Steam transfer.</div>
                  </div>
                  <DelegationSP {...upvuInfos} />
                </div>
              ) : (
                <div />
              )}
            </div>
          )
        ) : (
          <div>You can only see the information of the logged in account</div>
        )}
      </div>
    );
  }
}

const MyInformation = ({ user_sp, summary }: UpvuInfoProps) => {
  return (
    <>
      {/* My Information */}
      <div className="view-container">
        <div className="header">My Information</div>

        <div className="content">
          <div className="tooltip-format">
            <ValueDescView val={formattedNumber(user_sp.account_sp, { fractionDigits: 3 })} desc="Your Steem Power" />
          </div>
          <div className="tooltip-format">
            <ValueDescView val={`${formattedNumber(summary.total_sp, { fractionDigits: 0 })}`} desc="Joined Amount" />
            <div className="">
              <OverlayTrigger
                delay={{ show: 0, hide: 300 }}
                key={"bottom"}
                placement={"top"}
                overlay={
                  <Tooltip id={`tooltip-info`}>
                    <div className="tooltip-inner">
                      <div className="profile-info-tooltip-content">
                        <p>Steem Power: {formattedNumber(summary.delegated_sp, { fractionDigits: 2 })}</p>
                        <p>UPVU Token: {formattedNumber(summary.token_amount, { fractionDigits: 2 })}</p>
                      </div>
                    </div>
                  </Tooltip>
                }
              >
                <div className="d-flex align-items-center">
                  <span className="info-icon mr-0 mr-md-2">{informationVariantSvg}</span>
                </div>
              </OverlayTrigger>
            </div>
          </div>
          {/* <ValueDescView
            val={`${summary.total_sp}(${summary.delegated_sp} SP + ${summary.token_amount} UPVU)`}
            desc="Joined Amount"
          /> */}
          <div className="tooltip-format">
            <ValueDescView
              val={`${formattedNumber(summary.total_reward, { fractionDigits: 2 })}`}
              desc="Total Steem Reward"
            />
            <div className="">
              <OverlayTrigger
                delay={{ show: 0, hide: 300 }}
                key={"bottom"}
                placement={"top"}
                overlay={
                  <Tooltip id={`tooltip-info`}>
                    <div className="tooltip-inner">
                      <div className="profile-info-tooltip-content">
                        <p>Your Total Liquid Steem Reward</p>
                      </div>
                    </div>
                  </Tooltip>
                }
              >
                <div className="d-flex align-items-center">
                  <span className="info-icon mr-0 mr-md-2">{informationVariantSvg}</span>
                </div>
              </OverlayTrigger>
            </div>
          </div>
          <div className="tooltip-format">
            <ValueDescView
              val={`${formattedNumber(summary.author_reward, { fractionDigits: 2 })}`}
              desc="Total Author Reward"
            />
            <div className="">
              <OverlayTrigger
                delay={{ show: 0, hide: 300 }}
                key={"bottom"}
                placement={"top"}
                overlay={
                  <Tooltip id={`tooltip-info`}>
                    <div className="tooltip-inner">
                      <div className="profile-info-tooltip-content">
                        <p>Your Total Author Steem Reward</p>
                      </div>
                    </div>
                  </Tooltip>
                }
              >
                <div className="d-flex align-items-center">
                  <span className="info-icon mr-0 mr-md-2">{informationVariantSvg}</span>
                </div>
              </OverlayTrigger>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const AdditionalInformation = ({ summary, user }: UpvuInfoProps) => {
  return (
    <>
      {/* Additional Information */}
      <div className="view-container">
        <div className="header">Additional Information</div>

        <div className="content">
          <div className="tooltip-format">
            <ValueDescView
              val={`${formattedNumber(
                ((parseFloat(summary.total_reward) + summary.author_reward) / summary.total_sp) * 100,
                {
                  fractionDigits: 2,
                }
              )}%`}
              desc="Earning Rate"
            />
            <div className="">
              <OverlayTrigger
                delay={{ show: 0, hide: 300 }}
                key={"bottom"}
                placement={"top"}
                overlay={
                  <Tooltip id={`tooltip-info`}>
                    <div className="tooltip-inner">
                      <div className="profile-info-tooltip-content">
                        <p>(Total Steem Reward + Total Author Reward) / Joined Amount * 100</p>
                      </div>
                    </div>
                  </Tooltip>
                }
              >
                <div className="d-flex align-items-center">
                  <span className="info-icon mr-0 mr-md-2">{informationVariantSvg}</span>
                </div>
              </OverlayTrigger>
            </div>
          </div>
          <div className="tooltip-format">
            <ValueDescView val={`${user.reward_type}`} desc="Reward Type" />
            <div className="">
              <OverlayTrigger
                delay={{ show: 0, hide: 300 }}
                key={"bottom"}
                placement={"top"}
                overlay={
                  <Tooltip id={`tooltip-info`}>
                    <div className="tooltip-inner">
                      <div className="profile-info-tooltip-content">
                        <p>You receive Selected Reward Type Daily</p>
                      </div>
                    </div>
                  </Tooltip>
                }
              >
                <div className="d-flex align-items-center">
                  <span className="info-icon mr-0 mr-md-2">{informationVariantSvg}</span>
                </div>
              </OverlayTrigger>
            </div>
          </div>
          <div className="tooltip-format">
            <ValueDescView val={`${user.proxy}`} desc="Boost Reward" />
            <div className="">
              <OverlayTrigger
                delay={{ show: 0, hide: 300 }}
                key={"bottom"}
                placement={"top"}
                overlay={
                  <Tooltip id={`tooltip-info`}>
                    <div className="tooltip-inner">
                      <div className="profile-info-tooltip-content">
                        <p>You can get 100% STEEM Reward when you set up a proxy with @upvu.proxy. (otherwise 50%)</p>
                      </div>
                    </div>
                  </Tooltip>
                }
              >
                <div className="d-flex align-items-center">
                  <span className="info-icon mr-0 mr-md-2">{informationVariantSvg}</span>
                </div>
              </OverlayTrigger>
            </div>
          </div>

          <div className="tooltip-format">
            <ValueDescView
              val={`${formattedNumber(summary.today_voting_rate / 100, { fractionDigits: 2 })}%`}
              desc="Today Voting Rate"
            />
            <div className="">
              <OverlayTrigger
                delay={{ show: 0, hide: 300 }}
                key={"bottom"}
                placement={"top"}
                overlay={
                  <Tooltip id={`tooltip-info`}>
                    <div className="tooltip-inner">
                      <div className="profile-info-tooltip-content">
                        <p>Today Upvoting Rate from @upvu</p>
                      </div>
                    </div>
                  </Tooltip>
                }
              >
                <div className="d-flex align-items-center">
                  <span className="info-icon mr-0 mr-md-2">{informationVariantSvg}</span>
                </div>
              </OverlayTrigger>
            </div>
          </div>
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
        <div className="header">Tron Reward Information</div>

        <div className="content">
          <div className="tooltip-format">
            <ValueDescView
              val={`${formattedNumber(summary.trx_reward, {
                fractionDigits: 0,
              })}`}
              desc="Total Reward"
            />
            <div className="">
              <OverlayTrigger
                delay={{ show: 0, hide: 300 }}
                key={"bottom"}
                placement={"top"}
                overlay={
                  <Tooltip id={`tooltip-info`}>
                    <div className="tooltip-inner">
                      <div className="profile-info-tooltip-content">
                        <p>Total Received Tron Reward</p>
                      </div>
                    </div>
                  </Tooltip>
                }
              >
                <div className="d-flex align-items-center">
                  <span className="info-icon mr-0 mr-md-2">{informationVariantSvg}</span>
                </div>
              </OverlayTrigger>
            </div>
          </div>
          <div className="tooltip-format">
            <ValueDescView
              val={`${summary.interest_trx_reward ? summary.interest_trx_reward : 0}`}
              desc="Interest Reward"
            />
            <div className="">
              <OverlayTrigger
                delay={{ show: 0, hide: 300 }}
                key={"bottom"}
                placement={"top"}
                overlay={
                  <Tooltip id={`tooltip-info`}>
                    <div className="tooltip-inner">
                      <div className="profile-info-tooltip-content">
                        <p>Interest on Vault operated by Tron</p>
                      </div>
                    </div>
                  </Tooltip>
                }
              >
                <div className="d-flex align-items-center">
                  <span className="info-icon mr-0 mr-md-2">{informationVariantSvg}</span>
                </div>
              </OverlayTrigger>
            </div>
          </div>
          <div className="tooltip-format">
            <ValueDescView
              val={`${formattedNumber(summary.claimed_trx_reward, {
                fractionDigits: 2,
              })}`}
              desc="Claimed Amount"
            />
            <div className="">
              <OverlayTrigger
                delay={{ show: 0, hide: 300 }}
                key={"bottom"}
                placement={"top"}
                overlay={
                  <Tooltip id={`tooltip-info`}>
                    <div className="tooltip-inner">
                      <div className="profile-info-tooltip-content">
                        <p>Claimed TRON Amount So Far</p>
                      </div>
                    </div>
                  </Tooltip>
                }
              >
                <div className="d-flex align-items-center">
                  <span className="info-icon mr-0 mr-md-2">{informationVariantSvg}</span>
                </div>
              </OverlayTrigger>
            </div>
          </div>

          <div className="tooltip-format">
            <ValueDescView
              val={`${formattedNumber(summary.remain_trx_reward, { fractionDigits: 2 })}`}
              desc="Remained Reward"
            />
            <div className="">
              <OverlayTrigger
                delay={{ show: 0, hide: 300 }}
                key={"bottom"}
                placement={"top"}
                overlay={
                  <Tooltip id={`tooltip-info`}>
                    <div className="tooltip-inner">
                      <div className="profile-info-tooltip-content">
                        <p>Unclaimed remaining amount(Amount that can be claimed)</p>
                      </div>
                    </div>
                  </Tooltip>
                }
              >
                <div className="d-flex align-items-center">
                  <span className="info-icon mr-0 mr-md-2">{informationVariantSvg}</span>
                </div>
              </OverlayTrigger>
            </div>
          </div>
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

const DelegationSP = ({ summary, user_sp, upvu_delegate, user_steem }: UpvuInfoProps) => {
  const [amount, setAmount] = useState(0);

  const onClickMax = () => {
    setAmount(summary.remain_trx_reward);
  };

  const onChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const val = parseFloat(e.target.value);

    setAmount(val < 0 ? 0 : val);
  };

  const onClickClaim = () => {
    console.log("cliaasdflkjasd;flkjas;dlkfsad");
  };

  return (
    <>
      <div className="view-container">
        <div className="header">Delegate Steem Power</div>

        <div className="content">
          <div className="tooltip-format">
            <ValueDescView
              val={`${formattedNumber(user_sp.account_sp - user_sp.delegatedOut_sp + upvu_delegate, {
                fractionDigits: 0,
              })}`}
              desc="Available Amount"
            />
            <div className="">
              <OverlayTrigger
                delay={{ show: 0, hide: 300 }}
                key={"bottom"}
                placement={"top"}
                overlay={
                  <Tooltip id={`tooltip-info`}>
                    <div className="tooltip-inner">
                      <div className="profile-info-tooltip-content">
                        <p>Maximum Delegation Possible Amount.</p>
                        <p>You must leave a minimum amount for the activity.</p>
                        <p>Depending on the % of the current voting power, the available amount may vary.</p>
                      </div>
                    </div>
                  </Tooltip>
                }
              >
                <div className="d-flex align-items-center">
                  <span className="info-icon mr-0 mr-md-2">{informationVariantSvg}</span>
                </div>
              </OverlayTrigger>
            </div>
          </div>
          <div className="tooltip-format">
            <ValueDescView
              val={`${formattedNumber(user_steem, {
                fractionDigits: 3,
              })}`}
              desc="Steem Balance"
            />
            <div className="">
              <OverlayTrigger
                delay={{ show: 0, hide: 300 }}
                key={"bottom"}
                placement={"top"}
                overlay={
                  <Tooltip id={`tooltip-info`}>
                    <div className="tooltip-inner">
                      <div className="profile-info-tooltip-content">
                        <p>Current STEEM Amount</p>
                      </div>
                    </div>
                  </Tooltip>
                }
              >
                <div className="d-flex align-items-center">
                  <span className="info-icon mr-0 mr-md-2">{informationVariantSvg}</span>
                </div>
              </OverlayTrigger>
            </div>
          </div>
          <div>
            <Form.Row className="width-full">
              <Col lg={4}>
                <Form.Group>
                  <Form.Label>Amount</Form.Label>
                  <Form.Control type="number" value={amount} maxLength={10} data-var="name" onChange={onChange} />
                </Form.Group>
              </Col>
              <Col lg={4}>
                <Form.Group>
                  <Form.Label>Delegate</Form.Label>
                  <Form.Control className="max-btn" type="button" value="Delegate" onClick={onClickMax} />
                </Form.Group>
              </Col>
              <Col lg={4}>
                <Form.Group>
                  <Form.Label>Transfer</Form.Label>
                  <Form.Control className="claim-btn" type="button" value="Transfer" onClick={onClickClaim} />
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

export default (p: Props) => {
  const props = {
    global: p.global,
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
