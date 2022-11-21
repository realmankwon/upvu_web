import { KeyChainImpl } from "../common/helper/keychain";

export interface AppWindow extends Window {
  usePrivate: boolean;
  developingPrivate: boolean;
  nws?: WebSocket;
  comTag?: {};
  steem_keychain?: KeyChainImpl;
  twttr?: {
    widgets?: {
      load: () => void;
    };
  };
}
