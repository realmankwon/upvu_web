import axios from "axios";

import defaults from "../constants/defaults.json";

import { apiBase } from "./helper";
import { PrivateKey } from "@upvu/dsteem";
import { getPostingKey } from "../helper/user-token";
import crypto from "crypto";

export const getEmojiData = () => fetch(apiBase("/emoji.json")).then((response) => response.json());

export const uploadImage = async (
  file: File,
  username: string
): Promise<{
  url: string;
}> => {
  // const fData = new FormData();
  // fData.append("file", file);

  // // const postUrl = `${defaults.imageServer}/hs/${token}`;
  // const postUrl = `${defaults.imageServer}/`;
  // return axios
  //   .post(postUrl, fData, {
  //     headers: {
  //       "Content-Type": "multipart/form-data",
  //     },
  //   })
  //   .then((r) => r.data);

  let data: any, dataBs64;

  if (file) {
    // drag and drop
    const reader: any = new FileReader();
    data = await new Promise((resolve) => {
      reader.addEventListener("load", () => {
        const result = new Buffer(reader.result, "binary");
        resolve(result);
      });
      reader.readAsBinaryString(file);
    });
  } else {
    // recover from preview
    // const commaIdx = dataUrl.indexOf(',');
    // dataBs64 = dataUrl.substring(commaIdx + 1);
    // data = new Buffer(dataBs64, 'base64');
  }

  let sig;
  const formData = new FormData();

  const postingKey = getPostingKey(username);

  if (postingKey) {
    // const data = fs.readFileSync(file);
    const key = PrivateKey.fromString(postingKey);
    const imageHash = crypto.createHash("sha256").update("ImageSigningChallenge").update(data).digest();
    sig = key.sign(imageHash).toString();
  } else {
    const prefix = new Buffer("ImageSigningChallenge");
    const buf = Buffer.concat([prefix, data]);

    if (file) {
      formData.append("file", file);
    }
    const response: any = await new Promise((resolve) => {
      window.steem_keychain.requestSignBuffer(username, JSON.stringify(buf), "Posting", (response: any) => {
        resolve(response);
      });
    });
    if (response.success) {
      sig = response.result;
    } else {
      console.log("progress", response);
      // progress({ error: response.message });
      return { url: "" };
    }
  }

  const uploadImageUrl = "https://steemitimages.com";

  const postUrl = `${uploadImageUrl}/${username}/${sig}`;

  const result = await axios
    .post(postUrl, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
    .then((r) => {
      console.log(r);
      return r.data;
    })
    .catch((err) => {
      console.log(err);
    });

  console.log("result", result);

  return result;
};

export const getMarketData = (
  coin: string,
  vsCurrency: string,
  fromTs: string,
  toTs: string
): Promise<{ prices?: [number, number] }> => {
  const u = `https://api.coingecko.com/api/v3/coins/${coin}/market_chart/range?vs_currency=${vsCurrency}&from=${fromTs}&to=${toTs}`;
  return axios.get(u).then((r) => r.data);
};

export const getCurrencyRate = (cur: string): Promise<any> => {
  if (cur === "sbd") {
    return new Promise((resolve) => resolve(1));
  }

  const u = `https://api.coingecko.com/api/v3/simple/price?ids=steem-dollars&vs_currencies=${cur}`;
  return axios
    .get(u)
    .then((r) => r.data)
    .then((r) => {
      r["steem-dollars"][cur];
    });
};

export const geLatestDesktopTag = (): Promise<string> =>
  axios
    .get("https://api.github.com/repos/ecency/ecency-vision/releases/latest")
    .then((r) => r.data)
    .then((r) => r.tag_name);
