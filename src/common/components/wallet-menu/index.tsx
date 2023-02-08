import React, { Component } from "react";

import { Link } from "react-router-dom";

import { Global } from "../../store/global/types";

import _c from "../../util/fix-class-names";

import { steemSvg } from "../../img/svg";
import { hiveEngineSvg } from "../../img/svg";

interface Props {
  global: Global;
  username: string;
  active: string;
}

export default class WalletMenu extends Component<Props> {
  render() {
    const { global, username, active } = this.props;
    const logo = global.isElectron
      ? "./img/logo-small-transparent.png"
      : require("../../img/logo-small-transparent.png");
    const upvuLogo = require("../../img/logo-circle.png");

    return (
      <div className="wallet-menu">
        {global.developingPrivate && (
          <Link className={_c(`menu-item ecency ${active === "ecency" ? "active" : ""}`)} to={`/@${username}/points`}>
            <span className="title">Punks</span>
            <span className="sub-title">Points</span>
            <span className="platform-logo">
              <img alt="punks" src={logo} />
            </span>
          </Link>
        )}
        <Link className={_c(`menu-item hive ${active === "steem" ? "active" : ""}`)} to={`/@${username}/wallet`}>
          <span className="title">Steem</span>
          <span className="sub-title">Wallet</span>
          <span className="platform-logo">{steemSvg}</span>
        </Link>
        <Link
          className={_c(`menu-item hive-engine ${active === "engine" ? "active" : ""}`)}
          to={`/@${username}/engine`}
        >
          <span className="title">Engine</span>
          <span className="sub-title">Tokens</span>
          <span className="platform-logo">{hiveEngineSvg}</span>
        </Link>
        <Link
          className={_c(`menu-item dashboard ${active === "dashboard" ? "active" : ""}`)}
          to={`/@${username}/dashboard`}
        >
          <span className="title">UPVU</span>
          <span className="sub-title">Dashboard</span>
          <span className="platform-logo">
            {" "}
            <img alt="ecency" src={upvuLogo} />
          </span>
        </Link>
        <Link className={_c(`menu-item hive ${active === "earn" ? "active" : ""}`)} to={`/@${username}/earn`}>
          <span className="title">Earn</span>
          <span className="sub-title">Dashboard</span>
          <span className="platform-logo">
            {" "}
            <img alt="ecency" src={upvuLogo} />
          </span>
        </Link>
      </div>
    );
  }
}
