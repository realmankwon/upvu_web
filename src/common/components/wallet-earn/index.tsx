import React from "react";
import { Button, Form, Col, FormControl, Spinner } from "react-bootstrap";
import { History } from "history";

import { AssetSymbol } from "@upvu/dsteem";

import { Global } from "../../store/global/types";
import { Account } from "../../store/accounts/types";
import { DynamicProps } from "../../store/dynamic-props/types";
import { OperationGroup, Transactions } from "../../store/transactions/types";
import { ActiveUser } from "../../store/active-user/types";
import LinearProgress from "../linear-progress";
import BaseComponent from "../base";

import { _t } from "../../i18n";

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

interface EarnHstsProps {
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

interface State {
  loading: boolean;
  isSameAccount: boolean;
  isEarnUser: boolean;
  earnUsesInfo: EarnUsesProps[];
  earnHstsInfo: EarnHstsProps[];
  earnSummaryInfo: EarnSummaryProps[];
  selectedHistory: string;
}

let earnUsesArray: string[] = [];

export class WalletEarn extends BaseComponent<Props, State> {
  state: State = {
    loading: true,
    isSameAccount: false,
    isEarnUser: false,
    earnUsesInfo: [],
    earnHstsInfo: [],
    earnSummaryInfo: [],
    selectedHistory: "",
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

      if (resultEarnUses.success && resultEarnUses.results.length > 0) {
        resultEarnUses.results.map((data: EarnUsesProps) =>
          earnUsesArray.push(`${data.account}-${data.earn_type}-${data.earn_symbol}`)
        );
        this.setState({
          earnUsesInfo: resultEarnUses,
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
    this.setState({ selectedHistory: e.target.value });
  };

  render() {
    const { global, dynamicProps, account, activeUser, history } = this.props;
    const { isSameAccount, loading, earnUsesInfo, isEarnUser, selectedHistory } = this.state;
    debugger;
    if (!account.__loaded) {
      return null;
    }

    return (
      <div className="wallet-earn">
        {isSameAccount ? (
          loading ? (
            <LinearProgress />
          ) : (
            <div>
              {isEarnUser && earnUsesInfo ? (
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
