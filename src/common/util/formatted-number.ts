import numeral from "numeral";

interface Options {
  fractionDigits?: number;
  prefix?: string;
  suffix?: string;
}

export default (value: number | string, options: Options | undefined = undefined) => {
  let opts: Options = {
    fractionDigits: 3,
    prefix: "",
    suffix: "",
  };

  if (options) {
    opts = { ...opts, ...options };
  }

  const { fractionDigits, prefix, suffix } = opts;

  let format = "0,0";

  if (fractionDigits) {
    format += "." + "0".repeat(fractionDigits);
  }

  let out = "";

  if (prefix) out += prefix + " ";
  // turn too small values to zero. Bug: https://github.com/adamwdraper/Numeral-js/issues/563
  const av = value ? (Math.abs(parseFloat(value.toString())) < 0.0001 ? 0 : value) : 0;
  out += numeral(av).format(format);
  if (suffix) out += " " + suffix;

  return out;
};
