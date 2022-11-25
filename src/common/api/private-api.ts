import axios from "axios";

import { PointTransaction } from "../store/points/types";
import { ApiNotification, ApiNotificationSetting, NotificationFilter } from "../store/notifications/types";
import { Entry } from "../store/entries/types";

import { getAccessToken } from "../helper/user-token";

import { apiBase, apiUpvuBase } from "./helper";
import { AppWindow } from "../../client/window";
import moment from "moment";

declare var window: AppWindow;

export interface ReceivedVestingShare {
  delegatee: string;
  delegator: string;
  timestamp: string;
  vesting_shares: string;
}

export const getReceivedVestingShares = (username: string): Promise<ReceivedVestingShare[]> =>
  axios.get(apiBase(`/private-api/received-vesting/${username}`)).then((resp) => resp.data.list);

export interface RewardedCommunity {
  start_date: string;
  total_rewards: string;
  name: string;
}

export const getRewardedCommunities = (): Promise<RewardedCommunity[]> =>
  axios.get(apiBase(`/private-api/rewarded-communities`)).then((resp) => resp.data);

export interface LeaderBoardItem {
  _id: string;
  count: number;
  points: string;
}

export type LeaderBoardDuration = "day" | "week" | "month";

export const getLeaderboard = (duration: LeaderBoardDuration): Promise<LeaderBoardItem[]> => {
  return axios.get(apiBase(`/private-api/leaderboard/${duration}`)).then((resp) => resp.data);
};

export interface CurationItem {
  efficiency: number;
  account: string;
  vests: number;
  votes: number;
  uniques: number;
}

export type CurationDuration = "day" | "week" | "month";

export const getCuration = (duration: CurationDuration): Promise<CurationItem[]> => {
  return axios.get(apiBase(`/private-api/curation/${duration}`)).then((resp) => resp.data);
};

export const signUp = (username: string, email: string, referral: string): Promise<any> =>
  axios
    .post(apiBase(`/private-api/account-create`), {
      username: username,
      email: email,
      referral: referral,
    })
    .then((resp) => {
      return resp;
    });

export const subscribeEmail = (email: string): Promise<any> =>
  axios
    .post(apiBase(`/private-api/subscribe`), {
      email: email,
    })
    .then((resp) => {
      return resp;
    });

export const getNotifications = (
  username: string,
  filter: NotificationFilter | null,
  since: string | null = null,
  lastread: string,
  user: string | null = null
): Promise<ApiNotification[]> => {
  return axios
    .post("https://api.steemit.com/", {
      id: 3,
      jsonrpc: "2.0",
      method: "bridge.account_notifications",
      params: { account: username, last_id: since, limit: 50 },
    })
    .then((resp) => {
      let notifications = resp.data.result.filter((data: any) => {
        if (!filter) return true;
        else if (filter === "rvotes" && (data.type === "vote" || data.type === "unvote")) {
          return true;
        } else if (filter === "mentions" && data.type === "mention") {
          return true;
        } else if (
          filter === "follows" &&
          (data.type === "follow" || data.type === "unfollow" || data.type === "ignore")
        ) {
          return true;
        } else if (filter === "replies" && data.type === "reply" && data.type === "reply_comment") {
          return true;
        } else if (filter === "reblogs" && data.type === "reblog") {
          return true;
        } else return false;
      });
      let gkf: any[] = [];

      notifications = notifications.map((data: any) => {
        const notification: any = {};
        notification.type = data.type;
        notification.timestamp = data.date;

        if (new Date(lastread) < new Date(notification.timestamp)) {
          notification.read = 0;
        } else {
          notification.read = 1;
        }

        let tempGk = data.date.split("T")[0];

        if (new Date().toISOString().split("T")[0] === tempGk) {
          moment(data.date, "YYYY-MM-DD HH:mm:ss").fromNow();
          // tempGk = `${(new Date().getUTCDate().getTime() - new Date(data.date).getTime()) / (1000 * 60 * 60)} hours`;
          tempGk = moment.utc(data.date, "YYYY-MM-DD HH:mm:ss").fromNow();
        }

        if (!gkf.includes(tempGk)) {
          notification.gkf = true;
          gkf.push(tempGk);
        } else {
          notification.gkf = false;
        }
        notification.gk = tempGk;

        notification.id = data.id;
        notification.source = data.msg.split(" ")[0].replace("@", "");

        if (data.type === "vote" || data.type === "unvote") {
          notification.voter = data.msg.split(" ")[0].replace("@", "");
          notification.weight = data.msg.split("($")[1].replace(")", "");
          notification.author = data.url.split("/")[0].replace("@", "");
          notification.permlink = data.url.split("/")[1];
          notification.title = null;
          notification.img_url = null;
        } else if (data.type === "mention") {
          notification.account = data.msg.split(" ")[0].replace("@", "");
          notification.author = data.url.split("/")[0].replace("@", "");
          notification.permlink = data.url.split("/")[1];
          notification.post = true;
          notification.title = null;
          notification.img_url = null;
        } else if (data.type === "follow" || data.type === "unfollow" || data.type === "ignore") {
          notification.follower = username;
          notification.following = data.url.replace("@", "");
          notification.blog = true;
          notification.title = null;
          notification.img_url = null;
        } else if (data.type === "reply") {
          notification.author = data.url.split("/")[0].replace("@", "");
          notification.permlink = data.url.split("/")[1];
          notification.title = "";
          notification.body = "";
          notification.json_metadata = "";
          notification.metadata = "";
          notification.parent_author = data.url.split("/")[0].replace("@", "");
          notification.parent_permlink = data.url.split("/")[1];
          notification.parent_title = null;
          notification.parent_img_url = null;
        } else if (data.type === "reblog") {
          notification.account = data.msg.split(" ")[0].replace("@", "");
          notification.author = data.url.split("/")[0].replace("@", "");
          notification.permlink = data.url.split("/")[1];
          notification.title = null;
          notification.img_url = null;
        }
        return notification;
      });
      return notifications;
    });
};

