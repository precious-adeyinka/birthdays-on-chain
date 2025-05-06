import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const BOCDiamondProxy = buildModule("BOCDiamondProxy", (m) => {
  const deployer = m.getAccount(0);

  const bocDiamondProxy = m.contract("BOCDiamond", [deployer]);
  const bocAccessFacet = m.contract("BOCAccessFacet");
  const usersFacet = m.contract("BOCUsersFacet");
  const birthdaysFacet = m.contract("BOCBirthdaysFacet");
  const subscribeFacet = m.contract("BOCSubscribeFacet");
  const activitiesFacet = m.contract("BOCActivitiesFacet");
  const platformFacet = m.contract("BOCPlatformFacet");
  const bocInit = m.contract("BOCInit");

  return {
    bocDiamondProxy,
    bocAccessFacet,
    usersFacet,
    birthdaysFacet,
    subscribeFacet,
    activitiesFacet,
    platformFacet,
    bocInit,
  };
});

export default BOCDiamondProxy;
