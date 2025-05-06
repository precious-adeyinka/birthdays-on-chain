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

describe("BOC Platform Facet", function () {
  async function deployDiamondProxyAndSubscribeFacet() {
    const [deployer, chad, john] = await hre.ethers.getSigners();

    // deploy the token contract first
    const { BOCToken } = await hre.ignition.deploy(bocTokenProxyModule);
    const { bocDiamondProxy, platformFacet, usersFacet, bocInit } =
      await hre.ignition.deploy(bocDiamondProxyModule);

    let selectorUsersFacet = getSelectors(usersFacet);
    let selectorPlatformFacet = getSelectors(platformFacet);
    let cuts = [
      {
        target: await platformFacet.getAddress(),
        action: FacetCutAction.Add,
        selectors: selectorPlatformFacet,
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
      "BOCPlatformFacet",
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

  describe("Platform Operations", function () {
    describe("Users Ops", () => {
      it("Should get complete user", async function () {
        const { bocProxy, bocUsersProxy, chad } = await loadFixture(
          deployDiamondProxyAndSubscribeFacet
        );

        await bocUsersProxy
          .connect(chad)
          .createUser("John Doe", "doe", "male", 0n, "photo");

        const completeUser = await bocProxy
          .connect(chad)
          .getCompleteUser(chad.address);
        expect(completeUser.user.uid).to.be.eq(chad.address);
        expect(completeUser.birthdays.createdAt).to.be.eq(0n);
        expect(completeUser.messages).to.be.an.empty("array");
        expect(completeUser.gifts).to.be.an.empty("array");
        expect(completeUser.notifications).to.be.an.empty("array");
        expect(completeUser.goal.createdAt).to.be.eq(0n);
        expect(completeUser.subscriptions.createdAt).to.be.eq(0n);
        expect(completeUser.balance).to.be.eq(0n);
      });
    });
  });
});
