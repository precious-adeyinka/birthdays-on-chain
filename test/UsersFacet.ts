import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre, { ethers } from "hardhat";
import { Interface } from "ethers";

import bocTokenProxyModule from "../ignition/modules/BOCTokenProxyModule";
import bocDiamondProxyModule from "../ignition/modules/BOCDiamondProxy";
import { getSelectors, FacetCutAction } from "../utils/test";

describe("BOC Users Facet", function () {
  async function deployDiamondProxyAndUsersFacet() {
    // Contracts are deployed using the first signer/account by default
    const [deployer, chad, john] = await hre.ethers.getSigners();

    // deploy the token contract first
    const { BOCToken } = await hre.ignition.deploy(bocTokenProxyModule);
    const { bocDiamondProxy, usersFacet, bocInit } = await hre.ignition.deploy(
      bocDiamondProxyModule
    );

    let selectorUsersFacet = getSelectors(usersFacet);
    let cuts = [
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

    const bocProxy = await ethers.getContractAt(
      "BOCUsersFacet",
      await bocDiamondProxy.getAddress()
    );

    return { deployer, chad, john, bocProxy, bocDiamondProxy, BOCToken };
  }

  describe("Owner Operations", () => {
    it("Should not withdraw Ether", async () => {
      const { bocProxy, chad, deployer } = await loadFixture(
        deployDiamondProxyAndUsersFacet
      );
      await expect(
        bocProxy.connect(chad).bocWithdrawEther()
      ).to.be.revertedWith("BOC: Owner only Operation!");
    });

    it("Should withdraw Ether", async () => {
      const { bocProxy, deployer } = await loadFixture(
        deployDiamondProxyAndUsersFacet
      );
      await expect(
        bocProxy.connect(deployer).bocWithdrawEther()
      ).to.not.be.revertedWith("BOC: Owner only Operation!");
      await expect(
        bocProxy.connect(deployer).bocWithdrawEther()
      ).to.be.revertedWith("BOC: Insufficient Ether Balance!");
    });
  });

  describe("User Operations", function () {
    describe("Creating", () => {
      it("Should create user", async function () {
        const { bocProxy, chad } = await loadFixture(
          deployDiamondProxyAndUsersFacet
        );
        await bocProxy
          .connect(chad)
          .createUser("John Doe", "doe", "male", 0n, "photo");
        const user = await bocProxy.connect(chad).getUser(chad.address);
        expect(user.isActive).to.be.equal(true);
      });

      it("Should emit UserCreated event", async function () {
        const { bocProxy, chad } = await loadFixture(
          deployDiamondProxyAndUsersFacet
        );
        await expect(
          bocProxy
            .connect(chad)
            .createUser("John Do", "doe", "male", 0n, "photo")
        )
          .to.emit(bocProxy, "UserCreated")
          .withArgs(chad.address, anyValue);
      });

      it("Should fail when user already exist", async function () {
        const { bocProxy, chad } = await loadFixture(
          deployDiamondProxyAndUsersFacet
        );
        await bocProxy
          .connect(chad)
          .createUser("John Do", "doe", "male", 0n, "photo");

        await expect(
          bocProxy
            .connect(chad)
            .createUser("John Do", "doe", "male", 0n, "photo")
        ).to.be.revertedWith("BOC: User already exist!");
      });
    });

    describe("Updating", () => {
      it("Should update user", async () => {
        const { bocProxy, chad } = await loadFixture(
          deployDiamondProxyAndUsersFacet
        );
        // create the user first
        await bocProxy
          .connect(chad)
          .createUser("John Doe", "doe", "male", 0n, "photo");
        // update the user
        await bocProxy
          .connect(chad)
          .updateUser("John Chad", "chad", 0n, "photo");
        const user = await bocProxy.connect(chad).getUser(chad.address);
        expect(user.nickname).to.be.equal("chad");
      });

      it("Should emit UpdateUser event", async () => {
        const { bocProxy, chad } = await loadFixture(
          deployDiamondProxyAndUsersFacet
        );
        // create the user first
        await bocProxy
          .connect(chad)
          .createUser("John Doe", "doe", "male", 0n, "photo");
        await expect(
          bocProxy.connect(chad).updateUser("John Chad", "chad", 0n, "photo")
        )
          .to.emit(bocProxy, "UpdateUser")
          .withArgs(chad.address, anyValue);
      });

      it("Should fail when user does not exist", async () => {
        const { bocProxy, john } = await loadFixture(
          deployDiamondProxyAndUsersFacet
        );
        await expect(
          bocProxy.connect(john).updateUser("John Chad", "chad", 0n, "photo")
        ).to.be.revertedWith("BOC: User not found!");
      });
    });

    describe("Fetching data", () => {
      describe("User", () => {
        it("Should get user", async () => {
          const { bocProxy, chad } = await loadFixture(
            deployDiamondProxyAndUsersFacet
          );
          await bocProxy
            .connect(chad)
            .createUser("John Doe", "doe", "male", 0n, "photo");
          const user = await bocProxy.connect(chad).getUser(chad.address);
          expect(user.isActive).to.be.equal(true);
        });

        it("Should fail if user does not exist", async () => {
          const { bocProxy, chad } = await loadFixture(
            deployDiamondProxyAndUsersFacet
          );
          await expect(
            bocProxy.connect(chad).getUser(chad.address)
          ).to.be.revertedWith("BOC: User not found!");
        });
      });

      describe("Messages", () => {
        it("Should get messages", async () => {
          const { bocProxy, chad } = await loadFixture(
            deployDiamondProxyAndUsersFacet
          );
          await bocProxy
            .connect(chad)
            .createUser("John Doe", "doe", "male", 0n, "photo");
          const messages = await bocProxy
            .connect(chad)
            .getUserMessages(chad.address);
          expect(messages).to.be.an("array").that.is.empty;
          expect(messages.length).to.equal(0);
        });

        it("Should fail if user does not exist", async () => {
          const { bocProxy, chad } = await loadFixture(
            deployDiamondProxyAndUsersFacet
          );
          await expect(
            bocProxy.connect(chad).getUserMessages(chad.address)
          ).to.be.revertedWith("BOC: User not found!");
        });
      });

      describe("Notifications", () => {
        it("Should get notifications", async () => {
          const { bocProxy, chad } = await loadFixture(
            deployDiamondProxyAndUsersFacet
          );
          await bocProxy
            .connect(chad)
            .createUser("John Doe", "doe", "male", 0n, "photo");
          const notifications = await bocProxy
            .connect(chad)
            .getUserNotifications(chad.address);
          expect(notifications).to.be.an("array").that.is.empty;
          expect(notifications.length).to.equal(0);
        });

        it("Should fail if user does not exist", async () => {
          const { bocProxy, chad } = await loadFixture(
            deployDiamondProxyAndUsersFacet
          );
          await expect(
            bocProxy.connect(chad).getUserNotifications(chad.address)
          ).to.be.revertedWith("BOC: User not found!");
        });
      });

      describe("Gifts", () => {
        it("Should get gifts", async () => {
          const { bocProxy, chad } = await loadFixture(
            deployDiamondProxyAndUsersFacet
          );
          await bocProxy
            .connect(chad)
            .createUser("John Doe", "doe", "male", 0n, "photo");
          const gifts = await bocProxy.connect(chad).getUserGifts(chad.address);
          expect(gifts).to.be.an("array").that.is.empty;
          expect(gifts.length).to.equal(0);
        });

        it("Should fail if user does not exist", async () => {
          const { bocProxy, chad } = await loadFixture(
            deployDiamondProxyAndUsersFacet
          );
          await expect(
            bocProxy.connect(chad).getUserGifts(chad.address)
          ).to.be.revertedWith("BOC: User not found!");
        });
      });

      describe("Birthdays", () => {
        it("Should get birthdays", async () => {
          const { bocProxy, chad } = await loadFixture(
            deployDiamondProxyAndUsersFacet
          );
          await bocProxy
            .connect(chad)
            .createUser("John Doe", "doe", "male", 0n, "photo");
          const birthday = await bocProxy
            .connect(chad)
            .getUserBirthdays(chad.address);
          expect(birthday.timeline).to.be.an("array").that.is.empty;
          expect(birthday.id).to.equal(0n);
          expect(birthday.createdAt).to.equal(0n);
        });

        it("Should fail if user does not exist", async () => {
          const { bocProxy, chad } = await loadFixture(
            deployDiamondProxyAndUsersFacet
          );
          await expect(
            bocProxy.connect(chad).getUserBirthdays(chad.address)
          ).to.be.revertedWith("BOC: User not found!");
        });
      });

      describe("Goals", () => {
        it("Should get goals", async () => {
          const { bocProxy, chad } = await loadFixture(
            deployDiamondProxyAndUsersFacet
          );
          await bocProxy
            .connect(chad)
            .createUser("John Doe", "doe", "male", 0n, "photo");
          await expect(
            bocProxy.connect(chad).getUserGoal(chad.address)
          ).to.be.revertedWith("BOC: No Birthday found!");
        });

        it("Should fail if user does not exist", async () => {
          const { bocProxy, chad } = await loadFixture(
            deployDiamondProxyAndUsersFacet
          );
          await expect(
            bocProxy.connect(chad).getUserGoal(chad.address)
          ).to.be.revertedWith("BOC: User not found!");
        });
      });

      describe("Subscription", () => {
        it("Should get subscriptions", async () => {
          const { bocProxy, chad } = await loadFixture(
            deployDiamondProxyAndUsersFacet
          );
          await bocProxy
            .connect(chad)
            .createUser("John Doe", "doe", "male", 0n, "photo");
          const subscriptions = await bocProxy
            .connect(chad)
            .getUserSubscription(chad.address);
          const user = await bocProxy.connect(chad).getUser(chad.address);
          expect(user.hasSubscription).to.be.eq(false);
          expect(subscriptions.id).to.be.eq(0n);
        });

        it("Should fail if user does not exist", async () => {
          const { bocProxy, chad } = await loadFixture(
            deployDiamondProxyAndUsersFacet
          );
          await expect(
            bocProxy.connect(chad).getUserSubscription(chad.address)
          ).to.be.revertedWith("BOC: User not found!");
        });
      });
    });
  });
});
