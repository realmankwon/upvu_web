import React from "react";
import { hydrate } from "react-dom";
import { Provider } from "react-redux";
import { ConnectedRouter } from "connected-react-router";
import configureStore from "../common/store/configure";
import { hasKeyChainAct } from "../common/store/global";
import { clientStoreTasks } from "../common/store/helper";
import { history } from "../common/store";
import App from "../common/app";
import { AppWindow } from "./window";
import "../style/theme-day.scss";
import "../style/theme-night.scss";
import "./base-handlers";
import { loadableReady } from "@loadable/component";
import { Web3ReactProvider, createWeb3ReactRoot } from "@web3-react/core";
import { Web3Provider } from "@ethersproject/providers";
const getLibrary = (provider: any) => new Web3Provider(provider);

declare var window: AppWindow;

const store = configureStore(window["__PRELOADED_STATE__"]);

if (process.env.NODE_ENV === "production") {
  console.log(`@@@@@@@(((((@@@@@@@@@@@@@
@@@(((((((((((((@@@@@@@@@
@((((@@@@@@@@@((((@@@@@@@
@(((@@@(((((@@@((((%@@@@@   
((((@@@(((@@@@#((((((((%@
((((@@@((((((((((@@@@((((
((((@@@@@@&&&@@@@@@@@@(((
((((@@@@@@@@@@@@@@@@@((((
(((((%@@@@@@@@@%%(((((((@
@@(((((((((((((((((((@@@@`);
  console.log("%c%s", "font-size: 16px;", "We are hiring!");
  console.log(
    "%c%s",
    "font-size: 12px;",
    "Are you developer, looking ways to contribute? \nhttps://github.com/realmankwon/upvu_web.git \n\n"
  );
}

loadableReady().then(() => {
  hydrate(
    <Provider store={store}>
      <Web3ReactProvider getLibrary={getLibrary}>
        <ConnectedRouter history={history!}>
          <App />
        </ConnectedRouter>
      </Web3ReactProvider>
    </Provider>,
    document.getElementById("root")
  );

  clientStoreTasks(store);

  // Check & activate keychain support
  window.addEventListener("load", () => {
    setTimeout(() => {
      if (window.steem_keychain) {
        window.steem_keychain.requestHandshake(() => {
          store.dispatch(hasKeyChainAct());
        });
      }
    }, 50);
  });
});

if (module.hot) {
  module.hot.accept("../common/app", () => {
    hydrate(
      <Provider store={store}>
        <ConnectedRouter history={history!}>
          <Web3ReactProvider getLibrary={getLibrary}>
            <App />
          </Web3ReactProvider>
        </ConnectedRouter>
      </Provider>,
      document.getElementById("root")
    );
  });
}
