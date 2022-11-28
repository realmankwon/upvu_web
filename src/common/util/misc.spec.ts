import { parseUrl } from "./misc";

it("1 - Invalid", () => {
  expect(parseUrl("foo")).toMatchSnapshot();
  expect(parseUrl("")).toMatchSnapshot();
  expect(parseUrl(" foo  https://upvu.org bar ")).toMatchSnapshot();
});

it("2 - Valid", () => {
  expect(parseUrl("https://upvu.org")).toMatchSnapshot();
  expect(parseUrl("  https://upvu.org  ")).toMatchSnapshot();
  expect(parseUrl("https://upvu.org/hive-125125/@ecency/onboarding-more-users-join-us")).toMatchSnapshot();
});
