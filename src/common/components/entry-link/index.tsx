import React, { ReactNode } from "react";
import { useLocation } from "react-router";

import { History } from "history";

import { Entry } from "../../store/entries/types";

import { getPost } from "../../api/bridge";

import { history as historyFromStore } from "../../store";

export const makePath = (category: string, author: string, permlink: string, toReplies: boolean = false) =>
  `/${category}/@${author}/${permlink}${toReplies ? "#replies" : ""}`;

export interface PartialEntry {
  category: string;
  author: string;
  permlink: string;
}

interface Props {
  history: History;
  children: ReactNode;
  entry: Entry | PartialEntry;
  afterClick?: () => void;
}

const EntryLink: React.FC<Props> = ({ history = historyFromStore, children, entry, afterClick }) => {
  const location = useLocation();

  const clicked = async (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();

    if (afterClick) afterClick();

    if (!("title" in entry)) {
      // Get full content if the "entry" passed is "PartialEntry"
      try {
        const resp = await getPost(entry.author, entry.permlink);
        if (resp) {
          return history!.push(makePath(resp.category, resp.author, resp.permlink));
        }
      } catch (e) {
        return;
      }
    }

    return history!.push(makePath(entry.category, entry.author, entry.permlink), {
      background: location,
    });
  };

  const href = makePath(entry.category, entry.author, entry.permlink);
  const _props = Object.assign({}, children!["props"], { href, onClick: clicked });
  return React.createElement("a", _props);
};

export default (props: Props) => {
  return <EntryLink {...props} />;
};
