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
import Ecosystem from "../components/ecosystem";

class EcosystemPage extends Component<PageProps> {
  // componentDidMount() {
  //   console.log('IMOUNTED')
  // }

  render() {
    //  Meta config
    const metaProps = {
      title: _t("ecosystem.title"),
      description: _t("ecosystem.description"),
    };

    const { global } = this.props;
    let containerClasses = global.isElectron ? "app-content ecosystem-page mt-0 pt-6" : "app-content ecosystem-page";

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
          <div className="ecosystem-list">
            <div className="list-header">
              <h1 className="list-title">{_t("ecosystem.title")}</h1>
            </div>
            <div className="list-items">
              <Ecosystem {...this.props} />
            </div>
          </div>
        </div>
      </>
    );
  }
}

export default connect(pageMapStateToProps, pageMapDispatchToProps)(EcosystemPage);
