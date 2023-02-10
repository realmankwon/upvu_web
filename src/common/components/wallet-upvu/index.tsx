import React from "react";
import { History } from "history";
import htmlParse from "html-react-parser";

import { Global } from "../../store/global/types";
import { Account } from "../../store/accounts/types";
import { DynamicProps } from "../../store/dynamic-props/types";
import { OperationGroup, Transactions } from "../../store/transactions/types";
import { ActiveUser } from "../../store/active-user/types";

import BaseComponent from "../base";
import SteemEngineToken from "../../helper/steem-engine-wallet";
import LinearProgress from "../linear-progress";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import WalletMenu from "../wallet-menu";

import Transfer, { TransferMode } from "../transfer-he";

import { claimRewards, getSteemEngineTokenBalances, getUnclaimedRewards, TokenStatus } from "../../api/steem-engine";

import {
  informationVariantSvg,
  plusCircle,
  transferOutlineSvg,
  lockOutlineSvg,
  unlockOutlineSvg,
  delegateOutlineSvg,
  undelegateOutlineSvg,
} from "../../img/svg";
import { error, success } from "../feedback";
import { formatError } from "../../api/operations";
import formattedNumber from "../../util/formatted-number";

import { _t } from "../../i18n";
import { WalletUPVUInfos } from "../wallet-upvu-infos";

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

interface State {
  tokens: SteemEngineToken[];
  rewards: TokenStatus[];
  loading: boolean;
  claiming: boolean;
  claimed: boolean;
  transfer: boolean;
  transferMode: null | TransferMode;
  transferAsset: null | string;
  assetBalance: number;
}

export class WalletUPVU extends BaseComponent<Props, State> {
  state: State = {
    tokens: [],
    rewards: [],
    loading: true,
    claiming: false,
    claimed: false,
    transfer: false,
    transferMode: null,
    transferAsset: null,
    assetBalance: 0,
  };
  _isMounted = false;

  componentDidMount() {
    this._isMounted = true;
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  render() {
    const { global, dynamicProps, account, activeUser } = this.props;
    const { rewards, tokens, loading, claiming, claimed } = this.state;
    const isMyPage = activeUser && activeUser.username === account.name;
    let rewardsToShowInTooltip = [...rewards];
    rewardsToShowInTooltip = rewardsToShowInTooltip.splice(0, 10);

    if (!account.__loaded) {
      return null;
    }

    return (
      <div className="wallet-upvu">
        <div className="wallet-main">
          <div className="wallet-info">
            <div className="balance-row alternative">
              <div className="balance-info">
                <div className="title">{_t("wallet-upvu.title")}</div>
                <div className="description">{htmlParse(_t("wallet-upvu.description"))}</div>
              </div>
            </div>

            <div className="summary-upvu">
              {/* UPVU Dashboard 내용 입력 */}
              <WalletUPVUInfos {...this.props} />
            </div>
          </div>
          <WalletMenu global={global} username={account.name} active="dashboard" />
        </div>
      </div>
    );
  }
}

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

  return <WalletUPVU {...props} />;
};
