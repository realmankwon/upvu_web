import React from "react";

interface ValueDescViewProp {
  val: string;
  desc: string;
}

export const ValueDescView = ({ val, desc }: ValueDescViewProp) => {
  return (
    <div className="container">
      <div className="value">{val}</div>
      <div className="description">{desc}</div>
    </div>
  );
};
