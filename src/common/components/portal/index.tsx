import { Component, forwardRef, useEffect, useState, PropsWithChildren } from "react";
import ReactDOM from "react-dom";

const Portal: React.FC<PropsWithChildren<any>> = ({ children }) => {
  const el = document.getElementById("modal");
  return ReactDOM.createPortal(children, el!);
};

export default Portal;