export const getCurrencyTokenRate = (currency: string, token: string): Promise<number> =>
  axios
    .get(apiBase(`/private-api/market-data/${currency === "sbd" ? "usd" : currency}/${token}`))
    .then((resp: any) => resp.data);

export const getUnreadNotificationCount = (username: string): Promise<number> => {
  return axios
    .post("https://api.steemit.com/", {
      id: 2,
      jsonrpc: "2.0",
      method: "bridge.unread_notifications",
      params: { account: username },
    })
    .then((resp) => resp.data.result);
};

export const markNotifications = (username: string, id: string | null = null) => {
  const data: { code: string | undefined; id?: string } = {
    code: getAccessToken(username),
  };
  if (id) {
    data.id = id;
  }

  return axios.post(apiBase(`/private-api/notifications/mark`), data);
};

export interface UserImage {
  created: string;
  timestamp: number;
  url: string;
  _id: string;
}

export interface Draft {
  body: string;
  createdAt: string;
  tags: string;
  title: string;
  permlink: string;
}

export const getDrafts = (username: string): Promise<Draft[]> => {
  const data = { code: getAccessToken(username) };
  return axios.post(apiUpvuBase(`/upvuweb-api/drafts`), data).then((resp) => resp.data);
};

export const addDraft = (username: string, title: string, body: string, tags: string): Promise<Draft[]> => {
  const data = { code: getAccessToken(username), title, body, tags };
  return axios.post(apiUpvuBase(`/upvuweb-api/drafts-add`), data).then((resp) => resp.data);
};

export const updateDraft = (
  username: string,
  draftId: string,
  title: string,
  body: string,
  tags: string
): Promise<any> => {
  const data = {
    code: getAccessToken(username),
    permlink: draftId,
    title,
    body,
    tags,
  };
  return axios.post(apiUpvuBase(`/upvuweb-api/drafts-update`), data).then((resp) => resp.data);
};

export const deleteDraft = (username: string, draftId: string): Promise<any> => {
  const data = { code: getAccessToken(username), permlink: draftId };
  return axios.post(apiUpvuBase(`/upvuweb-api/drafts-delete`), data).then((resp) => resp.data);
};

export interface Schedule {
  username: string;
  permlink: string;
  title: string;
  body: string;
  tags: string;
  tags_arr: string[];
  scheduledAt: string;

  original_schedule: string;
  reblog: boolean;
  status: 1 | 2 | 3 | 4;
  message: string | null;
}

export const getSchedules = (username: string): Promise<Schedule[]> => {
  const data = { code: getAccessToken(username) };
  return axios.post(apiUpvuBase(`/upvuweb-api/schedules`), data).then((resp) => resp.data);
};

export const addSchedule = (
  username: string,
  permlink: string,
  title: string,
  body: string,
  meta: {},
  options: {},
  scheduledAt: string,
  reblog: boolean
): Promise<any> => {
  const data = {
    code: getAccessToken(username),
    permlink,
    title,
    body,
    meta,
    options,
    scheduledAt,
    reblog,
  };

  return axios.post(apiUpvuBase(`/upvuweb-api/schedules-add`), data).then((resp) => resp.data);
};

