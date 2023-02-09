import React from "react";
import { Button, Form, Col, FormControl, Spinner } from "react-bootstrap";
import { History } from "history";
import htmlParse from "html-react-parser";

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

import WalletMenu from "../wallet-menu";
import { earnUses, earnHsts, earnSummary } from "../../api/private-api";

interface Props {
  history: History;
  global: Global;
  dynamicProps: DynamicProps;
  activeUser: ActiveUser | null;
  transactions: Transactions;
  account: Account;
  signingKey: string;
  addAccount: (data: Account) => void;
  updateActiveUser: (data?: Account) => void;
  setSigningKey: (key: string) => void;
  fetchTransactions: (username: string, steemengine: boolean, group?: OperationGroup | "") => void;
  fetchPoints: (username: string, type?: number) => void;
  updateWalletValues: () => void;
  steemengine: boolean;
}

interface EarnUsesProps {
  account: string;
  earn_type: string;
  earn_symbol: string;
}

interface EarnHstsKeyProps {
  username: string;
  earn_account: string;
}

interface EarnHstsProps {
  username: string;
  earn_account: string;
  reward_dte: string;
  delegate_dte: string;
  deposit_steem_amount: string;
  earn_steem: string;
  earn_amount: number;
  fee: number;
  earn_symbol: string;
}

interface EarnSummaryProps {
  steem_amount: string;
  earn_amount: number;
  fee: number;
  earn_symbol: string;
}

interface EarnHstsArrayProps {
  earnHstsInfo: EarnHstsProps[];
}

interface ValueDescWithTooltipProps {
  val: any;
  desc: string;
  children: JSX.Element;
  existIcon?: boolean;
}

let earnUsesArray: string[] = [];

interface State {
  loading: boolean;
  isSameAccount: boolean;
  isEarnUser: boolean;
  earnUsesInfo: EarnUsesProps[];
  earnHstsInfo: EarnHstsProps[];
  earnSummaryInfo: EarnSummaryProps[];
  selectedHistory: string;
  showTransferDialog: boolean;
  transferMode: null | TransferMode;
  transferAsset: null | TransferAsset;
  converting: number;
}

export class WalletEarn extends BaseComponent<Props, State> {
  state: State = {
    loading: true,
    isSameAccount: false,
    isEarnUser: false,
    earnUsesInfo: [],
    earnHstsInfo: [],
    earnSummaryInfo: [],
    selectedHistory: "",
    showTransferDialog: false,
    transferMode: null,
    transferAsset: null,
    converting: 0,
  };

  componentDidMount() {
    this.fetchEarnInfo();
  }

  fetchEarnInfo = async () => {
    const { activeUser } = this.props;
    const accountInPath = window.location.pathname.match(new RegExp(/@[\w.\-]+/));
    const username = activeUser ? activeUser?.username : "";

    if (username && accountInPath && accountInPath.length && accountInPath[0].indexOf(`@${username}`) > -1) {
      this.setState({ isSameAccount: true });

      earnUsesArray = [];
      const resultEarnUses = await earnUses(username);

      if (resultEarnUses.length > 0) {
        resultEarnUses.map((data: EarnUsesProps) =>
          earnUsesArray.push(`${data.account}-${data.earn_type}-${data.earn_symbol}`)
        );

        let resultEarnHsts = await earnHsts(username, resultEarnUses[0].account);

        this.setState({
          earnUsesInfo: resultEarnUses,
          earnHstsInfo: resultEarnHsts,
          isEarnUser: true,
          loading: false,
          selectedHistory: earnUsesArray[0],
        });
      } else {
        this.setState({ earnUsesInfo: [], isEarnUser: false, loading: false, selectedHistory: "" });
      }
    } else {
      this.setState({ isSameAccount: false });
    }
  };

  componentWillUnmount() {
    this.setState({ isSameAccount: false });
  }

  filterChanged = (e: React.ChangeEvent<typeof FormControl & HTMLInputElement>) => {
    const { account } = this.props;
    earnHsts(account.name, e.target.value.split("-")[0]).then((result) => {
      this.setState({ earnHstsInfo: result });
    });
  };

