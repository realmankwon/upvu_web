import React, { Component, useEffect, useState } from "react";

import { History } from "history";

import { FormControl, Button } from "react-bootstrap";

import { DynamicProps } from "../../store/dynamic-props/types";
import { OperationGroup, Transaction, Transactions } from "../../store/transactions/types";
import { Account } from "../../store/accounts/types";

import LinearProgress from "../linear-progress";
import EntryLink from "../entry-link";

import parseAsset from "../../helper/parse-asset";
import { dateToFullRelative } from "../../helper/parse-date";
import { vestsToHp } from "../../helper/vesting";

import formattedNumber from "../../util/formatted-number";

import {
  ticketSvg,
  compareHorizontalSvg,
  cashMultiple,
  reOrderHorizontalSvg,
  pickAxeSvg,
  closeSvg,
  exchangeSvg,
  cashCoinSvg,
  powerDownSvg,
  powerUpSvg,
  starsSvg,
  chevronUpSvgForVote,
  chevronDownSvgForSlider,
  starSvg,
} from "../../img/svg";

import { _t } from "../../i18n";
import { Tsx } from "../../i18n/helper";
import { usePrevious } from "../../util/use-previous";
import transactions from "../../store/transactions";

interface RowProps {
  history: History;
  dynamicProps: DynamicProps;
  transaction: Transaction;
  entry?: Transaction;
}

