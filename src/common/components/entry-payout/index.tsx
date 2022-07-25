import React, { Component, Fragment } from "react";

import { Popover, OverlayTrigger } from "react-bootstrap";

import { Entry } from "../../store/entries/types";
import { Global } from "../../store/global/types";
import { DynamicProps } from "../../store/dynamic-props/types";

import FormattedCurrency from "../formatted-currency/index";

import parseAsset from "../../helper/parse-asset";
import { dateToFullRelative } from "../../helper/parse-date";

import formattedNumber from "../../util/formatted-number";

import { _t } from "../../i18n";

import _c from "../../util/fix-class-names";

interface Props {
  global: Global;
  dynamicProps: DynamicProps;
  entry: Entry;
}

export class EntryPayoutDetail extends Component<Props> {
  render() {
    const { entry, dynamicProps } = this.props;

    const { base, quote, sbdPrintRate } = dynamicProps;

    const payoutDate = dateToFullRelative(entry.payout_at);

    const beneficiary = entry.beneficiaries;
    const pendingPayout = parseAsset(entry.pending_payout_value).amount;
    const promotedPayout = parseAsset(entry.promoted).amount;
    const authorPayout = parseAsset(entry.author_payout_value).amount;
    const curatorPayout = parseAsset(entry.curator_payout_value).amount;
    const maxPayout = parseAsset(entry.max_accepted_payout).amount;
    const fullPower = entry.percent_sbd === 0;

    const totalPayout = pendingPayout + authorPayout + curatorPayout;
    const payoutLimitHit = totalPayout >= maxPayout;

    const SBD_PRINT_RATE_MAX = 10000;
    const percentSteemDollars = entry.percent_sbd / 20000;
    const pendingPayoutSbd = pendingPayout * percentSteemDollars;
    const pricePerSteem = base / quote;
    const pendingPayoutSp = (pendingPayout - pendingPayoutSbd) / pricePerSteem;
    const pendingPayoutPrintedSbd =
      pendingPayoutSbd * (sbdPrintRate / SBD_PRINT_RATE_MAX);
    const pendingPayoutPrintedSteem =
      (pendingPayoutSbd - pendingPayoutPrintedSbd) / pricePerSteem;

    let breakdownPayout: string[] = [];
    if (pendingPayout > 0) {
      if (pendingPayoutPrintedSbd > 0) {
        breakdownPayout.push(
          formattedNumber(pendingPayoutPrintedSbd, {
            fractionDigits: 3,
            suffix: "SBD",
          })
        );
      }

      if (pendingPayoutPrintedSteem > 0) {
        breakdownPayout.push(
          formattedNumber(pendingPayoutPrintedSteem, {
            fractionDigits: 3,
            suffix: "STEEM",
          })
        );
      }

      if (pendingPayoutSp > 0) {
        breakdownPayout.push(
          formattedNumber(pendingPayoutSp, { fractionDigits: 3, suffix: "SP" })
        );
      }
    }

    return (
      <div className="payout-popover-content">
        {fullPower && (
          <p>
            <span className="label">{_t("entry-payout.reward")}</span>
            <span className="value">{_t("entry-payout.full-power")}</span>
          </p>
        )}
        {pendingPayout > 0 && (
          <p>
            <span className="label">{_t("entry-payout.pending-payout")}</span>
            <span className="value">
              <FormattedCurrency
                {...this.props}
                value={pendingPayout}
                fixAt={3}
              />
            </span>
          </p>
        )}
        {promotedPayout > 0 && (
          <p>
            <span className="label">{_t("entry-payout.promoted")}</span>
            <span className="value">
              <FormattedCurrency
                {...this.props}
                value={promotedPayout}
                fixAt={3}
              />
            </span>
          </p>
        )}
        {authorPayout > 0 && (
          <p>
            <span className="label">{_t("entry-payout.author-payout")}</span>
            <span className="value">
              <FormattedCurrency
                {...this.props}
                value={authorPayout}
                fixAt={3}
              />
            </span>
          </p>
        )}
        {curatorPayout > 0 && (
          <p>
            <span className="label">{_t("entry-payout.curators-payout")}</span>
            <span className="value">
              <FormattedCurrency
                {...this.props}
                value={curatorPayout}
                fixAt={3}
              />
            </span>
          </p>
        )}
        {beneficiary.length > 0 && (
          <p>
            <span className="label">{_t("entry-payout.beneficiary")}</span>
            <span className="value">
              {beneficiary.map((x, i) => (
                <Fragment key={i}>
                  {x.account}: {(x.weight / 100).toFixed(0)}% <br />
                </Fragment>
              ))}
            </span>
          </p>
        )}
        {breakdownPayout.length > 0 && (
          <p>
            <span className="label">{_t("entry-payout.breakdown")}</span>
            <span className="value">
              {breakdownPayout.map((x, i) => (
                <Fragment key={i}>
                  {x} <br />
                </Fragment>
              ))}
            </span>
          </p>
        )}
        <p>
          <span className="label">{_t("entry-payout.payout-date")}</span>
          <span className="value">{payoutDate}</span>
        </p>
        {payoutLimitHit && (
          <p>
            <span className="label">{_t("entry-payout.max-accepted")}</span>
            <span className="value">
              <FormattedCurrency {...this.props} value={maxPayout} fixAt={3} />
            </span>
          </p>
        )}
      </div>
    );
  }
}

