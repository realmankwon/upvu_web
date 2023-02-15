import React, { ProviderProps, useCallback, useEffect, useState } from "react";
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
} from "../../api/private-api";
import { getVestingDelegations } from "../../api/steem";

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

interface EarnUserProps {
  username: string;
  wallet_address: string;
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
  earn_symbol: string;
  earn_account: string;
  earn_steem: number;
  earn_amount: number;
  fee: number;
  claimed_amount: number;
  claimable_amount: number;
  last_claimed_dte: Date;
}

interface EarnSummaryArrayProps {
  earnSummary: EarnSummaryProps[];
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
  liquidEarnAccounts: EarnUsesProps[];
  previousEarnSteemAmount: DepositInfoProps;
  delegateEarnAccounts: EarnUsesProps[];
  previousEarnDelegateAmount: DepositInfoProps;
  selectedDelegateEarnAccount: string;
  selectedLiquidEarnAccount: string;
  earnSummary: EarnSummaryProps[];
  earnUserInfo: EarnUserProps;
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
    liquidEarnAccounts: [],
    previousEarnSteemAmount: { earnAccount: "", amount: 0 },
    delegateEarnAccounts: [],
    previousEarnDelegateAmount: { earnAccount: "", amount: 0 },
    selectedDelegateEarnAccount: "",
    selectedLiquidEarnAccount: "",
    earnSummary: [],
    earnUserInfo: { username: "", wallet_address: "" },
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
      const [resultEarnUses, resultEarnAccounts, resultEarnSummary, resultEarnUser] = await Promise.all([
        earnUses(username),
        earnAccounts(username),
        earnSummary(username),
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
          liquidEarnAccounts,
          delegateEarnAccounts,
          earnSummary: resultEarnSummary,
          earnUserInfo: resultEarnUser,
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
    const selectedHistory = e.target.value;
    earnHsts(account.name, selectedHistory.split("-")[0]).then((result) => {
      this.setState({ earnHstsInfo: result, selectedHistory });
    });
  };

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
          selectedLiquidEarnAccount: "",
          previousEarnDelegateAmount: {
            earnAccount,
            amount: vestsToSp(+parseAsset(delegateAccount!.vesting_shares).amount, steemPerMVests),
          },
          previousEarnSteemAmount: {
            earnAccount: "",
            amount: 0,
          },
        });
      } else {
        this.setState({
          selectedDelegateEarnAccount: earnAccount,
          selectedLiquidEarnAccount: "",
          previousEarnDelegateAmount: { earnAccount: "", amount: 0 },
          previousEarnSteemAmount: {
            earnAccount: "",
            amount: 0,
          },
        });
      }
    });
  };

  liquidEarnAccountChanged = (e: React.ChangeEvent<typeof FormControl & HTMLInputElement>) => {
    const { account } = this.props;

    const earnAccount = e.target.value;
    earnDepositSteem(account.name, earnAccount).then((result) => {
      if (result) {
        this.setState({
          selectedDelegateEarnAccount: "",
          selectedLiquidEarnAccount: earnAccount,
          previousEarnDelegateAmount: {
            earnAccount: "",
            amount: 0,
          },
          previousEarnSteemAmount: {
            earnAccount,
            amount: +result.total_amount,
          },
        });
      } else {
        this.setState({
          selectedDelegateEarnAccount: "",
          selectedLiquidEarnAccount: earnAccount,
          previousEarnDelegateAmount: {
            earnAccount: "",
            amount: 0,
          },
          previousEarnSteemAmount: {
            earnAccount: "",
            amount: 0,
          },
        });
      }
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
      liquidEarnAccounts,
      previousEarnSteemAmount,
      delegateEarnAccounts,
      previousEarnDelegateAmount,
      selectedDelegateEarnAccount,
      selectedLiquidEarnAccount,
      earnSummary,
      earnUserInfo,
    } = this.state;

    if (!account.__loaded) {
      return null;
    }

    const w = new SteemWallet(account, dynamicProps);
    const selectedEarnAccount = selectedDelegateEarnAccount ? selectedDelegateEarnAccount : selectedLiquidEarnAccount;

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
                  <WalletMetamask {...earnUserInfo} />
                  <DelegationSP
                    previousSp={previousEarnDelegateAmount.amount}
                    availableSp={w.availableForDelegateSp}
                    delegateEarnAccounts={delegateEarnAccounts}
                    selectedDelegateEarnAccount={selectedDelegateEarnAccount}
                    openTransferDialog={this.openTransferDialog}
                    delegateEarnAccountChanged={this.delegateEarnAccountChanged}
                  />
                  <TransferSteem
                    previousSteem={previousEarnSteemAmount.amount}
                    userSteem={w.balance}
                    liquidEarnAccounts={liquidEarnAccounts}
                    selectedLiquidEarnAccount={selectedLiquidEarnAccount}
                    openTransferDialog={this.openTransferDialog}
                    liquidEarnAccountChanged={this.liquidEarnAccountChanged}
                  />
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
                                {`${kind.split("-")[1] === "D" ? "Delegate SP" : "Liquid Steem"}-${kind.split("-")[2]}`}
                              </option>
                            ))}
                          </FormControl>
                        </div>
                      </div>
                      <MyEarns earnSummary={earnSummary} />
                      <EarnHistory earnHstsInfo={earnHstsInfo} />
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

        {showTransferDialog && (
          <Transfer
            {...this.props}
            activeUser={activeUser!}
            to={isSameAccount ? selectedEarnAccount : account.name}
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

const DelegationSP = ({
  previousSp,
  availableSp,
  delegateEarnAccounts,
  selectedDelegateEarnAccount,
  openTransferDialog,
  delegateEarnAccountChanged,
}: SteemWalletProps | any) => {
  const onClickDelegation = () => {
    openTransferDialog("delegate", "SP");
  };

  const ondelegateEarnAccountChanged = (e: React.ChangeEvent<typeof FormControl & HTMLInputElement>) => {
    delegateEarnAccountChanged(e);
  };

  return (
    <>
      <div className="view-container">
        <div className="header">Deposit Steem Power</div>

        <div className="content">
          <div className="select-delegate-earn-account">
            <FormControl
              className="select-box"
              as="select"
              value={selectedDelegateEarnAccount}
              onChange={ondelegateEarnAccountChanged}
            >
              <option key="empty" value="">
                -
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
  previousSteem,
  userSteem,
  liquidEarnAccounts,
  selectedLiquidEarnAccount,
  openTransferDialog,
  liquidEarnAccountChanged,
}: SteemWalletProps | any) => {
  const onClickTransfer = () => {
    openTransferDialog("transfer", "STEEM");
  };

  const onLiquidEarnAccountChanged = (e: React.ChangeEvent<typeof FormControl & HTMLInputElement>) => {
    liquidEarnAccountChanged(e);
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
              onChange={onLiquidEarnAccountChanged}
            >
              <option key="empty" value="">
                -
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
      </div>
    </>
  );
};

const MyEarns = ({ earnSummary }: EarnSummaryArrayProps) => {
  return (
    <>
      <div className="view-container">
        <div className="header">My Earns</div>
        <div className="content">
          {earnSummary.map((summary) => (
            <>
              <ValueDescWithTooltip
                val={`${formattedNumber(summary.earn_steem, { fractionDigits: 3 })}`}
                desc="Earn Steem"
              >
                <>
                  <p>Earn Steem</p>
                </>
              </ValueDescWithTooltip>
              <ValueDescWithTooltip
                val={`${formattedNumber(summary.earn_amount, { fractionDigits: 8 })} ${summary.earn_symbol}`}
                desc={"Earn Amount"}
              >
                <>
                  <p>Earn Amount</p>
                </>
              </ValueDescWithTooltip>
              {/* <ValueDescWithTooltip
                val={`${formattedNumber(summary.fee, {
                  fractionDigits: 8,
                })} ${summary.earn_symbol}`}
                desc={"Fee"}
              >
                <>
                  <p>Fee</p>
                </>
              </ValueDescWithTooltip> */}
              <ValueDescWithTooltip val={`${summary.claimed_amount} ${summary.earn_symbol}`} desc={"Claimed Amount"}>
                <>
                  <p>Claimed Amount</p>
                </>
              </ValueDescWithTooltip>
              <ValueDescWithTooltip
                val={`${summary.claimable_amount} ${summary.earn_symbol}`}
                desc={"Claimable Amount"}
              >
                <>
                  <p>Claimable Amount</p>
                </>
              </ValueDescWithTooltip>
            </>
          ))}
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

const WalletMetamask = ({ username, wallet_address }: EarnUserProps) => {
  const [chainId, setChainId] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [savedWalletAddress, setSavedWalletAddress] = useState("");
  const [active, setActive] = useState(false);

  const network = {
    chainId: "0xa4b1", // "42161"
    chainName: "Arbitrum One",
    rpcUrls: ["https://arbitrum-mainnet.infura.io"],
    nativeCurrency: {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
    },
  };

  const getRequestAccounts = async () => {
    const walletAddress = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    return walletAddress;
  };

  const addNetwork = async () => {
    await window.ethereum.request({
      method: "wallet_addEthereumChain",
      params: [network],
    });
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
    debugger;
    setWalletAddress(value[0]);
  });

  window.ethereum.on("chainChanged", (value: any) => {
    debugger;
    // setChainId(value);
    if (value != network.chainId) {
      window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: network.chainId }],
      });
    }
  });

  const connectWallet = async () => {
    try {
      if (typeof window.ethereum !== "undefined") {
        debugger;
        if (active) {
          window.ethereum.disconnect();
          setActive(false);
          setWalletAddress("");
        } else {
          const resultChainId = window.ethereum.chainId;

          if (resultChainId !== network.chainId) {
            await window.ethereum.request({
              method: "wallet_switchEthereumChain",
              params: [{ chainId: network.chainId }],
            });
          }

          const resultConnect = await getRequestAccounts();
          if (resultConnect.length > 0) {
            console.log(resultConnect[0]);
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
                value={active ? "Disconnect" : "Connect"}
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
                value={wallet_address ? "Change" : "Save"}
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
