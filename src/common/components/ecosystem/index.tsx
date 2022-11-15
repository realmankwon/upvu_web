import React from "react";

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

interface State {
  kinds: string[];
  ecosystem: {};
  loaded: boolean;
}

export default class Ecosystem extends BaseComponent {
  state: State = {
    kinds: [],
    ecosystem: {},
    loaded: false,
  };

  //   kinds = Object.keys(list);

  componentDidMount() {
    const eco = getEcosystem().then((r) => {
      console.log("get eco system", r);

      if (r.success) {
        this.stateSet({ ecosystem: r.list, loaded: true, kinds: Object.keys(r.list) });
      } else {
        alert("fail to load ecosystem list");
      }
    });
  }

  setEcosystem = (list: any) => {};

  render() {
    const { kinds, ecosystem, loaded } = this.state;

    return (
      <div className="ecosystem">
        {loaded
          ? kinds.map((kind) => {
              const sites = ecosystem[kind].map((site: any) => <div>{site.name}</div>);
              return (
                <div key={kind + sites} className="group">
                  <div className="kind">{kind.toUpperCase()}</div>
                  <div className="site">{sites}</div>
                </div>
              );
            })
          : "Loading...."}
      </div>
    );
  }
}
