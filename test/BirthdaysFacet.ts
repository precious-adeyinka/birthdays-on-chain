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

describe("BOC Birthdays Facet", function () {
  async function deployDiamondProxyAndBirthdaysFacet() {
    const [deployer, chad, john] = await hre.ethers.getSigners();

    // deploy the token contract first
    const { BOCToken } = await hre.ignition.deploy(bocTokenProxyModule);
    const { bocDiamondProxy, birthdaysFacet, usersFacet, bocInit } =
      await hre.ignition.deploy(bocDiamondProxyModule);

    let selectorUsersFacet = getSelectors(usersFacet);
    let selectorBirthdaysFacet = getSelectors(birthdaysFacet);
    let cuts = [
      {
        target: await birthdaysFacet.getAddress(),
        action: FacetCutAction.Add,
        selectors: selectorBirthdaysFacet,
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
      "BOCBirthdaysFacet",
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

  describe("Birthday Operations", function () {
    describe("Creating", () => {
      describe("Birthday", () => {
        it("Should create birthday", async function () {
          const { bocProxy, bocUsersProxy, chad } = await loadFixture(
            deployDiamondProxyAndBirthdaysFacet
          );

          const dob = new Date("Jan 1, 2000").getTime();

          await bocUsersProxy
            .connect(chad)
            .createUser("John Doe", "doe", "male", 0n, "photo");

          await bocProxy.connect(chad).createBirthday(dob);

          const birthday = await bocUsersProxy
            .connect(chad)
            .getUserBirthdays(chad.address);

          expect(birthday.when).to.be.equal(dob);
        });

        it("Should create birthday timeline", async function () {
          const { bocProxy, bocUsersProxy, chad } = await loadFixture(
            deployDiamondProxyAndBirthdaysFacet
          );
          const dob = new Date("Jan 1, 2000").getTime();
          await bocUsersProxy
            .connect(chad)
            .createUser("John Doe", "doe", "male", 0n, "photo");
          await bocProxy.connect(chad).createBirthday(dob);
          const birthday = await bocUsersProxy
            .connect(chad)
            .getUserBirthdays(chad.address);
          await bocProxy.connect(chad).createTimeline(0);
          const birthdayTimelines = await (
            await bocUsersProxy.connect(chad).getUserBirthdays(chad.address)
          ).timeline;
          expect(birthday.when).to.be.equal(dob);
          expect(birthdayTimelines.length).to.be.equal(2);
        });

        it("Should create birthday and goal", async function () {
          const { bocProxy, bocUsersProxy, chad } = await loadFixture(
            deployDiamondProxyAndBirthdaysFacet
          );
          const dob = new Date("Jan 1, 2000").getTime();
          const goal = "I want a job";
          const targetAmount = parseEther("100");
          await bocUsersProxy
            .connect(chad)
            .createUser("John Doe", "doe", "male", 0n, "photo");
          await bocProxy
            .connect(chad)
            .createBirthdayAndGoal(dob, goal, targetAmount);
          const birthday = await bocUsersProxy
            .connect(chad)
            .getUserBirthdays(chad.address);
          expect(birthday.when).to.be.equal(dob);
          expect(birthday.goal.description).to.be.equal(goal);
          expect(birthday.goal.targetAmount).to.be.equal(targetAmount);
        });

        it("Should emit BirthdayCreated event", async function () {
          const { bocProxy, bocUsersProxy, chad } = await loadFixture(
            deployDiamondProxyAndBirthdaysFacet
          );
          const dob = new Date("Jan 1, 2000").getTime();
          await bocUsersProxy
            .connect(chad)
            .createUser("John Doe", "doe", "male", 0n, "photo");
          await expect(bocProxy.connect(chad).createBirthday(dob))
            .to.emit(bocProxy, "BirthdayCreated")
            .withArgs(chad.address, 0n, dob);
        });

        it("Should fail when user does not exist", async function () {
          const { bocProxy, chad } = await loadFixture(
            deployDiamondProxyAndBirthdaysFacet
          );
          const dob = new Date("Jan 1, 2000").getTime();
          await expect(
            bocProxy.connect(chad).createBirthday(dob)
          ).to.be.revertedWith("BOC: User not found!");
        });
      });

      describe("Goal", () => {
        it("Should create goal", async function () {
          const { bocProxy, bocUsersProxy, chad } = await loadFixture(
            deployDiamondProxyAndBirthdaysFacet
          );
          const dob = new Date("Jan 1, 2000").getTime();
          await bocUsersProxy
            .connect(chad)
            .createUser("John Doe", "doe", "male", 0n, "photo");
          await bocProxy.connect(chad).createBirthday(dob);
          await bocProxy
            .connect(chad)
            .createGoal(0, "I want a PS5", parseEther("1"));
          const goal = await bocUsersProxy
            .connect(chad)
            .getUserGoal(chad.address);
          expect(goal.amountRaised).to.be.equal(0n);
          expect(goal.description).to.be.equal("I want a PS5");
          expect(goal.targetAmount).to.be.equal(parseEther("1"));
        });

        it("Should update goal", async function () {
          const { bocProxy, bocUsersProxy, chad } = await loadFixture(
            deployDiamondProxyAndBirthdaysFacet
          );
          const dob = new Date("Jan 1, 2000").getTime();
          await bocUsersProxy
            .connect(chad)
            .createUser("John Doe", "doe", "male", 0n, "photo");
          await bocProxy.connect(chad).createBirthday(dob);
          await bocProxy
            .connect(chad)
            .createGoal(0, "I want a PS5", parseEther("0"));
          const goal = await bocUsersProxy
            .connect(chad)
            .getUserGoal(chad.address);
          await bocProxy
            .connect(chad)
            .updateGoal(0, "I want a Game Console", parseEther("2"));
          const finalGoal = await bocUsersProxy
            .connect(chad)
            .getUserGoal(chad.address);
          expect(goal.amountRaised).to.be.equal(0n);
          expect(goal.description).to.be.equal("I want a PS5");
          expect(goal.targetAmount).to.be.equal(parseEther("0"));
          expect(finalGoal.amountRaised).to.be.equal(0n);
          expect(finalGoal.description).to.be.equal("I want a Game Console");
          expect(finalGoal.targetAmount).to.be.equal(parseEther("2"));
        });

        it("Should emit GoalCreated event", async function () {
          const { bocProxy, bocUsersProxy, chad } = await loadFixture(
            deployDiamondProxyAndBirthdaysFacet
          );
          const dob = new Date("Jan 1, 2000").getTime();
          await bocUsersProxy
            .connect(chad)
            .createUser("John Doe", "doe", "male", 0n, "photo");
          await bocProxy.connect(chad).createBirthday(dob);
          await expect(
            bocProxy
              .connect(chad)
              .createGoal(0, "I want a PS5", parseEther("1"))
          )
            .to.emit(bocProxy, "GoalCreated")
            .withArgs(chad.address, 0n, anyValue);
        });

        it("Should fail when birthday does not exist", async function () {
          const { bocProxy, bocUsersProxy, chad } = await loadFixture(
            deployDiamondProxyAndBirthdaysFacet
          );
          const dob = new Date("Jan 1, 2000").getTime();
          await bocUsersProxy
            .connect(chad)
            .createUser("John Doe", "doe", "male", 0n, "photo");
          await expect(
            bocProxy
              .connect(chad)
              .createGoal(0, "I want a PS5", parseEther("1"))
          ).to.be.revertedWith("BOC: No birthdays found!");
        });

        it("Should fail when birthday id is invalid", async function () {
          const { bocProxy, bocUsersProxy, chad } = await loadFixture(
            deployDiamondProxyAndBirthdaysFacet
          );
          const dob = new Date("Jan 1, 2000").getTime();
          await bocUsersProxy
            .connect(chad)
            .createUser("John Doe", "doe", "male", 0n, "photo");
          await bocProxy.connect(chad).createBirthday(dob);
          await expect(
            bocProxy
              .connect(chad)
              .createGoal(1, "I want a PS5", parseEther("1"))
          ).to.be.revertedWith("BOC: Invalid Birthday ID!");
        });

        it("Should fail to update goal in progress", async function () {
          const { bocProxy, bocUsersProxy, chad } = await loadFixture(
            deployDiamondProxyAndBirthdaysFacet
          );
          const dob = new Date("Jan 1, 2000").getTime();
          await bocUsersProxy
            .connect(chad)
            .createUser("John Doe", "doe", "male", 0n, "photo");
          await bocProxy.connect(chad).createBirthday(dob);
          await bocProxy
            .connect(chad)
            .createGoal(0, "I want a PS5", parseEther("1"));
          await expect(
            bocProxy
              .connect(chad)
              .updateGoal(0, "I want a Game Console", parseEther("2"))
          ).to.be.revertedWith("BOC: Goal in progress, wait until finished!");
        });

        it("Should fail when user does not exist", async function () {
          const { bocProxy, chad } = await loadFixture(
            deployDiamondProxyAndBirthdaysFacet
          );
          const dob = new Date("Jan 1, 2000").getTime();
          await expect(
            bocProxy
              .connect(chad)
              .createGoal(0, "I want a PS5", parseEther("1"))
          ).to.be.revertedWith("BOC: User not found!");
        });
      });
    });

    describe("Withdrawing", () => {
      describe("Ether", () => {
        it("Should not withdraw Ether for insufficient balance", async () => {
          const { bocProxy, bocUsersProxy, chad } = await loadFixture(
            deployDiamondProxyAndBirthdaysFacet
          );
          await bocUsersProxy
            .connect(chad)
            .createUser("John Doe", "doe", "male", 0n, "photo");
          await expect(
            bocProxy.connect(chad).userWithdrawEther()
          ).to.be.revertedWith("BOC: Insufficient funds!");
        });

        it("Should fail when user does not exist", async () => {
          const { bocProxy, chad } = await loadFixture(
            deployDiamondProxyAndBirthdaysFacet
          );
          await expect(
            bocProxy.connect(chad).userWithdrawEther()
          ).to.be.revertedWith("BOC: User not found!");
        });
      });

      describe("Token", () => {
        it("Should not withdraw BOC Token for insufficient balance", async () => {
          const { bocProxy, bocUsersProxy, chad } = await loadFixture(
            deployDiamondProxyAndBirthdaysFacet
          );

          await bocUsersProxy
            .connect(chad)
            .createUser("John Doe", "doe", "male", 0n, "photo");

          await expect(
            bocProxy.connect(chad).userWithdrawToken()
          ).to.be.revertedWith("BOC: Insufficient BOC funds!");
        });

        it("Should fail when user does not exist", async () => {
          const { bocProxy, chad } = await loadFixture(
            deployDiamondProxyAndBirthdaysFacet
          );
          await expect(
            bocProxy.connect(chad).userWithdrawToken()
          ).to.be.revertedWith("BOC: User not found!");
        });
      });
    });
  });
});