export class TransactionRow extends Component<RowProps> {
  render() {
    const { dynamicProps, transaction: item, entry } = this.props;
    const { steemPerMVests } = dynamicProps;
    const tr = item || entry;

    let flag = false;
    let icon = ticketSvg;
    let numbers = null;
    let details = null;

    if (tr.type === "curation_reward") {
      flag = true;
      icon = cashCoinSvg;

      numbers = <>{formattedNumber(vestsToHp(parseAsset(tr.reward).amount, steemPerMVests), { suffix: "SP" })}</>;
      details = EntryLink({
        ...this.props,
        entry: {
          category: "history",
          author: tr.comment_author,
          permlink: tr.comment_permlink,
        },
        children: (
          <span>
            {"@"}
            {tr.comment_author}/{tr.comment_permlink}
          </span>
        ),
      });
    }

    if (tr.type === "author_reward" || tr.type === "comment_benefactor_reward") {
      flag = true;
      icon = cashCoinSvg;

      const sbd_payout = parseAsset(tr.sbd_payout);
      const steem_payout = parseAsset(tr.steem_payout);
      const vesting_payout = parseAsset(tr.vesting_payout);
      numbers = (
        <>
          {sbd_payout.amount > 0 && (
            <span className="number">{formattedNumber(sbd_payout.amount, { suffix: "SBD" })}</span>
          )}
          {steem_payout.amount > 0 && (
            <span className="number">{formattedNumber(steem_payout.amount, { suffix: "STEEM" })}</span>
          )}
          {vesting_payout.amount > 0 && (
            <span className="number">
              {formattedNumber(vestsToHp(vesting_payout.amount, steemPerMVests), { suffix: "SP" })}{" "}
            </span>
          )}
        </>
      );

      details = EntryLink({
        ...this.props,
        entry: {
          category: "history",
          author: tr.author,
          permlink: tr.permlink,
        },
        children: (
          <span>
            {"@"}
            {tr.author}/{tr.permlink}
          </span>
        ),
      });
    }

    if (tr.type === "claim_reward_balance") {
      flag = true;

      const reward_sbd = parseAsset(tr.reward_sbd);
      const reward_steem = parseAsset(tr.reward_steem);
      const reward_vests = parseAsset(tr.reward_vests);

      numbers = (
        <>
          {reward_sbd.amount > 0 && (
            <span className="number">{formattedNumber(reward_sbd.amount, { suffix: "SBD" })}</span>
          )}
          {reward_steem.amount > 0 && (
            <span className="number">{formattedNumber(reward_steem.amount, { suffix: "STEEM" })}</span>
          )}
          {reward_vests.amount > 0 && (
            <span className="number">
              {formattedNumber(vestsToHp(reward_vests.amount, steemPerMVests), {
                suffix: "SP",
              })}
            </span>
          )}
        </>
      );
    }

    if (tr.type === "transfer" || tr.type === "transfer_to_vesting" || tr.type === "transfer_to_savings") {
      flag = true;
      icon = tr.type === "transfer_to_vesting" ? powerUpSvg : compareHorizontalSvg;

      details = (
        <span>
          {tr.memo ? (
            <>
              {tr.memo} <br /> <br />
            </>
          ) : null}
          <>
            <strong>@{tr.from}</strong> -&gt; <strong>@{tr.to}</strong>
          </>
        </span>
      );

      numbers = <span className="number">{tr.amount}</span>;
    }

    if (tr.type === "set_withdraw_vesting_route") {
      flag = true;
      icon = compareHorizontalSvg;

      details = (
        <span>
          {"Auto Vest:"} {tr.auto_vest} <br />
          {"Percent:"} {tr.percent} <br />
          <>
            <strong>@{tr.from_account}</strong> -&gt; <strong>@{tr.to_account}</strong>
          </>
        </span>
      );

      numbers = <span className="number">{tr.percent}</span>;
    }

    if (tr.type === "recurrent_transfer" || tr.type === "fill_recurrent_transfer") {
      flag = true;
      icon = compareHorizontalSvg;

      details = (
        <span>
          {tr.memo ? (
            <>
              {tr.memo} <br /> <br />
            </>
          ) : null}
          {tr.type === "recurrent_transfer" ? (
            <>
              <Tsx
                k="transactions.type-recurrent_transfer-detail"
                args={{ executions: tr.executions, recurrence: tr.recurrence }}
              >
                <span />
              </Tsx>
              <br />
              <br />
              <strong>@{tr.from}</strong> -&gt; <strong>@{tr.to}</strong>
            </>
          ) : (
            <>
              <Tsx
                k="transactions.type-fill_recurrent_transfer-detail"
                args={{ remaining_executions: tr.remaining_executions }}
              >
                <span />
              </Tsx>
              <br />
              <br />
              <strong>@{tr.from}</strong> -&gt; <strong>@{tr.to}</strong>
            </>
          )}
        </span>
      );
      let aam = tr.amount;
      if (tr.type === "fill_recurrent_transfer") {
        const t = parseAsset(tr.amount);
        aam = `${t.amount} ${t.symbol}`;
      }
      numbers = <span className="number">{aam}</span>;
    }

    if (tr.type === "cancel_transfer_from_savings") {
      flag = true;
      icon = closeSvg;

      details = (
        <Tsx k="transactions.type-cancel_transfer_from_savings-detail" args={{ from: tr.from, request: tr.request_id }}>
          <span />
        </Tsx>
      );
    }

    if (tr.type === "withdraw_vesting") {
      flag = true;
      icon = powerDownSvg;

      const vesting_shares = parseAsset(tr.vesting_shares);
      numbers = (
        <span className="number">
          {formattedNumber(vestsToHp(vesting_shares.amount, steemPerMVests), {
            suffix: "SP",
          })}
        </span>
      );

      details = tr.acc ? (
        <span>
          <strong>@{tr.acc}</strong>
        </span>
      ) : null;
    }

    if (tr.type === "delegate_vesting_shares") {
      flag = true;
      icon = starSvg;

      const vesting_shares = parseAsset(tr.vesting_shares);
      numbers = (
        <span className="number">
          {formattedNumber(vestsToHp(vesting_shares.amount, steemPerMVests), {
            suffix: "SP",
          })}
        </span>
      );

      details = tr.delegatee ? (
        <span>
          <>
            <strong>@{tr.delegator}</strong> -&gt; <strong>@{tr.delegatee}</strong>
          </>
        </span>
      ) : null;
    }

    if (tr.type === "fill_vesting_withdraw") {
      flag = true;
      icon = powerDownSvg;

      numbers = <span className="number">{tr.deposited}</span>;

      details = tr.from_account ? (
        <span>
          <strong>
            @{tr.from_account} -&gt; @{tr.to_account}
          </strong>
        </span>
      ) : null;
    }

    if (tr.type === "fill_order") {
      flag = true;
      icon = reOrderHorizontalSvg;

      numbers = (
        <span className="number">
          {tr.current_pays} = {tr.open_pays}
        </span>
      );
    }

    if (tr.type === "limit_order_create") {
      flag = true;
      icon = reOrderHorizontalSvg;

      numbers = (
        <span className="number">
          {tr.amount_to_sell} = {tr.min_to_receive}
        </span>
      );
    }

    if (tr.type === "limit_order_cancel") {
      flag = true;
      icon = reOrderHorizontalSvg;

      numbers = <span className="number">{tr.num}</span>;
      details = tr.owner ? (
        <span>
          <strong>Order ID: {tr.orderid}</strong>
        </span>
      ) : null;
    }

    if (tr.type === "producer_reward") {
      flag = true;
      icon = pickAxeSvg;

      numbers = (
        <>{formattedNumber(vestsToHp(parseAsset(tr.vesting_shares).amount, steemPerMVests), { suffix: "SP" })}</>
      );
    }

    if (tr.type === "interest") {
      flag = true;
      icon = cashMultiple;

      numbers = <span className="number">{tr.interest}</span>;
    }

    if (tr.type === "fill_convert_request") {
      flag = true;
      icon = reOrderHorizontalSvg;

      numbers = (
        <span className="number">
          {tr.amount_in} = {tr.amount_out}
        </span>
      );
    }

    if (tr.type === "fill_collateralized_convert_request") {
      flag = true;
      icon = reOrderHorizontalSvg;

      numbers = (
        <span className="number">
          {tr.amount_in} = {tr.amount_out}
        </span>
      );
      details = (
        <Tsx
          k="transactions.type-fill_collateralized_convert-detail"
          args={{ request: tr.requestid, returned: tr.excess_collateral }}
        >
          <span />
        </Tsx>
      );
    }

    if (tr.type === "return_vesting_delegation") {
      flag = true;
      icon = powerUpSvg;

      numbers = (
        <>{formattedNumber(vestsToHp(parseAsset(tr.vesting_shares).amount, steemPerMVests), { suffix: "SP" })}</>
      );
    }

    if (tr.type === "proposal_pay") {
      flag = true;
      icon = ticketSvg;

      numbers = <span className="number">{tr.payment}</span>;
    }

    if (tr.type === "update_proposal_votes") {
      flag = true;
      icon = tr.approve ? chevronUpSvgForVote : chevronDownSvgForSlider;

      details = (
        <Tsx k="transactions.type-update_proposal_vote-detail" args={{ pid: tr.proposal_ids }}>
          <span />
        </Tsx>
      );
    }

    if (tr.type === "comment_payout_update") {
      flag = true;
      icon = starsSvg;

      details = EntryLink({
        ...this.props,
        entry: {
          category: "history",
          author: tr.author,
          permlink: tr.permlink,
        },
        children: (
          <span>
            {"@"}
            {tr.author}/{tr.permlink}
          </span>
        ),
      });
    }

    if (tr.type === "comment_reward") {
      flag = true;
      icon = cashCoinSvg;

      const payout = parseAsset(tr.payout);

      numbers = (
        <>{payout.amount > 0 && <span className="number">{formattedNumber(payout.amount, { suffix: "SBD" })}</span>}</>
      );

      details = EntryLink({
        ...this.props,
        entry: {
          category: "history",
          author: tr.author,
          permlink: tr.permlink,
        },
        children: (
          <span>
            {"@"}
            {tr.author}/{tr.permlink}
          </span>
        ),
      });
    }

    if (tr.type === "collateralized_convert") {
      flag = true;
      icon = exchangeSvg;
      const amount = parseAsset(tr.amount);

      numbers = (
        <>
          {amount.amount > 0 && <span className="number">{formattedNumber(amount.amount, { suffix: "STEEM" })}</span>}
        </>
      );

      details = (
        <Tsx k="transactions.type-collateralized_convert-detail" args={{ request: tr.requestid }}>
          <span />
        </Tsx>
      );
    }

    if (tr.type === "effective_comment_vote") {
      flag = true;

<<<<<<< HEAD
      // debugger;
=======
>>>>>>> 88b2e57be (dsteem applied for postingkey)
      const payout = parseAsset(tr.pending_payout);

      numbers = (
        <>{payout.amount > 0 && <span className="number">{formattedNumber(payout.amount, { suffix: "SBD" })}</span>}</>
      );

      details = EntryLink({
        ...this.props,
        entry: {
          category: "history",
          author: tr.author,
          permlink: tr.permlink,
        },
        children: (
          <span>
            {"@"}
            {tr.author}/{tr.permlink}
          </span>
        ),
      });
    }

    if (tr.type === "vote") {
      flag = true;

      const weight = +tr.weight;

      numbers = <>{<span className="number">{weight / 100} %</span>}</>;

      details = EntryLink({
        ...this.props,
        entry: {
          category: "history",
          author: tr.author,
          permlink: tr.permlink,
        },
        children: (
          <span>
            {"@"}
            {tr.voter} votes {"@"}
            {tr.author}/{tr.permlink}
          </span>
        ),
      });
    }

    // steem-engine transaction start
    if (tr.type === "tokens_transfer") {
      flag = true;
      icon = compareHorizontalSvg;

      details = (
        <span>
          {tr.transaction.memo ? (
            <>
              {tr.transaction.memo} <br /> <br />
            </>
          ) : null}
          <>
            <strong>@{tr.transaction.from}</strong> -&gt; <strong>@{tr.transaction.to}</strong>
          </>
        </span>
      );

      let sign = "";

      if (tr.transaction.to != tr.transaction.account) sign = "-";
      numbers = (
        <span className="number">
          {sign} {tr.transaction.quantity} {tr.transaction.symbol}
        </span>
      );
    }

    if (tr.type === "tokens_delegate") {
      flag = true;
      icon = starSvg;

      let sign = "";

      if (tr.transaction.to != tr.transaction.account) sign = "-";
      numbers = (
        <span className="number">
          {sign} {tr.transaction.quantity} {tr.transaction.symbol}
        </span>
      );

      details = tr.transaction.to ? (
        <span>
          <>
            <strong>@{tr.transaction.from}</strong> -&gt; <strong>@{tr.transaction.to}</strong>
          </>
        </span>
      ) : null;
    }

    if (tr.type === "tokens_stake") {
      flag = true;
      icon = powerUpSvg;

      details = (
        <span>
          <>
            <strong>@{tr.transaction.from}</strong> -&gt; <strong>@{tr.transaction.to}</strong>
          </>
        </span>
      );

      let sign = "";

      if (tr.transaction.to != tr.transaction.account) sign = "-";
      numbers = (
        <span className="number">
          {sign} {tr.transaction.quantity} {tr.transaction.symbol}
        </span>
      );
    }

    if (tr.type === "tokens_issue") {
      flag = true;
      icon = cashMultiple;

      details = (
        <span>
          <>
            <strong>@{tr.transaction.from}</strong> -&gt; <strong>@{tr.transaction.to}</strong>
          </>
        </span>
      );

      let sign = "";

      if (tr.transaction.to != tr.transaction.account) sign = "-";
      numbers = (
        <span className="number">
          {sign} {tr.transaction.quantity} {tr.transaction.symbol}
        </span>
      );
    }

    if (tr.type === "tokens_unstake" || tr.type === "tokens_unstakeStart") {
      flag = true;
      icon = powerDownSvg;

      details = (
        <span>
          <>
            <strong>@{tr.transaction.account}</strong>
          </>
        </span>
      );

      numbers = (
        <span className="number">
          {tr.transaction.quantity} {tr.transaction.symbol}
        </span>
      );
    }

    if (flag) {
      return (
        <div className="transaction-list-item">
          <div className="transaction-icon">{icon}</div>
          <div className="transaction-title">
            <div className="transaction-name">{_t(`transactions.type-${tr.type}`)}</div>
            <div className="transaction-date">{dateToFullRelative(tr.timestamp)}</div>
          </div>
          <div className="transaction-numbers">{numbers}</div>
          <div className="transaction-details">{details}</div>
        </div>
      );
    }

    return (
      <div className="transaction-list-item transaction-list-item-raw">
        <div className="raw-code">{JSON.stringify(tr)}</div>
      </div>
    );
  }
}