export const deleteSchedule = (username: string, permlink: string): Promise<any> => {
  const data = { code: getAccessToken(username), permlink };
  return axios.post(apiUpvuBase(`/upvuweb-api/schedules-delete`), data).then((resp) => resp.data);
};

export const moveSchedule = (username: string, permlink: string): Promise<any> => {
  const data = { code: getAccessToken(username), permlink };
  return axios.post(apiUpvuBase(`/upvuweb-api/schedules-move`), data).then((resp) => resp.data);
};

export interface Bookmark {
  _id: string;
  author: string;
  permlink: string;
  timestamp: number;
  createdAt: string;
}

export const getBookmarks = (username: string): Promise<Bookmark[]> => {
  const data = { code: getAccessToken(username) };
  return axios.post(apiUpvuBase(`/upvuweb-api/bookmarks`), data).then((resp) => resp.data);
};

export const addBookmark = (username: string, author: string, permlink: string): Promise<{ bookmarks: Bookmark[] }> => {
  const data = { code: getAccessToken(username), author, permlink };
  return axios.post(apiUpvuBase(`/upvuweb-api/bookmarks-add`), data).then((resp) => resp.data);
};

export const deleteBookmark = (username: string, bookmarkId: string): Promise<any> => {
  const data = { code: getAccessToken(username), id: bookmarkId };
  return axios.post(apiUpvuBase(`/upvuweb-api/bookmarks-delete`), data).then((resp) => resp.data);
};

export interface Favorite {
  _id: string;
  account: string;
  timestamp: number;
}

export const getFavorites = (username: string): Promise<Favorite[]> => {
  const data = { code: getAccessToken(username) };
  return axios.post(apiUpvuBase(`/upvuweb-api/favorites`), data).then((resp) => resp.data);
};

export const checkFavorite = (username: string, account: string): Promise<boolean> => {
  const data = { code: getAccessToken(username), account };
  return axios.post(apiUpvuBase(`/upvuweb-api/favorites-check`), data).then((resp) => resp.data);
};

export const addFavorite = (username: string, account: string): Promise<{ favorites: Favorite[] }> => {
  const data = { code: getAccessToken(username), account };
  return axios.post(apiUpvuBase(`/upvuweb-api/favorites-add`), data).then((resp) => resp.data);
};

export const deleteFavorite = (username: string, account: string): Promise<any> => {
  const data = { code: getAccessToken(username), account };
  return axios.post(apiUpvuBase(`/upvuweb-api/favorites-delete`), data).then((resp) => resp.data);
};

export interface Fragment {
  id: string;
  title: string;
  body: string;
  created: string;
  modified: string;
}

export const getFragments = (username: string): Promise<Fragment[]> => {
  const data = { code: getAccessToken(username) };
  return axios.post(apiBase(`/private-api/fragments`), data).then((resp) => resp.data);
};

export const addFragment = (username: string, title: string, body: string): Promise<{ fragments: Fragment[] }> => {
  const data = { code: getAccessToken(username), title, body };
  return axios.post(apiBase(`/private-api/fragments-add`), data).then((resp) => resp.data);
};

export const updateFragment = (username: string, fragmentId: string, title: string, body: string): Promise<any> => {
  const data = { code: getAccessToken(username), id: fragmentId, title, body };
  return axios.post(apiBase(`/private-api/fragments-update`), data).then((resp) => resp.data);
};

export const deleteFragment = (username: string, fragmentId: string): Promise<any> => {
  const data = { code: getAccessToken(username), id: fragmentId };
  return axios.post(apiBase(`/private-api/fragments-delete`), data).then((resp) => resp.data);
};

export const getPoints = (
  username: string
): Promise<{
  points: string;
  unclaimed_points: string;
}> => {
  if (window.developingPrivate) {
    const data = { username };
    return axios.post(apiBase(`/private-api/points`), data).then((resp) => resp.data);
  }

  return new Promise((resolve) => {
    resolve({
      points: "0.000",
      unclaimed_points: "0.000",
    });
  });
};

export const getPointTransactions = (username: string, type?: number): Promise<PointTransaction[]> => {
  if (window.developingPrivate) {
    const data = { username, type };
    return axios.post(apiBase(`/private-api/point-list`), data).then((resp) => resp.data);
  }

  return new Promise((resolve) => {
    resolve([]);
  });
};

