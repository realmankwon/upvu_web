import axios from "axios";

import { apiUpvuBase, apiBase } from "./helper";

export const hsTokenRenew = (
  code: string,
  access_token: string | undefined,
  refresh_token: string | undefined
): Promise<{
  username: string;
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> =>
  axios
    // .post(apiBase(`/auth-api/hs-token-refresh`), {
    .post(apiUpvuBase(`/upvuweb-api/jwt-auth`), {
      code,
      access_token,
      refresh_token,
    })
    .then((resp) => resp.data);
