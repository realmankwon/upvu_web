import React, { Component, Fragment } from "react";

import { History } from "history";

import { Global } from "../../store/global/types";
import { TrendingTags } from "../../store/trending-tags/types";

import { _t } from "../../i18n";

import _c from "../../util/fix-class-names";
import { ActiveUser } from "../../store/active-user/types";

interface Props {
  history: History;
  global: Global;
  trendingTags: TrendingTags;
  activeUser: ActiveUser | null;
}

export class LeftSideArea extends Component<Props> {
  render() {
    // const { trendingTags, global } = this.props;
    const feedback = require("../../img/feedback.png");

    return (
      <div className="trending-tags-card">
        <a href="https://9au559zzo9w.typeform.com/to/HU37OEka" target={"_blank"}>
          <img className="link-card" src={feedback} />
        </a>
      </div>
    );
  }
}

export default (p: Props) => {
  const props = {
    history: p.history,
    global: p.global,
    trendingTags: p.trendingTags,
    activeUser: p.activeUser,
  };

  return <LeftSideArea {...props} />;
};
