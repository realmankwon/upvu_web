import React, { Component } from "react";
import { pageMapDispatchToProps, pageMapStateToProps, PageProps } from "../common";
import Meta from "../../components/meta";
import ScrollToTop from "../../components/scroll-to-top";
import Theme from "../../components/theme";
import NavBarElectron from "../../../desktop/app/components/navbar";
import NavBar from "../../components/navbar";
import { connect } from "react-redux";

class GettingStartedWithUPVU extends Component<PageProps> {
  render() {
    //  Meta config
    const metaProps = {
      title: "Privacy Policy",
    };

    const { global } = this.props;
    let containerClasses = global.isElectron ? " mt-0 pt-6" : "";

    return (
      <>
        <Meta {...metaProps} />
        <ScrollToTop />
        <Theme global={this.props.global} />
        {global.isElectron
          ? NavBarElectron({
              ...this.props,
            })
          : NavBar({ ...this.props })}

        <div className={"app-content static-page privacy-page" + containerClasses}>
          <div className="static-content">
            <h1 className="page-title">Getting Started with UPVU</h1>
            <p className="static-last-updated"></p>

            <h2>What is UPVU?</h2>
            <p>
              UPVU is a Steem blockchain-based representative yield aggregator that allows users to delegate their SP to
              UPVU and receive voting support with higher efficiency.
            </p>
            <p>
              The UPVU service is based on a mechanism natively built into the Steem blockchain, so it is highly secure
              and free from hacking and other risks. And anyone with a Steem account can use it easily and simply.
            </p>

            <h2>What are the benefits of using UPVU?</h2>
            <ul>
              <li>
                It’s easy to use, simple, and very secure. All you have to do is delegate your SteemPower to @upvu or
                just hold UPVU tokens.
              </li>
              <li>You can get much greater author rewards than self-voting or voting using sub-account.</li>
              <li>You can get curation rewards that are originally received in SP(Steem Power) as liquid STEEM.</li>
              <li>
                You can also get additional TRX rewards paid at a rate of 1:0.5 to SP rewards. (the reward ratio is
                subject to change according to Steemit Inc’s policy)
              </li>
              <li>
                If you set UPVU as a governance voting proxy, you can get more rewards through the “Boost” function.
                <p>
                  <strong>
                    <i>
                      "We are working to make the Steem ecosystem healthier and more active by voting for better Steem
                      Witness Candidates."
                    </i>
                  </strong>
                </p>
              </li>
              <li>The delegated SP can be retrieved anytime you want, and you have full control over your assets.</li>
              <li>
                UPVU token can be exchanged 1:1 with STEEM at any time, simply transfer the tokens to @upvu if you wish.
                The unstaking period of UPVU tokens is much shorter than that of delegated SPs, around 1-2 weeks. (NOTE
                : Period required to liquidate the delegated SP into STEEM : 4weeks + 3days)
              </li>
            </ul>

            <h2>How to get started with UPVU?</h2>
            <p>Just delegate your Steem Power to @upvu. That’s it!</p>
            <p>
              For a more comfortable user experience, we have built a separate UPVU dashboard page. You can quickly and
              easily delegate SP on the UPVU dashboard by clicking the wallet icon in the upper right corner.
            </p>
            <p>In addition, tools that can be used when delegating SP are as follows:</p>
            <ul>
              <li>
                Steem keychain extension (Desktop only) :{" "}
                <a href="https://chrome.google.com/webstore/detail/steemkeychain/jhgnbkkipaallpehbohjmkbjofjdmeid">
                  Download
                </a>
              </li>
              <li>
                Steemworld : <a href="https://steemworld.org">https://steemworld.org</a>
              </li>
            </ul>

            <p>
              If you have any questions on the UPVU dashboard, you can hover your mouse cursor over the help icon, and
              refer to the "Glossary of Terms" below for a summary of each term.
            </p>
            <br />
            <h4>
              <strong>[NOTICE]</strong>
            </h4>
            <ul>
              <li>
                (Minimum Quantity) Due to the 3 decimal place limitation of the Steem blockchain,{" "}
                <strong>the recommended minimum delegation amount is 200 SP.</strong>
              </li>
              <li>
                (Snapshot Time) UPVU Power’s snapshots are taken daily at <strong>00:00 KST (UTC+9)</strong>.
              </li>
              <li>
                (Voting Support) You can get upvoting from @upvu from the next day after SP delegation(after snapshot).
              </li>
              <li>
                (Liquid STEEM Rewards) Curation rewards will be paid 1 week after the 1st voting starts. This is due to
                the unique nature of Steem’s PoB(Proof-of-Brain) mechanism. (7 days required for author reward &
                curation reward payout)
              </li>
              <li>
                (Reward Type) You can choose between <strong>STEEM and UPVU</strong> as the curation reward type.
                However, if Steem-Engine is unstable or unavailable, STEEM is automatically changed to default. In the
                future, selectable reward type options will be added.
              </li>
              <li>
                (Additional Delegation) If you are already delegating an SP to @upvu and renting additional SPs, please
                check the quantity carefully before delegating. You must enter the sum of the quantity you want to add
                to the quantity currently being delegated. Otherwise, delegation retrieve may occur.
              </li>
            </ul>

            <h2>Glossary of Terms</h2>
            <ul>
              <li>
                Total Amount : The sum of the SP delegated to @upvu and the balance of UPVU tokens currently held in
                your wallet.
              </li>
              <li>Delegated SP : Total amount of SPs delegated to @upvu.</li>
              <li>
                UPVU Token : Steem Engine based liquidity token with the same utility as SP(Steem Power) but with a much
                shorter unstaking period(It takes 1~2 weeks on average to convert UPVU to STEEM). If you want to
                convert, just transfer your STEEM to @upvu.
              </li>
              <li>VP Weight : Voting Power weight to get upvotes from @upvu today.</li>
              <li>
                Earning Rate : The rate of return that can be obtained through the use of UPVU. The calculation method
                is as follows. [(Liquid STEEM reward + Author Reward) / Your UPVU Power * 100]
              </li>
              <li>
                Reward Type : Users can basically receive Liquid Steem instead of SP as a reward when using UPVU. If you
                want to be rewarded with a token other than STEEM, you can change the reward type.
              </li>
              <li>Set Type : From the list, you can select the token you would like to receive as a reward.</li>
              <li>Boost Reward : Displays "Y" if proxy is set, "N" if not set.</li>
              <li>
                Set Proxy : You can get more rewards if you set @upvu.proxy as your Steem Governance voting proxy.
              </li>
              <li>
                Liquid Steem : Originally, author rewards and curation rewards are paid in SP(Staked Steem), but if you
                use UPVU, you can receive them in liquid STEEM.
              </li>
              <li>Author Reward : Author rewards earned so far through upvoting by @upvu.</li>
              <li>Tron Reward : Total amount of TRX earned as an additional reward for curation rewards.</li>
              <li>Tron Interest : Additional interest earned through TRX staking in UPVU vault.</li>
            </ul>
          </div>
        </div>
      </>
    );
  }
}
export default connect(pageMapStateToProps, pageMapDispatchToProps)(GettingStartedWithUPVU);
