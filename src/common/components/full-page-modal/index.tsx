import React, { PropsWithChildren, useEffect } from "react";
import { useSelector } from "react-redux";
import _c from "../../util/fix-class-names";

// @ts-ignore
import styles from "./styles.module.scss";

const FullPageModal: React.FC<PropsWithChildren<any>> = ({ children }) => {
  const theme = useSelector((state: any) => state.global.theme);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  return <div className={_c(`theme-${theme} ${styles.container}`)}>{children}</div>;
};

export default FullPageModal;