export class EntryPayout extends Component<Props> {
  render() {
    const { entry } = this.props;
    const check = entry.max_accepted_payout;
    const searchPayout = entry.id || 0; //id exist in search results, post_id in rpc results

    // const isPayoutDeclined = parseAsset(entry.max_accepted_payout).amount === 0;

    // const pendingPayout = parseAsset(entry.pending_payout_value).amount;
    // const authorPayout = parseAsset(entry.author_payout_value).amount;
    // const curatorPayout = parseAsset(entry.curator_payout_value).amount;
    // const maxPayout = parseAsset(entry.max_accepted_payout).amount;

    // const totalPayout = pendingPayout + authorPayout + curatorPayout;

    // const payoutLimitHit = totalPayout >= maxPayout;
    // const shownPayout = payoutLimitHit && maxPayout > 0 ? maxPayout :

    let isPayoutDeclined,
      pendingPayout,
      authorPayout,
      curatorPayout,
      maxPayout,
      totalPayout,
      payoutLimitHit,
      shownPayout;

    if (check) {
      isPayoutDeclined = parseAsset(entry.max_accepted_payout).amount === 0;

      pendingPayout = parseAsset(entry.pending_payout_value).amount;
      authorPayout = parseAsset(entry.author_payout_value).amount;
      curatorPayout = parseAsset(entry.curator_payout_value).amount;
      maxPayout = parseAsset(entry.max_accepted_payout).amount;
      totalPayout = pendingPayout + authorPayout + curatorPayout;
      payoutLimitHit = totalPayout >= maxPayout;
      shownPayout = payoutLimitHit && maxPayout > 0 ? maxPayout : totalPayout;
    }

    if (searchPayout > 0) {
      shownPayout = entry.payout;
    }

    const popover = (
      <Popover id={`payout-popover`} className="payout-popover">
        <Popover.Content>
          <EntryPayoutDetail {...this.props} />
        </Popover.Content>
      </Popover>
    );

    return searchPayout <= 0 ? (
      <OverlayTrigger
        trigger={["hover", "focus"]}
        overlay={popover}
        delay={1000}
      >
        <div
          className={_c(
            `entry-payout ${isPayoutDeclined ? "payout-declined" : ""} ${
              payoutLimitHit ? "payout-limit-hit" : ""
            } notranslate`
          )}
        >
          <FormattedCurrency {...this.props} value={shownPayout} />
        </div>
      </OverlayTrigger>
    ) : (
      <div
        className={_c(
          `entry-payout ${isPayoutDeclined ? "payout-declined" : ""} ${
            payoutLimitHit ? "payout-limit-hit" : ""
          } notranslate`
        )}
      >
        <FormattedCurrency {...this.props} value={shownPayout} />
      </div>
    );
  }
}

export default (p: Props) => {
  const props = {
    global: p.global,
    dynamicProps: p.dynamicProps,
    entry: p.entry,
  };

  return <EntryPayout {...props} />;
};
