import React, { Component } from "react";
import { Button } from "react-bootstrap";

import BaseComponent from "../base";

import { getEcosystem } from "../../api/hive-engine";

import {
  informationVariantSvg,
  plusCircle,
  transferOutlineSvg,
  lockOutlineSvg,
  unlockOutlineSvg,
  delegateOutlineSvg,
  undelegateOutlineSvg,
} from "../../img/svg";

import { _t } from "../../i18n";
import LinearProgress from "../linear-progress";
import userAvatar from "../user-avatar";
import { Global } from "../../store/global/types";

interface Props {
  global: Global;
}

interface State {
  kinds: string[];
  ecosystem: {};
  loaded: boolean;
}

interface SiteProp {
  kind: string;
  name: string;
  owner: string;
  image_url?: string;
  description: string;
  sort?: number;
  url: string;
}

export class Ecosystem extends Component<Props> {
  state: State = {
    kinds: [],
    ecosystem: {},
    loaded: false,
  };

  componentDidMount() {
    const eco = getEcosystem().then((r) => {
      console.log("get eco system", r);

      if (r.success) {
        this.setState({ ecosystem: r.list, loaded: true, kinds: Object.keys(r.list) });
      } else {
        alert("fail to load ecosystem list");
      }
    });
  }

  goLink = (url: string) => {
    window.open(url);
  };

  render() {
    const { kinds, ecosystem, loaded } = this.state;

    return (
      <div className="ecosystem-list-item">
        {loaded ? (
          kinds.map((kind) => {
            const sites = ecosystem[kind].map((site: SiteProp) => (
              <div key={site.name} className="site">
                <div className="site-content">
                  <div className="site-content-name">
                    {userAvatar({
                      ...this.props,
                      username: site.owner,
                      size: "medium",
                      src: `https://steemitimages.com/u/${site.owner}/avatar`,
                    })}
                    <div className="site-name">{site.name}</div>
                  </div>
                  <div className="site-content-owner">
                    <div>@{site.owner}</div>
                  </div>
                  <div className="site-content-description">
                    <div>{site.description}</div>
                  </div>
                </div>
                <div className="site-link">
                  <Button
                    className="site-link-btn"
                    onClick={() => {
                      this.goLink(site.url);
                    }}
                  >
                    Link
                  </Button>
                </div>
              </div>
            ));

            return (
              <div key={kind + sites} className="group">
                <div className="kind">{kind.toUpperCase()}</div>
                <div className="sites">{sites}</div>
              </div>
            );
          })
        ) : (
          <LinearProgress />
        )}
      </div>
    );
  }
}

export default (p: Props) => {
  const props: Props = {
    global: p.global,
  };

  return <Ecosystem {...props} />;
};
