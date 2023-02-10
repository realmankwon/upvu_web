export const vestsToSp = (vests: number, steemPerMVests: number): number => (vests / 1e6) * steemPerMVests;

export const spToVests = (sp: number, steemPerMVests: number) => (sp * 1e6) / steemPerMVests;

export const vestsToRshares = (vests: number, votingPower: number, votePerc: number): number => {
  const vestingShares = vests * 1e6;
  const power = (votingPower * votePerc) / 1e4 / 50 + 1;
  return (power * vestingShares) / 1e4;
};
