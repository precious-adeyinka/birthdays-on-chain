import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre, { ethers } from "hardhat";
import { parseEther } from "ethers";

import bocTokenProxyModule from "../ignition/modules/BOCTokenProxyModule";
import bocDiamondProxyModule from "../ignition/modules/BOCDiamondProxy";
import { getSelectors, FacetCutAction } from "../utils/test";

describe("BOC Subscribe Facet", function () {
  async function deployDiamondProxyAndSubscribeFacet() {
    const [deployer, chad, john] = await hre.ethers.getSigners();

    // deploy the token contract first
    const { BOCToken } = await hre.ignition.deploy(bocTokenProxyModule);
    const { bocDiamondProxy, subscribeFacet, usersFacet, bocInit } =
      await hre.ignition.deploy(bocDiamondProxyModule);

    let selectorUsersFacet = getSelectors(usersFacet);
    let selectorSubscribeFacet = getSelectors(subscribeFacet);
    let cuts = [
      {
        target: await subscribeFacet.getAddress(),
        action: FacetCutAction.Add,
        selectors: selectorSubscribeFacet,
      },
      {
        target: await usersFacet.getAddress(),
        action: FacetCutAction.Add,
        selectors: selectorUsersFacet,
      },
    ];

    const bocTokenAddress = await BOCToken.getAddress();
    const calldata = bocInit.interface.encodeFunctionData("init", [
      deployer.address,
      bocTokenAddress,
      3,
    ]);
    const target = await bocInit.getAddress();

    await bocDiamondProxy.diamondCut(cuts, target, calldata);

    const bocUsersProxy = await ethers.getContractAt(
      "BOCUsersFacet",
      await bocDiamondProxy.getAddress()
    );

    const bocProxy = await ethers.getContractAt(
      "BOCSubscribeFacet",
      await bocDiamondProxy.getAddress()
    );

    return {
      deployer,
      chad,
      john,
      bocProxy,
      bocDiamondProxy,
      bocUsersProxy,
      BOCToken,
    };
  }

  describe("Subscription Operations", function () {
    describe("Subscribing", () => {
      describe("With Ether", () => {
        describe("Success", () => {
          it("Should subscribe user", async function () {
            const { bocProxy, bocUsersProxy, chad, deployer } =
              await loadFixture(deployDiamondProxyAndSubscribeFacet);

            await bocUsersProxy
              .connect(chad)
              .createUser("John Doe", "doe", "male", 0n, "photo");

            await bocProxy.connect(chad).subscribeWithEther({
              value: parseEther("1"),
            });
            const user = await bocUsersProxy
              .connect(chad)
              .getUser(chad.address);
            const subscriptions = await bocUsersProxy
              .connect(chad)
              .getUserSubscription(chad.address);
            const balance = await bocUsersProxy
              .connect(deployer)
              .checkBalance();
            const subscribedUsers = await bocProxy
              .connect(deployer)
              .getSubscribedUsers();
            expect(subscribedUsers.length).to.be.eq(1);
            expect(user.hasSubscription).to.be.eq(true);
            expect(subscriptions.amount).to.be.eq(parseEther("1"));
            expect(balance).to.be.eq(parseEther("1"));
          });

          it("Should emit UserSubscribed event", async function () {
            const { bocProxy, bocUsersProxy, chad, deployer } =
              await loadFixture(deployDiamondProxyAndSubscribeFacet);

            await bocUsersProxy
              .connect(chad)
              .createUser("John Doe", "doe", "male", 0n, "photo");

            await expect(
              bocProxy.connect(chad).subscribeWithEther({
                value: parseEther("1"),
              })
            )
              .to.emit(bocProxy, "UserSubscribed")
              .withArgs(chad.address, anyValue);
          });
        });

        describe("Failure", () => {
          it("Should fail when insufficient Ether is sent", async function () {
            const { bocProxy, bocUsersProxy, chad, deployer } =
              await loadFixture(deployDiamondProxyAndSubscribeFacet);

            await bocUsersProxy
              .connect(chad)
              .createUser("John Doe", "doe", "male", 0n, "photo");

            await expect(
              bocProxy.connect(chad).subscribeWithEther({
                value: parseEther("0"),
              })
            ).to.be.revertedWith("BOC: Not enough Ether!");
          });

          it("Should fail for double subscription", async function () {
            const { bocProxy, bocUsersProxy, chad } = await loadFixture(
              deployDiamondProxyAndSubscribeFacet
            );

            await bocUsersProxy
              .connect(chad)
              .createUser("John Doe", "doe", "male", 0n, "photo");

            await bocProxy.connect(chad).subscribeWithEther({
              value: parseEther("1"),
            });

            await expect(
              bocProxy.connect(chad).subscribeWithEther({
                value: parseEther("1"),
              })
            ).to.be.revertedWith("BOC: You are already subscribed!");
          });

          it("Should fail when no user exist", async function () {
            const { bocProxy, chad } = await loadFixture(
              deployDiamondProxyAndSubscribeFacet
            );

            await expect(
              bocProxy.connect(chad).subscribeWithEther({
                value: parseEther("1"),
              })
            ).to.be.revertedWith("BOC: User not found!");
          });
        });
      });

      describe("With Token", () => {
        describe("Success", () => {
          it("Should subscribe user", async function () {
            const {
              bocProxy,
              bocUsersProxy,
              deployer,
              BOCToken,
              bocDiamondProxy,
            } = await loadFixture(deployDiamondProxyAndSubscribeFacet);

            // create the user
            await bocUsersProxy
              .connect(deployer)
              .createUser("John Doe", "doe", "male", 0n, "photo");

            // approve token
            await BOCToken.approve(
              await bocDiamondProxy.getAddress(),
              parseEther("1"),
              {
                from: deployer.address,
              }
            );

            // subscribe
            await bocProxy.connect(deployer).subscribeWithToken(1);

            const user = await bocUsersProxy
              .connect(deployer)
              .getUser(deployer.address);

            const subscriptions = await bocUsersProxy
              .connect(deployer)
              .getUserSubscription(deployer.address);

            const balance = await bocUsersProxy
              .connect(deployer)
              .checkTokenBalance();

            const subscribedUsers = await bocProxy
              .connect(deployer)
              .getSubscribedUsers();

            expect(subscribedUsers.length).to.be.eq(1n);
            expect(user.hasSubscription).to.be.eq(true);
            expect(subscriptions.amount).to.be.eq(1n);
            expect(balance).to.be.eq(1n);
          });

          it("Should emit UserSubscribed event", async function () {
            const {
              bocProxy,
              bocUsersProxy,
              deployer,
              BOCToken,
              bocDiamondProxy,
            } = await loadFixture(deployDiamondProxyAndSubscribeFacet);

            // create the user
            await bocUsersProxy
              .connect(deployer)
              .createUser("John Doe", "doe", "male", 0n, "photo");

            // approve token
            await BOCToken.approve(
              await bocDiamondProxy.getAddress(),
              parseEther("1"),
              {
                from: deployer.address,
              }
            );

            // subscribe
            await expect(bocProxy.connect(deployer).subscribeWithToken(1))
              .to.emit(bocProxy, "UserSubscribed")
              .withArgs(deployer.address, anyValue);
          });
        });

        describe("Failure", () => {
          it("Should fail when insufficient BOC is sent", async function () {
            const {
              bocProxy,
              bocUsersProxy,
              deployer,
              BOCToken,
              bocDiamondProxy,
            } = await loadFixture(deployDiamondProxyAndSubscribeFacet);

            // create the user
            await bocUsersProxy
              .connect(deployer)
              .createUser("John Doe", "doe", "male", 0n, "photo");

            // check allowance
            const allowance = await BOCToken.allowance(
              deployer.address,
              await bocDiamondProxy.getAddress()
            );
            expect(allowance).to.be.eq(0n);

            // approve token
            await BOCToken.approve(
              await bocDiamondProxy.getAddress(),
              parseEther("1"),
              {
                from: deployer.address,
              }
            );

            // check allowance
            const finalAllowance = await BOCToken.allowance(
              deployer.address,
              await bocDiamondProxy.getAddress()
            );
            expect(finalAllowance).to.not.be.eq(0n);

            await expect(
              bocProxy.connect(deployer).subscribeWithToken(0)
            ).to.be.revertedWith("BOC: Insufficient BOC Balance!");
          });

          it("Should fail for double subscription", async function () {
            const {
              bocProxy,
              bocUsersProxy,
              deployer,
              BOCToken,
              bocDiamondProxy,
            } = await loadFixture(deployDiamondProxyAndSubscribeFacet);

            // create the user
            await bocUsersProxy
              .connect(deployer)
              .createUser("John Doe", "doe", "male", 0n, "photo");

            // approve token
            await BOCToken.approve(
              await bocDiamondProxy.getAddress(),
              parseEther("1"),
              {
                from: deployer.address,
              }
            );

            // subscribe
            await bocProxy.connect(deployer).subscribeWithToken(1);

            await expect(
              bocProxy.connect(deployer).subscribeWithToken(1)
            ).to.be.revertedWith("BOC: You are already subscribed!");
          });

          it("Should fail when no user exist", async function () {
            const { bocProxy, chad } = await loadFixture(
              deployDiamondProxyAndSubscribeFacet
            );

            await expect(
              bocProxy.connect(chad).subscribeWithToken(1)
            ).to.be.revertedWith("BOC: User not found!");
          });
        });
      });
    });
  });
});