export const claimPoints = (username: string): Promise<any> => {
  const data = { code: getAccessToken(username) };
  return axios.post(apiBase(`/private-api/points-claim`), data).then((resp) => resp.data);
};

export const calcPoints = (username: string, amount: string): Promise<{ usd: number; estm: number }> => {
  const data = { code: getAccessToken(username), amount };
  return axios.post(apiBase(`/private-api/points-calc`), data).then((resp) => resp.data);
};

export interface PromotePrice {
  duration: number;
  price: number;
}

export const getPromotePrice = (username: string): Promise<PromotePrice[]> => {
  const data = { code: getAccessToken(username) };
  return axios.post(apiBase(`/private-api/promote-price`), data).then((resp) => resp.data);
};

export const getPromotedPost = (
  username: string,
  author: string,
  permlink: string
): Promise<{ author: string; permlink: string } | ""> => {
  const data = { code: getAccessToken(username), author, permlink };
  return axios.post(apiBase(`/private-api/promoted-post`), data).then((resp) => resp.data);
};

export const getBoostOptions = (username: string): Promise<number[]> => {
  const data = { code: getAccessToken(username) };
  return axios.post(apiBase(`/private-api/boost-options`), data).then((resp) => resp.data);
};

export const getBoostedPost = (
  username: string,
  author: string,
  permlink: string
): Promise<{ author: string; permlink: string } | ""> => {
  const data = { code: getAccessToken(username), author, permlink };
  return axios.post(apiBase(`/private-api/boosted-post`), data).then((resp) => resp.data);
};

export interface CommentHistoryListItem {
  title: string;
  body: string;
  tags: string[];
  timestamp: string;
  v: number;
}

interface CommentHistory {
  meta: {
    count: number;
  };
  list: CommentHistoryListItem[];
}

export const commentHistory = (
  author: string,
  permlink: string,
  onlyMeta: boolean = false
): Promise<CommentHistory> => {
  const data = { author, permlink, onlyMeta: onlyMeta ? "1" : "" };
  return axios.post(apiBase(`/private-api/comment-history`), data).then((resp) => resp.data);
};

export const getPromotedEntries = (): Promise<Entry[]> => {
  if (window.developingPrivate) {
    return axios.get(apiBase(`/private-api/promoted-entries`)).then((resp) => resp.data);
  }

  return new Promise((resolve) => resolve([]));
};

export const proxifyImageSrcConvert = (url?: string, width = 0, height = 0, format = "match"): string => {
  // const imageSrc = proxifyImageSrc(url, width, height, "match");
  if (!url) url = "";
  return url.replace("images.ecency.com", "steemitimages.com").replace("/webp", "");
};

export const getEcosystem = async (): Promise<any> => {
  const ecosystem = await axios.get(apiUpvuBase(`/upvuweb-api/ecosystem`)).then((r) => r.data);

  // console.log("ecosystem", ecosystem);
  return ecosystem;
};

export const getRewardType = async (): Promise<any> => {
  const rewardTypeList = await axios.get(apiUpvuBase(`/upvuweb-api/reward-type`)).then((r) => r.data);

  return rewardTypeList;
};

export const getUPVUInfos = async (account: string): Promise<any> => {
  if (!account) return [];

  const data = {
    code: getAccessToken(account),
  };

  const upvuInfos = await axios
    .post(apiUpvuBase(`/upvuweb-api/upvuinfos`), data)
    .then((r) => r.data)
    .catch((err) => {
      console.log(err);
    });

  console.log("upvuInfos", upvuInfos);
  return upvuInfos;
};

export const requestClaimTronReward = async (account: string, address: string, amount: number): Promise<any> => {
  if (!account) return [];

  const data = {
    code: getAccessToken(account),
    address,
    amount,
  };

  const requesetClaimTron = await axios.post(apiUpvuBase(`/upvuweb-api/upvu-claim`), data).then((r) => r.data);

  console.log("requestClaimTronReward", requesetClaimTron);
  return requesetClaimTron;
};

export const updateRewardType = async (account: string, reward_type: string): Promise<any> => {
  if (!account) return [];

  const data = {
    code: getAccessToken(account),
    reward_type,
  };

  const updateRewardTypeResult = await axios
    .post(apiUpvuBase(`/upvuweb-api/update-reward-type`), data)
    .then((r) => r.data);

  console.log("updateRewardTypeResult", updateRewardTypeResult);
  return updateRewardTypeResult;
};