  openTransferDialog = (mode: TransferMode, asset: TransferAsset) => {
    this.setState({ showTransferDialog: true, transferMode: mode, transferAsset: asset });
  };

  closeTransferDialog = () => {
    this.setState({ showTransferDialog: false, transferMode: null, transferAsset: null });
  };

  render() {
    const { global, dynamicProps, account, activeUser, history } = this.props;
    const {
      isSameAccount,
      loading,
      earnUsesInfo,
      earnHstsInfo,
      isEarnUser,
      selectedHistory,
      showTransferDialog,
      transferMode,
      transferAsset,
    } = this.state;

    if (!account.__loaded) {
      return null;
    }

    const w = new SteemWallet(account, dynamicProps, 0);

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
                <div>
                  {isEarnUser && earnUsesInfo ? (
                    <div>
                      <div className="transaction-list-header">
                        <h2>History</h2>
                        <div className="select-history">
                          <FormControl
                            className="select-box"
                            as="select"
                            value={selectedHistory}
                            onChange={this.filterChanged}
                          >
                            {earnUsesArray.map((kind) => (
                              <option key={kind} value={kind}>
                                {kind}
                              </option>
                            ))}
                          </FormControl>
                        </div>
                      </div>
                      <EarnHistory earnHstsInfo={earnHstsInfo} />
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
          </div>
          <WalletMenu global={global} username={account.name} active="earn" />
        </div>

        {showTransferDialog && (
          <Transfer
            {...this.props}
            activeUser={activeUser!}
            to={isSameAccount ? "upvu" : account.name}
            mode={transferMode!}
            asset={transferAsset!}
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

const DelegationSP = ({ summary, user_sp, upvu_delegate, user_steem, openTransferDialog }: UpvuInfoProps | any) => {
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

const EarnHistory = ({ earnHstsInfo }: EarnHstsArrayProps) => {
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
          <div className="transaction-upper">Reward Date</div>
        </div>
        <div className="transaction-title date">
          <div className="transaction-upper">Deposit Date</div>
        </div>
        <div className="transaction-title permlink">
          <div className="transaction-upper">Deposit Steem</div>
        </div>
        <div className="transaction-title">
          <div className="transaction-upper">Earn Steem</div>
        </div>
        <div className="transaction-title">
          <div className="transaction-upper">Earn Amount</div>
        </div>
      </div>

      {earnHstsInfo ? (
        earnHstsInfo.map((earnHst: EarnHstsProps, idx: number) => (
          <div className="transaction-list-item" key={idx}>
            <div className="transaction-title date">
              <div className="transaction-upper">{earnHst.reward_dte}</div>
            </div>
            <div className="transaction-title date">
              <div className="transaction-upper">{earnHst.delegate_dte}</div>
            </div>
            <div className="transaction-title permlink">
              <div className="transaction-upper">
                {formattedNumber(earnHst.deposit_steem_amount, { fractionDigits: 0 })} STEEM
              </div>
            </div>
            <div className="transaction-title">
              <div className="transaction-upper">
                {formattedNumber(earnHst.earn_steem, { fractionDigits: 3 })} STEEM
              </div>
            </div>
            <div className="transaction-title">
              <div className="transaction-upper">
                {formattedNumber(earnHst.earn_amount, { fractionDigits: 8 })} {earnHst.earn_symbol}
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

export default (p: Props) => {
  const props = {
    history: p.history,
    global: p.global,
    dynamicProps: p.dynamicProps,
    activeUser: p.activeUser,
    transactions: p.transactions,
    account: p.account,
    signingKey: p.signingKey,
    addAccount: p.addAccount,
    updateActiveUser: p.updateActiveUser,
    setSigningKey: p.setSigningKey,
    fetchTransactions: p.fetchTransactions,
    updateWalletValues: p.updateWalletValues,
    fetchPoints: p.fetchPoints,
    steemengine: false,
  };

  return <WalletEarn {...props} />;
};
