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

describe("BOC Activities Facet", function () {
  async function deployDiamondProxyAndActiveFacet() {
    const [deployer, chad, john] = await hre.ethers.getSigners();

    // deploy the token contract first
    const { BOCToken } = await hre.ignition.deploy(bocTokenProxyModule);
    const {
      bocDiamondProxy,
      activitiesFacet,
      usersFacet,
      birthdaysFacet,
      bocInit,
    } = await hre.ignition.deploy(bocDiamondProxyModule);

    let selectorUsersFacet = getSelectors(usersFacet);
    let selectorActivitiesFacet = getSelectors(activitiesFacet);
    let selectorBirthdaysFacet = getSelectors(birthdaysFacet);
    let cuts = [
      {
        target: await activitiesFacet.getAddress(),
        action: FacetCutAction.Add,
        selectors: selectorActivitiesFacet,
      },
      {
        target: await usersFacet.getAddress(),
        action: FacetCutAction.Add,
        selectors: selectorUsersFacet,
      },
      {
        target: await birthdaysFacet.getAddress(),
        action: FacetCutAction.Add,
        selectors: selectorBirthdaysFacet,
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

    const bocBirthdaysProxy = await ethers.getContractAt(
      "BOCBirthdaysFacet",
      await bocDiamondProxy.getAddress()
    );

    const bocProxy = await ethers.getContractAt(
      "BOCActivitiesFacet",
      await bocDiamondProxy.getAddress()
    );

    return {
      deployer,
      chad,
      john,
      bocProxy,
      bocDiamondProxy,
      bocUsersProxy,
      bocBirthdaysProxy,
      BOCToken,
    };
  }

  describe("Activities Operations", function () {
    describe("Sending Messages", () => {
      describe("Success", () => {
        it("Should allow sending a message", async () => {
          const { bocProxy, bocUsersProxy, chad, john } = await loadFixture(
            deployDiamondProxyAndActiveFacet
          );
          await bocUsersProxy
            .connect(chad)
            .createUser("John Doe", "doe", "male", 0n, "photo");
          const msg = "I miss you bro!";
          await bocProxy.connect(john).sendMessage(chad.address, msg);
          const messages = await bocUsersProxy
            .connect(chad)
            .getUserMessages(chad.address);
          const notifications = await bocUsersProxy
            .connect(chad)
            .getUserNotifications(chad.address);
          await expect(messages.length).to.be.eq(1);
          await expect(messages[0].id).to.be.eq(1n);
          await expect(messages[0].sender).to.be.eq(john.address);
          await expect(messages[0].recipient).to.be.eq(chad.address);
          await expect(messages[0].message).to.be.eq(msg);
          await expect(notifications.length).to.be.eq(1);
          await expect(notifications[0].id).to.be.eq(1n);
          await expect(notifications[0].sender).to.be.eq(john.address);
          await expect(notifications[0].receiver).to.be.eq(chad.address);
          await expect(notifications[0].notificationTypeId).to.be.eq(1n);
          await expect(notifications[0].notificationType).to.be.eq(1n);
        });

        it("Should emit MessageCreated event", async () => {
          const { bocProxy, bocUsersProxy, chad, john } = await loadFixture(
            deployDiamondProxyAndActiveFacet
          );
          await bocUsersProxy
            .connect(chad)
            .createUser("John Doe", "doe", "male", 0n, "photo");
          const msg = "I miss you bro!";
          await expect(bocProxy.connect(john).sendMessage(chad.address, msg))
            .to.emit(bocProxy, "MessageCreated")
            .withArgs(chad.address, john.address, 1n, anyValue);
        });

        it("Should emit NotificationCreated event", async () => {
          const { bocProxy, bocUsersProxy, chad, john } = await loadFixture(
            deployDiamondProxyAndActiveFacet
          );
          await bocUsersProxy
            .connect(chad)
            .createUser("John Doe", "doe", "male", 0n, "photo");
          const msg = "I miss you bro!";
          await expect(bocProxy.connect(john).sendMessage(chad.address, msg))
            .to.emit(bocProxy, "NotificationCreated")
            .withArgs(1n, john.address, chad.address, 1n, 1n, anyValue);
        });
      });

      describe("Failure", () => {
        it("Should fail when user send message to self", async () => {
          const { bocProxy, bocUsersProxy, chad } = await loadFixture(
            deployDiamondProxyAndActiveFacet
          );
          await bocUsersProxy
            .connect(chad)
            .createUser("John Doe", "doe", "male", 0n, "photo");
          const msg = "I miss you bro!";
          await expect(
            bocProxy.connect(chad).sendMessage(chad.address, msg)
          ).to.be.revertedWith("BOC: Can't message your self!");
        });

        it("Should fail when no user", async () => {
          const { bocProxy, bocUsersProxy, chad, john } = await loadFixture(
            deployDiamondProxyAndActiveFacet
          );
          const msg = "I miss you bro!";
          await expect(
            bocProxy.connect(john).sendMessage(chad.address, msg)
          ).to.be.revertedWith("BOC: User not found!");
        });
      });
    });

    describe("Sending Gifts", () => {
      describe("As Ether", () => {
        describe("Success", () => {
          it("Should allow sending gift", async () => {
            const { bocUsersProxy, bocProxy, chad, john, bocBirthdaysProxy } =
              await loadFixture(deployDiamondProxyAndActiveFacet);

            // create user
            await bocUsersProxy
              .connect(chad)
              .createUser("John Doe", "doe", "male", 0n, "photo");

            // create birthday
            const dob = new Date("Jan 1, 2000").getTime();
            const goal = "I want a job";
            const targetAmount = parseEther("100");
            await bocBirthdaysProxy
              .connect(chad)
              .createBirthdayAndGoal(dob, goal, targetAmount);

            await bocProxy.connect(john).sendEtherAsGift(chad.address, {
              value: parseEther("1"),
            });

            const gifts = await bocUsersProxy
              .connect(chad)
              .getUserGifts(chad.address);

            const notifications = await bocUsersProxy
              .connect(chad)
              .getUserNotifications(chad.address);

            const userBalance = await bocUsersProxy
              .connect(chad)
              .getUserBalance(chad.address);

            await expect(userBalance).to.be.eq(parseEther("1"));
            await expect(gifts.length).to.be.eq(1);
            await expect(gifts[0].id).to.be.eq(1n);
            await expect(gifts[0].sender).to.be.eq(john.address);
            await expect(gifts[0].recipient).to.be.eq(chad.address);
            await expect(gifts[0].amount).to.be.eq(parseEther("1"));
            await expect(notifications.length).to.be.eq(1);
            await expect(notifications[0].id).to.be.eq(1n);
            await expect(notifications[0].sender).to.be.eq(john.address);
            await expect(notifications[0].receiver).to.be.eq(chad.address);
            await expect(notifications[0].notificationTypeId).to.be.eq(1n);
            await expect(notifications[0].notificationType).to.be.eq(0n);
          });

          it("Should increase amount raised in user goals", async () => {
            const { bocUsersProxy, bocBirthdaysProxy, bocProxy, chad, john } =
              await loadFixture(deployDiamondProxyAndActiveFacet);

            await bocUsersProxy
              .connect(chad)
              .createUser("John Doe", "doe", "male", 0n, "photo");

            const dob = new Date().setHours(0, 0, 0, 0);

            await bocBirthdaysProxy
              .connect(chad)
              .createBirthdayAndGoal(
                dob,
                "I want a vacation",
                parseEther("100")
              );

            await bocProxy.connect(john).sendEtherAsGift(chad.address, {
              value: parseEther("1"),
            });

            const goal = await bocUsersProxy
              .connect(chad)
              .getUserGoal(chad.address);

            await expect(goal.amountRaised).to.be.eq(parseEther("1"));
          });

          it("Should allow withdrawal", async () => {
            const { bocUsersProxy, bocProxy, bocBirthdaysProxy, chad, john } =
              await loadFixture(deployDiamondProxyAndActiveFacet);

            await bocUsersProxy
              .connect(chad)
              .createUser("John Doe", "doe", "male", 0n, "photo");

            // create birthday
            const dob = new Date("Jan 1, 2000").getTime();
            const goal = "I want a job";
            const targetAmount = parseEther("1");
            await bocBirthdaysProxy
              .connect(chad)
              .createBirthdayAndGoal(dob, goal, targetAmount);

            const initialBalance = await bocUsersProxy
              .connect(chad)
              .getUserBalance(chad.address);

            await bocProxy.connect(john).sendEtherAsGift(chad.address, {
              value: parseEther("1"),
            });

            const currentBalance = await bocUsersProxy
              .connect(chad)
              .getUserBalance(chad.address);

            await bocBirthdaysProxy.connect(chad).userWithdrawEther();

            const finalBalance = await bocUsersProxy
              .connect(chad)
              .getUserBalance(chad.address);

            await expect(initialBalance).to.be.eq(0n);
            await expect(currentBalance).to.be.eq(parseEther("1"));
            await expect(finalBalance).to.be.eq(0n);
          });

          it("Should emit GiftCreated event", async () => {
            const { bocUsersProxy, bocProxy, chad, john, bocBirthdaysProxy } =
              await loadFixture(deployDiamondProxyAndActiveFacet);

            await bocUsersProxy
              .connect(chad)
              .createUser("John Doe", "doe", "male", 0n, "photo");

            // create birthday
            const dob = new Date("Jan 1, 2000").getTime();
            const goal = "I want a job";
            const targetAmount = parseEther("100");
            await bocBirthdaysProxy
              .connect(chad)
              .createBirthdayAndGoal(dob, goal, targetAmount);

            await expect(
              bocProxy.connect(john).sendEtherAsGift(chad.address, {
                value: parseEther("1"),
              })
            )
              .to.emit(bocProxy, "GiftCreated")
              .withArgs(
                chad.address,
                john.address,
                1n,
                parseEther("1"),
                anyValue
              );
          });

          it("Should emit NotificationCreated event", async () => {
            const { bocUsersProxy, bocProxy, chad, john, bocBirthdaysProxy } =
              await loadFixture(deployDiamondProxyAndActiveFacet);

            await bocUsersProxy
              .connect(chad)
              .createUser("John Doe", "doe", "male", 0n, "photo");

            // create birthday
            const dob = new Date("Jan 1, 2000").getTime();
            const goal = "I want a job";
            const targetAmount = parseEther("100");
            await bocBirthdaysProxy
              .connect(chad)
              .createBirthdayAndGoal(dob, goal, targetAmount);

            await expect(
              bocProxy.connect(john).sendEtherAsGift(chad.address, {
                value: parseEther("1"),
              })
            )
              .to.emit(bocProxy, "NotificationCreated")
              .withArgs(1n, john.address, chad.address, 0n, 1n, anyValue);
          });
        });

        describe("Failure", () => {
          it("Should fail when no user", async () => {
            const { bocUsersProxy, bocProxy, chad, john } = await loadFixture(
              deployDiamondProxyAndActiveFacet
            );
            await expect(
              bocProxy.connect(john).sendEtherAsGift(chad.address, {
                value: parseEther("1"),
              })
            ).to.be.revertedWith("BOC: User not found!");
          });

          it("Should fail for insufficient Ether", async () => {
            const { bocUsersProxy, bocProxy, chad, john, bocBirthdaysProxy } =
              await loadFixture(deployDiamondProxyAndActiveFacet);

            // create user
            await bocUsersProxy
              .connect(chad)
              .createUser("John Doe", "doe", "male", 0n, "photo");

            // create birthday
            const dob = new Date("Jan 1, 2000").getTime();
            const goal = "I want a job";
            const targetAmount = parseEther("100");
            await bocBirthdaysProxy
              .connect(chad)
              .createBirthdayAndGoal(dob, goal, targetAmount);

            await expect(
              bocProxy.connect(john).sendEtherAsGift(chad.address, {
                value: parseEther("0"),
              })
            ).to.be.revertedWith("BOC: Gift must be greater than zero!");
          });

          it("Should fail when sending gift to self", async () => {
            const { bocUsersProxy, bocProxy, chad, bocBirthdaysProxy } =
              await loadFixture(deployDiamondProxyAndActiveFacet);

            // create user
            await bocUsersProxy
              .connect(chad)
              .createUser("John Doe", "doe", "male", 0n, "photo");

            // create birthday
            const dob = new Date("Jan 1, 2000").getTime();
            const goal = "I want a job";
            const targetAmount = parseEther("100");
            await bocBirthdaysProxy
              .connect(chad)
              .createBirthdayAndGoal(dob, goal, targetAmount);

            await expect(
              bocProxy.connect(chad).sendEtherAsGift(chad.address, {
                value: parseEther("1"),
              })
            ).to.be.revertedWith("BOC: Can't gift your self!");
          });

          it("Should fail for insufficient withdrawal", async () => {
            const { bocUsersProxy, bocBirthdaysProxy, bocProxy, chad, john } =
              await loadFixture(deployDiamondProxyAndActiveFacet);

            // create user
            await bocUsersProxy
              .connect(chad)
              .createUser("John Doe", "doe", "male", 0n, "photo");

            // create birthday
            const dob = new Date("Jan 1, 2000").getTime();
            const goal = "I want a job";
            const targetAmount = parseEther("100");
            await bocBirthdaysProxy
              .connect(chad)
              .createBirthdayAndGoal(dob, goal, targetAmount);

            await expect(
              bocBirthdaysProxy.connect(chad).userWithdrawEther()
            ).to.be.revertedWith("BOC: Insufficient funds!");
          });

          it("Should not allow withdrawal when goal is in progress", async () => {
            const { bocUsersProxy, bocProxy, bocBirthdaysProxy, chad, john } =
              await loadFixture(deployDiamondProxyAndActiveFacet);

            await bocUsersProxy
              .connect(chad)
              .createUser("John Doe", "doe", "male", 0n, "photo");

            // create birthday
            const dob = new Date("Jan 1, 2000").getTime();
            const goal = "I want a job";
            const targetAmount = parseEther("100");
            await bocBirthdaysProxy
              .connect(chad)
              .createBirthdayAndGoal(dob, goal, targetAmount);

            await bocProxy.connect(john).sendEtherAsGift(chad.address, {
              value: parseEther("1"),
            });

            await expect(
              bocBirthdaysProxy.connect(chad).userWithdrawEther()
            ).to.be.revertedWith(
              "BOC: Denied, until your goal has been achieved, keep sharing, you got this."
            );
          });
        });
      });

      describe("As BOC", () => {
        describe("Success", () => {
          it("Should allow sending gift", async () => {
            const {
              bocUsersProxy,
              bocProxy,
              chad,
              bocBirthdaysProxy,
              BOCToken,
              bocDiamondProxy,
              deployer,
            } = await loadFixture(deployDiamondProxyAndActiveFacet);

            // create user
            await bocUsersProxy
              .connect(chad)
              .createUser("John Doe", "doe", "male", 0n, "photo");

            // create birthday
            const dob = new Date("Jan 1, 2000").getTime();
            const goal = "I want a job";
            const targetAmount = parseEther("100");
            await bocBirthdaysProxy
              .connect(chad)
              .createBirthdayAndGoal(dob, goal, targetAmount);

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

            await bocProxy
              .connect(deployer)
              .sendTokenAsGift(chad.address, parseEther("1"));

            const gifts = await bocUsersProxy
              .connect(chad)
              .getUserGifts(chad.address);

            const notifications = await bocUsersProxy
              .connect(chad)
              .getUserNotifications(chad.address);

            const userBalance = await bocUsersProxy
              .connect(chad)
              .getUserTokenBalance(chad.address);

            await expect(userBalance).to.be.eq(parseEther("1"));
            await expect(gifts.length).to.be.eq(1);
            await expect(gifts[0].id).to.be.eq(1n);
            await expect(gifts[0].sender).to.be.eq(deployer.address);
            await expect(gifts[0].recipient).to.be.eq(chad.address);
            await expect(gifts[0].amount).to.be.eq(parseEther("1"));
            await expect(notifications.length).to.be.eq(1);
            await expect(notifications[0].id).to.be.eq(1n);
            await expect(notifications[0].sender).to.be.eq(deployer.address);
            await expect(notifications[0].receiver).to.be.eq(chad.address);
            await expect(notifications[0].notificationTypeId).to.be.eq(1n);
            await expect(notifications[0].notificationType).to.be.eq(0n);
          });

          it("Should increase amount raised in user goals", async () => {
            const {
              bocUsersProxy,
              bocBirthdaysProxy,
              bocProxy,
              chad,
              BOCToken,
              bocDiamondProxy,
              deployer,
            } = await loadFixture(deployDiamondProxyAndActiveFacet);

            await bocUsersProxy
              .connect(chad)
              .createUser("John Doe", "doe", "male", 0n, "photo");

            const dob = new Date().setHours(0, 0, 0, 0);

            await bocBirthdaysProxy
              .connect(chad)
              .createBirthdayAndGoal(
                dob,
                "I want a vacation",
                parseEther("100")
              );

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

            await bocProxy
              .connect(deployer)
              .sendTokenAsGift(chad.address, parseEther("1"));

            const goal = await bocUsersProxy
              .connect(chad)
              .getUserGoal(chad.address);

            await expect(goal.amountRaised).to.be.eq(parseEther("1"));
          });

          it("Should allow withdrawal", async () => {
            const {
              bocUsersProxy,
              bocProxy,
              bocBirthdaysProxy,
              chad,
              BOCToken,
              bocDiamondProxy,
              deployer,
            } = await loadFixture(deployDiamondProxyAndActiveFacet);

            // create a user
            await bocUsersProxy
              .connect(chad)
              .createUser("John Doe", "doe", "male", 0n, "photo");

            // create birthday
            const dob = new Date("Jan 1, 2000").getTime();
            const goal = "I want a job";
            const targetAmount = parseEther("1");
            await bocBirthdaysProxy
              .connect(chad)
              .createBirthdayAndGoal(dob, goal, targetAmount);

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

            const initialBalance = await bocUsersProxy
              .connect(chad)
              .getUserTokenBalance(chad.address);

            await bocProxy
              .connect(deployer)
              .sendTokenAsGift(chad.address, parseEther("1"));

            const currentBalance = await bocUsersProxy
              .connect(chad)
              .getUserTokenBalance(chad.address);

            await bocBirthdaysProxy.connect(chad).userWithdrawToken();

            const finalBalance = await bocUsersProxy
              .connect(chad)
              .getUserTokenBalance(chad.address);

            await expect(initialBalance).to.be.eq(0n);
            await expect(currentBalance).to.be.eq(parseEther("1"));
            await expect(finalBalance).to.be.eq(0n);
          });

          it("Should emit GiftCreated event", async () => {
            const {
              bocUsersProxy,
              bocProxy,
              chad,
              bocBirthdaysProxy,
              BOCToken,
              bocDiamondProxy,
              deployer,
            } = await loadFixture(deployDiamondProxyAndActiveFacet);

            await bocUsersProxy
              .connect(chad)
              .createUser("John Doe", "doe", "male", 0n, "photo");

            // create birthday
            const dob = new Date("Jan 1, 2000").getTime();
            const goal = "I want a job";
            const targetAmount = parseEther("100");
            await bocBirthdaysProxy
              .connect(chad)
              .createBirthdayAndGoal(dob, goal, targetAmount);

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
              bocProxy
                .connect(deployer)
                .sendTokenAsGift(chad.address, parseEther("1"))
            )
              .to.emit(bocProxy, "GiftCreated")
              .withArgs(
                chad.address,
                deployer.address,
                1n,
                parseEther("1"),
                anyValue
              );
          });

          it("Should emit NotificationCreated event", async () => {
            const {
              bocUsersProxy,
              bocProxy,
              chad,
              bocBirthdaysProxy,
              BOCToken,
              bocDiamondProxy,
              deployer,
            } = await loadFixture(deployDiamondProxyAndActiveFacet);

            await bocUsersProxy
              .connect(chad)
              .createUser("John Doe", "doe", "male", 0n, "photo");

            // create birthday
            const dob = new Date("Jan 1, 2000").getTime();
            const goal = "I want a job";
            const targetAmount = parseEther("100");
            await bocBirthdaysProxy
              .connect(chad)
              .createBirthdayAndGoal(dob, goal, targetAmount);

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
              bocProxy
                .connect(deployer)
                .sendTokenAsGift(chad.address, parseEther("1"))
            )
              .to.emit(bocProxy, "NotificationCreated")
              .withArgs(1n, deployer.address, chad.address, 0n, 1n, anyValue);
          });
        });

        describe("Failure", () => {
          it("Should fail when no user", async () => {
            const { bocProxy, chad, john } = await loadFixture(
              deployDiamondProxyAndActiveFacet
            );

            await expect(
              bocProxy.connect(john).sendTokenAsGift(chad.address, 1)
            ).to.be.revertedWith("BOC: User not found!");
          });

          it("Should fail for insufficient BOC", async () => {
            const {
              bocUsersProxy,
              bocProxy,
              deployer,
              john,
              bocBirthdaysProxy,
              bocDiamondProxy,
              BOCToken,
            } = await loadFixture(deployDiamondProxyAndActiveFacet);

            // create user
            await bocUsersProxy
              .connect(deployer)
              .createUser("John Doe", "doe", "male", 0n, "photo");

            // create birthday
            const dob = new Date("Jan 1, 2000").getTime();
            const goal = "I want a job";
            const targetAmount = parseEther("100");
            await bocBirthdaysProxy
              .connect(deployer)
              .createBirthdayAndGoal(dob, goal, targetAmount);

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
              bocProxy.connect(john).sendTokenAsGift(deployer.address, 0)
            ).to.be.revertedWith("BOC: Gift must be greater than zero!");
          });

          it("Should fail when sending gift to self", async () => {
            const {
              bocUsersProxy,
              bocProxy,
              deployer,
              bocBirthdaysProxy,
              BOCToken,
              bocDiamondProxy,
            } = await loadFixture(deployDiamondProxyAndActiveFacet);

            // create user
            await bocUsersProxy
              .connect(deployer)
              .createUser("John Doe", "doe", "male", 0n, "photo");

            // create birthday
            const dob = new Date("Jan 1, 2000").getTime();
            const goal = "I want a job";
            const targetAmount = parseEther("100");
            await bocBirthdaysProxy
              .connect(deployer)
              .createBirthdayAndGoal(dob, goal, targetAmount);

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
              bocProxy.connect(deployer).sendTokenAsGift(deployer.address, 1)
            ).to.be.revertedWith("BOC: Can't gift your self!");
          });

          it("Should fail for insufficient withdrawal", async () => {
            const { bocUsersProxy, bocBirthdaysProxy, bocProxy, chad, john } =
              await loadFixture(deployDiamondProxyAndActiveFacet);

            // create user
            await bocUsersProxy
              .connect(chad)
              .createUser("John Doe", "doe", "male", 0n, "photo");

            // create birthday
            const dob = new Date("Jan 1, 2000").getTime();
            const goal = "I want a job";
            const targetAmount = parseEther("100");
            await bocBirthdaysProxy
              .connect(chad)
              .createBirthdayAndGoal(dob, goal, targetAmount);

            await expect(
              bocBirthdaysProxy.connect(chad).userWithdrawToken()
            ).to.be.revertedWith("BOC: Insufficient BOC funds!");
          });

          it("Should not allow withdrawal when goal is in progress", async () => {
            const {
              bocUsersProxy,
              bocProxy,
              bocBirthdaysProxy,
              deployer,
              john,
              BOCToken,
              bocDiamondProxy,
            } = await loadFixture(deployDiamondProxyAndActiveFacet);

            await bocUsersProxy
              .connect(john)
              .createUser("John Doe", "doe", "male", 0n, "photo");

            // create birthday
            const dob = new Date("Jan 1, 2000").getTime();
            const goal = "I want a job";
            const targetAmount = parseEther("100");
            await bocBirthdaysProxy
              .connect(john)
              .createBirthdayAndGoal(dob, goal, targetAmount);

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

            await bocProxy.connect(deployer).sendTokenAsGift(john.address, 1);

            await expect(
              bocBirthdaysProxy.connect(john).userWithdrawToken()
            ).to.be.revertedWith(
              "BOC: Denied, until your goal has been achieved, keep sharing, you got this."
            );
          });
        });
      });
    });
  });
});
