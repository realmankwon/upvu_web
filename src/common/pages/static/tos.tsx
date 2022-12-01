import React, { Component } from "react";
import { pageMapDispatchToProps, pageMapStateToProps, PageProps } from "../common";
import Meta from "../../components/meta";
import ScrollToTop from "../../components/scroll-to-top";
import Theme from "../../components/theme";
import NavBarElectron from "../../../desktop/app/components/navbar";
import NavBar from "../../components/navbar";
import { connect } from "react-redux";

class TosPage extends Component<PageProps> {
  render() {
    //  Meta config
    const metaProps = {
      title: "Terms Of Service",
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

        <div className={"app-content static-page tos-page" + containerClasses}>
          <div className="static-content">
            <h1 className="page-title">Terms Of Service</h1>
            <p className="static-last-updated">Last Updated November 30, 2022</p>

            <h2>Welcome to Upvu</h2>
            <p>
              <a href="/">Upvu</a> is a 3rd-party frontend for the Steem blockchain built by forking Ecency. In this
              page we describe the terms of service and the rules that you’re agreeing to when using Upvu.
            </p>
            <p>
              Before using any of the provided services, you are required to read, understand, and agree to these terms.
            </p>
            <p>
              This agreement (the “Agreement”) between you and this front-end’s operators (”we”, “us”, “our”) sets out
              your rights to access and use of this site and any other products or services provided by this web site
              (the “Service”). If you are accepting this Agreement and using the Services on behalf of a company,
              organization, government, or other legal entity, you represent and warrant that you are authorized to do
              so and have the authority to bind such entity to this Agreement. By accessing our Service, you agree that
              you have read, understood and accepted this Agreement.
            </p>
            <h2>Modification of this Agreement</h2>
            <p>
              We reserve the right, in our sole discretion, to modify this Agreement. All modifications become effective
              when they are posted, and we will notify you by updating the date at the top of the Agreement.
            </p>
            <p>You can find the latest version in effect at : https://upvu.org</p>
            <h2>Disclaimers</h2>
            <p>
              We do not represent or warrant that access to the frontend interface will be continuous, uninterrupted,
              timely, or secure; that the information contained in the interface will be accurate, reliable, complete,
              or current; or that the interface will be free from errors, defects, viruses, or other harmful elements.
            </p>
            <p>Some, but not all, risks of operating on Upvu outlined are:</p>
            <ul>
              <li>risk of you loosing your private keys and thus access to STEEM/SP/SBD we are not responsible.</li>
              <li>
                risk or mistakenly posting content. (Risk that you can not change or modify on the Steem blockchain)
              </li>
              <li>risk of server failure or temporary loss of access to Upvu</li>
              <li>
                risk of transaction not being sent to Steem blockchain (such as through technical failure by Upvu or a
                third-party such as the Steem blockchain itself)
              </li>
            </ul>
            <p>
              Your use of the Service and Steem Content is solely at your own risk. Some jurisdictions do not allow the
              disclaimer of implied terms in contracts with consumers, so some or all the disclaimers in this section
              may not apply to you.
            </p>
            <h2>Privacy Policy</h2>
            <p>
              When you use the frontend interface, the only information we collect from you is your blockchain wallet
              account(address), completed transaction hashes, and token identifiers. We do not collect any personal
              information from you. We do, however, use third-party services like Google Analytics, which may receive
              your publicly available personal information. We do not take responsibility for any information you make
              public on the Steem blockchain by taking actions through the frontend interface.
            </p>
            <h2>Eligibility</h2>
            <p>
              The service is not targeted toward, nor intended for use by, anyone under the age of 13. You must be at
              least 13 years of age to access or use of the service. If you are between 13 and 18 years of age (or the
              age of legal majority where you reside), you may only access or use the service under the supervision of a
              parent or legal guardian who agrees to be bound by this agreement.
            </p>
            <h2>Limitation of Liability</h2>
            <p>
              In using our services, you may view content or utilize services provided by third-parties, including links
              to web pages and services of such parties (”Third-Party Content”). We do not control, endorse, or adopt
              any Third-Party Content and will have no responsibility for Third-Party Content including, without
              limitation, material that may be misleading, incomplete, erroneous, offensive, indecent, or otherwise
              objectionable in your jurisdiction. In addition, your dealings or correspondence with such third-parties
              are solely between you and the third-parties. We are not responsible or liable for any loss or damage of
              any sort incurred because of any such dealings and you understand that your use of Third-Party Content,
              and your interactions with third-parties, is at your own risk.
            </p>
            <h2>Account Registration</h2>
            <p>
              You need not use a Steem blockchain account provided by us, and you can create an account independently of
              the Service. If you would like to user part of the Service, you must create a Steem blockchain account.
              When you create an account, you are strongly advised to take the following precautions, as failure to do
              so may result in loss of access to, and/or control over, your account:
            </p>
            <ul>
              <li>Store your private key in your own secure way, somewhere only you know.</li>
              <li>
                Rather than entering your private key directly into the website, use an identity verification tool such
                as Steem Keychain.
              </li>
              <li>
                Maintain the security of your account by protecting your account password and access to your computer
                and your account.
              </li>
            </ul>
            <p>
              You hereby accept and acknowledge that you take responsibility for all activities that occur under your
              account and accept all risks of any authorized or unauthorized access to your account, to the maximum
              extent permitted by law.
            </p>
            <p>
              You acknowledge and understand that digital asset & blockchain technology is a progressing field. Advances
              in code cracking or technical advances such as the development of quantum computers may present risks to
              the services that you use and your account, which could result in the theft or loss of your property. By
              using the service or accessing Steem Content, you acknowledge these inherent risks.
            </p>

            <h2>The Services</h2>
            <p>
              As described in more detail below, the Services, among other things, provide software that facilitates the
              submission of Steem blockchain transaction data to the Steem blockchain without requiring you to access
              the Steem blockchain command line interface.
            </p>
            <p>
              <strong>(Account & Private keys)</strong> Should you agree to create an account through our service, we
              generate a cryptographic private and public key pair that are provided solely to you and completely owned
              by you; provided however that we not store passwords or private keys for our you. We never have access to
              your private key and do not custody any private keys on your behalf, and therefore, assume no
              responsibility for the management of the private key tied to your account. The private key uniquely match
              the account name and must be used in connection with the account to authorize the transfer of STEEM and
              SBD from that account. You are solely responsible for maintaining the security of your private keys. You
              must keep your private key access information secure. Failure to do so may result in the loss of control
              of STEEM, SP and SBD associated with your account.
            </p>
            <p>
              <strong>(No Password Retrieval)</strong> We do not receive or store your account password or private keys.
              Your private key is your own and you are solely responsible for their safekeeping. We can not assist you
              with account password retrieval, reset, or recovery. You are solely responsible for remembering your
              account password. If you have not safely stored a backup of any account and password pairs maintained in
              your account, you accept and acknowledge that any STEEM, SP and SBD you have associated with such account
              will become permanently inaccessible if you do not have your account password.
            </p>
            <p>
              <strong>(Transactions)</strong> All proposed Steem blockchain transactions must be confirmed and recorded
              in the Steem blockchain via the Steem distributed consensus network (a peer-to-peer network), which is not
              owned, controlled, or operated by us. The Steem blockchain is operated by a decentralized network of
              independent third parties. We have no control over the Steem blockchain and therefore cannot and will not
              ensure that any transaction details you submit via the Services will be confirmed on the Stem blockchain.
              You acknowledge and agree that the transaction details you submit via the Services may not be completed,
              or may be substantially delayed, by the Steem blockchain. You may user the Services to submit these
              details to the Steem blockchain.
            </p>
            <p>
              <strong>(Right to control digital assets)</strong> STEEM, in any of its forms (STEEM, SBD and SP) is an
              intangible, digital asset controlled by you. These assets exist only by virtue of the ownership record
              maintained on the Steem blockchain. The Service does not store, send, or receive STEEM, SBD and SP. Any
              transfer of title that might occur in any STEEM, SBD and SP occurs on the Steem blockchain and not within
              the Services. We do not guarantee that the Service can affect the transfer of title or right in any STEEM,
              SBD and SP.
            </p>
            <p>
              <strong>(Relationship)</strong> Nothing in this Agreement is intended to nor shall create any partnership,
              joint venture, agency, consultancy, or trusteeship, between you and us.
            </p>
            <p>
              <strong>(Accuracy of Information)</strong> You represent and warrant that any information you provide via
              the Service is accurate and complete. You accept and acknowledge that we are not responsible for any
              errors or omissions that you make in connection with any Steem blockchain transaction initiated via the
              Services, for instance, if you mistype and account name or otherwise provide incorrect information. We
              strongly encourage you to review your transaction details carefully before completing them via the
              Service.
            </p>
            <p>
              <strong>(No Cancellations or Modifications)</strong> Once transaction details have been submitted to the
              Steem blockchain via the Services, The Services cannot assist you to cancel or otherwise modify your
              transaction details. We have no control over the Steem blockchain and do not have the ability to
              facilitate any cancellation or modification requests.
            </p>
            <h2>User Conduct</h2>
            <p>
              When accessing or using the Service, you agree that you will not commit any unlawful act, and that you are
              solely responsible for your conduct while using our Service. Without limiting the generality of the
              foregoing, you agree that you will not:
            </p>
            <ol>
              <li>
                Use our Service in any manner that could interfere with, disrupt, negatively affect or inhibit other
                users from fully enjoying our Service, or that could damage, disable, overburden or impair the
                functioning of our Service or the Steem network in any manner;
              </li>
              <li>
                Use our Service to pay for, support or otherwise engage in any illegal activities, including, but not
                limited to illegal gambling, fraud, money-laundering, or terrorist activities;
              </li>

              <li>
                {" "}
                Use any robot, spider, crawler, scraper or other automated means or interface not provided by us to
                access our Service or to extract data;
              </li>
              <li> Use or attempt to use another user’s wallet without authorization;</li>
              <li>
                {" "}
                Attempt to circumvent any content filtering techniques we employ, or attempt to access any service or
                area of our Service that you are not authorized to access;
              </li>
              <li> Introduce to the Service any virus, Trojan, worms, logic bombs or other harmful material;</li>
              <li>
                {" "}
                Develop any third-party applications that interact with our Service without our prior written consent;
              </li>
              <li> Provide false, inaccurate, or misleading information; or</li>
              <li>
                {" "}
                Encourage or induce any third-party to engage in any of the activities prohibited under this section;
              </li>
              <li>
                {" "}
                Reverse engineer any aspect of Upvu or do anything that might discover source code or bypass or
                circumvent measures employed to prevent or limit access to any Upvu Content, area or code of Upvu.
              </li>
            </ol>

            <h2>Indemnity</h2>
            <p>
              All the things you do and all the information you submit or post to the Service remain your
              responsibility, Indemnity is basically a way of saying that you will not hold us legally liable for any of
              your content or actions that infringe the law or the rights of a third-party or person in any way.
            </p>
            <p>
              Specifically, you agree to hold us, our affiliates, officers, directors, employees, agents, and
              third-party service providers harmless from and defend them against any claims, costs, damages, losses,
              expenses, and any other liabilities, including attorneys’ fees and costs, arising out of or related to
              your access to or use of the Service, your violation of this user agreement, and/or your violation of the
              rights of any third-party or person.
            </p>

            <h2>Modifications to the Service</h2>
            <p>
              We reserve the right to modify or discontinue, temporarily or permanently, the Service, or any features or
              portions of the Service, without prior notice. You agree that we will not be liable for any modification,
              suspension, or discontinuance of the Service.
            </p>

            <h2>Termination</h2>
            <p>
              We reserve the right, without notice and in our sole discretion, to terminate your license to access and
              use of the Service, which includes this site, and to block or prevent your future access to, and use of,
              the Service that we provide.
            </p>

            <h2>Severability</h2>
            <p>
              If any term, clause or provision of these Terms is deemed to be unlawful, void or for any reason
              unenforceable, then that term, clause or provision shall be deemed severable from these Terms and shall
              not affect the validity and enforceability of any remaining provisions.
            </p>
          </div>
        </div>
      </>
    );
  }
}
export default connect(pageMapStateToProps, pageMapDispatchToProps)(TosPage);