interface Props {
  history: History;
  dynamicProps: DynamicProps;
  transactions: Transactions;
  account: Account;
  steemengine: boolean;
  fetchTransactions: (
    username: string,
    steemengine: boolean,
    group?: OperationGroup | "",
    start?: number,
    limit?: number
  ) => void;
}

const List = (props: Props) => {
  const [loadingLoadMore, setLoadingLoadMore] = useState(false);
  const [transactionsList, setTransactionsList] = useState<Transaction[]>([]);
  const previousTransactions = usePrevious(props.transactions);

  useEffect(() => {
    const { account, fetchTransactions, steemengine } = props;
    account && account.name && fetchTransactions(account.name, steemengine);
  }, []);

  useEffect(() => {
    const { transactions } = props;
    if (previousTransactions && previousTransactions.list !== transactions.list) {
      setTransactionsList([
        ...(previousTransactions.group === transactions.group ? transactionsList : []),
        ...transactions.list,
      ]);
    }
  }, [props.transactions]);

  const typeChanged = (e: React.ChangeEvent<typeof FormControl & HTMLInputElement>) => {
    const { account, fetchTransactions, steemengine } = props;
    const group = e.target.value;

    setLoadingLoadMore(loadingLoadMore);
    setTransactionsList(transactionsList);

    fetchTransactions(account.name, steemengine, group as OperationGroup);
  };

  const loadMore = () => {
    const {
      account,
      fetchTransactions,
      transactions: { list, group },
      steemengine,
    } = props;

    if (list.length > 0) {
      const last_num = list[list.length - 1].num + 1;
      fetchTransactions(account.name, steemengine, group as OperationGroup, last_num);
    }
  };

  return (
    <div className="transaction-list">
      <div className="transaction-list-header">
        <h2>{_t("transactions.title")} </h2>
        <FormControl as="select" value={props.transactions.group} onChange={typeChanged}>
          <option value="">{_t("transactions.group-all")}</option>
          {["transfers", "market-orders", "interests", "stake-operations", "rewards"].map((x) => (
            <option key={x} value={x}>
              {_t(`transactions.group-${x}`)}
            </option>
          ))}
        </FormControl>
      </div>

      {props.transactions.loading && <LinearProgress />}
      {transactionsList.map(
        (x, k) =>
          (!props.transactions.group ||
            (props.transactions.group == "transfers" &&
              (x.type === "transfer" ||
                x.type === "transfer_to_savings" ||
                x.type === "cancel_transfer_from_savings")) ||
            (props.transactions.group == "interests" && x.type === "interest") ||
            (props.transactions.group == "market-orders" &&
              (x.type === "fill_convert_request" ||
                x.type === "fill_order" ||
                x.type === "limit_order_create" ||
                x.type === "limit_order_cancel")) ||
            (props.transactions.group == "stake-operations" &&
              (x.type === "return_vesting_delegation" ||
                x.type === "withdraw_vesting" ||
                x.type === "transfer_to_vesting" ||
                x.type === "set_withdraw_vesting_route" ||
                x.type === "update_proposal_votes" ||
                x.type === "fill_vesting_withdraw" ||
                x.type === "delegate_vesting_shares")) ||
            (props.transactions.group == "rewards" &&
              (x.type === "author_reward" ||
                x.type === "curation_reward" ||
                x.type === "producer_reward" ||
                x.type === "claim_reward_balance" ||
                x.type === "comment_benefactor_reward"))) && <TransactionRow {...props} key={k} transaction={x} />
      )}
      {!props.transactions.loading && transactionsList.length === 0 && (
        <p className="text-muted empty-list">{_t("g.empty-list")}</p>
      )}
      {!props.transactions.loading &&
        !props.transactions.loading &&
        props.transactions.list.length > 0 &&
        transactionsList.length > 0 && (
          <Button disabled={loadingLoadMore} block={true} onClick={loadMore} className="mt-2">
            {_t("g.load-more")}
          </Button>
        )}
    </div>
  );
};

export default (p: Props) => {
  const props: Props = {
    history: p.history,
    dynamicProps: p.dynamicProps,
    transactions: p.transactions,
    account: p.account,
    steemengine: p.steemengine,
    fetchTransactions: p.fetchTransactions,
  };

  return <List {...props} />;
};
