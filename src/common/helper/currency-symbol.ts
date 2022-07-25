const symbolMap = require("currency-symbol-map");

export default (currency: string): string => {
  if (currency === "sbd") {
    return "$";
  }

  return symbolMap(currency);
};
