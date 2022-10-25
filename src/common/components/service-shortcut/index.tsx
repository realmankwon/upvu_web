import React from "react";

import { Global } from "../../store/global/types";
import { Account } from "../../store/accounts/types";
import { DynamicProps } from "../../store/dynamic-props/types";
import { OperationGroup, Transactions } from "../../store/transactions/types";
import { ActiveUser } from "../../store/active-user/types";

import BaseComponent from "../base";
import HiveEngineToken from "../../helper/hive-engine-wallet";
import LinearProgress from "../linear-progress";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import WalletMenu from "../wallet-menu";

import Transfer, { TransferMode } from "../transfer-he";

import { claimRewards, getHiveEngineTokenBalances, getUnclaimedRewards, TokenStatus } from "../../api/hive-engine";

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

interface State {
  tokens: HiveEngineToken[];
  rewards: TokenStatus[];
  loading: boolean;
  claiming: boolean;
  claimed: boolean;
  transfer: boolean;
  transferMode: null | TransferMode;
  transferAsset: null | string;
  assetBalance: number;
}

export class ShortCut extends BaseComponent<Props, State> {
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
    this._isMounted && this.fetch();
    this._isMounted && this.fetchUnclaimedRewards();
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  openTransferDialog = (mode: TransferMode, asset: string, balance: number) => {
    this.stateSet({
      transfer: true,
      transferMode: mode,
      transferAsset: asset,
      assetBalance: balance,
    });
  };

  closeTransferDialog = () => {
    this.stateSet({ transfer: false, transferMode: null, transferAsset: null });
  };

  fetch = async () => {
    const { account } = this.props;

    this.setState({ loading: true });
    let items;
    try {
      items = await getHiveEngineTokenBalances(account.name);
      items = items.filter((token) => token.balance !== 0 || token.stakedBalance !== 0);
      items = this.sort(items);
      this._isMounted && this.setState({ tokens: items });
    } catch (e) {
      console.log("engine tokens", e);
    }

    this.setState({ loading: false });
  };

  sort = (items: HiveEngineToken[]) =>
    items.sort((a: HiveEngineToken, b: HiveEngineToken) => {
      if (a.balance !== b.balance) {
        return a.balance < b.balance ? 1 : -1;
      }

      if (a.stake !== b.stake) {
        return a.stake < b.stake ? 1 : -1;
      }

      return a.symbol > b.symbol ? 1 : -1;
    });

  fetchUnclaimedRewards = async () => {
    const { account } = this.props;
    try {
      const rewards = await getUnclaimedRewards(account.name);
      this._isMounted && this.setState({ rewards });
    } catch (e) {
      console.log("fetchUnclaimedRewards", e);
    }
  };

  claimRewards = (tokens: TokenStatus[]) => {
    const { activeUser } = this.props;
    const { claiming } = this.state;

    if (claiming || !activeUser) {
      return;
    }

    this.setState({ claiming: true });

    return claimRewards(
      activeUser.username,
      tokens.map((t) => t.symbol)
    )
      .then((account) => {
        success(_t("wallet.claim-reward-balance-ok"));
      })
      .then(() => {
        this.setState({ rewards: [] });
      })
      .catch((err) => {
        console.log(err);
        error(formatError(err));
      })
      .finally(() => {
        this.setState({ claiming: false });
      });
  };

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
                <div className="title">{_t("shortcut.title")}</div>
                <div className="description">{_t("shortcut.description")}</div>
              </div>
            </div>

            <div className="summary-upvu">
              {/* UPVU Summary 내용 입력 */}
              <h1>Steem Service List</h1>
            </div>
          </div>
          <WalletMenu global={global} username={account.name} active="shortcut" />
        </div>
        {this.state.transfer && (
          <Transfer
            {...this.props}
            activeUser={activeUser!}
            to={isMyPage ? undefined : account.name}
            mode={this.state.transferMode!}
            asset={this.state.transferAsset!}
            onHide={this.closeTransferDialog}
            assetBalance={this.state.assetBalance}
          />
        )}
      </div>
    );
  }
}

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

  return <ShortCut {...props} />;
};
