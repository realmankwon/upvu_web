import React, { Component, useEffect, useState } from "react";

import { connect } from "react-redux";

import Meta from "../components/meta";
import Theme from "../components/theme/index";
import NavBar from "../components/navbar/index";
import NavBarElectron from "../../desktop/app/components/navbar";
import LeaderBoard from "../components/leaderboard";
import Curation from "../components/curation";
import PopularUsers from "../components/popular-users";
import FullHeight from "../components/full-height";
import ScrollToTop from "../components/scroll-to-top";

import { _t } from "../i18n";

import { PageProps, pageMapDispatchToProps, pageMapStateToProps } from "./common";
import { getEcosystem } from "../api/hive-engine";
import Ecosystem from "../components/ecosystem";

class DiscoverPage extends Component<PageProps> {
  // componentDidMount() {
  //   console.log('IMOUNTED')
  // }

  render() {
    //  Meta config
    const metaProps = {
      title: _t("discover.title"),
      description: _t("discover.description"),
    };

    const { global } = this.props;
    let containerClasses = global.isElectron ? "app-content discover-page mt-0 pt-6" : "app-content discover-page";

    return (
      <>
        <Meta {...metaProps} />
        <ScrollToTop />
        <FullHeight />
        <Theme global={this.props.global} />
        {global.isElectron
          ? NavBarElectron({
              ...this.props,
            })
          : NavBar({ ...this.props })}
        <div className={containerClasses}>
          <div>
            <div>Steem Ecosystem</div>
            <Ecosystem />
          </div>
        </div>
      </>
    );
  }
}

export default connect(pageMapStateToProps, pageMapDispatchToProps)(DiscoverPage);
