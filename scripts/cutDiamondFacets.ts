import { getSelectors, FacetCutAction, ZERO_ADDRESS } from "../utils/deploy";
import hre, { ethers } from "hardhat";

const cutDiamondFacets = async () => {
  // const provider = new ethers.JsonRpcProvider()
  // const wallet = new ethers.Wallet(privateKey, provider)
  const [deployer] = await ethers.getSigners();

  const addresses = {
    accessFacet: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
    activitiesFacet: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
    birthdaysFacet: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9",
    diamond: "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707",
    init: "0x0165878A594ca255338adfa4d48449f69242Eb8F",
    platformFacet: "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853",
    subscribeFacet: "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6",
    usersFacet: "0x8A791620dd6260079BF849Dc5567aDC3F2FdC318",
  };

  const usersArtifact = await hre.artifacts.readArtifact("BOCUsersFacet");
  const birthdaysArtifact = await hre.artifacts.readArtifact(
    "BOCBirthdaysFacet"
  );
  const subscribeArtifact = await hre.artifacts.readArtifact(
    "BOCSubscribeFacet"
  );
  const activitiesArtifact = await hre.artifacts.readArtifact(
    "BOCActivitiesFacet"
  );
  const platformArtifact = await hre.artifacts.readArtifact("BOCPlatformFacet");

  const bocTokenAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
  const bocDiamond = await ethers.getContractAt(
    "BOCDiamond",
    addresses["diamond"],
    deployer
  );
  const bocInit = await ethers.getContractAt(
    "BOCInit",
    addresses["init"],
    deployer
  );

  let selectorUsersFacet = await getSelectors("BOCUsersFacet");
  let selectorBirthdaysFacet = await getSelectors("BOCBirthdaysFacet");
  let selectorSubscribeFacet = await getSelectors("BOCSubscribeFacet");
  let selectorActivitiesFacet = await getSelectors("BOCActivitiesFacet");
  let selectorPlatformFacet = await getSelectors("BOCPlatformFacet");

  let cuts = [
    {
      target: addresses["usersFacet"],
      action: FacetCutAction.Add,
      selectors: selectorUsersFacet,
    },
    {
      target: addresses["birthdaysFacet"],
      action: FacetCutAction.Add,
      selectors: selectorBirthdaysFacet,
    },
    {
      target: addresses["subscribeFacet"],
      action: FacetCutAction.Add,
      selectors: selectorSubscribeFacet,
    },
    {
      target: addresses["activitiesFacet"],
      action: FacetCutAction.Add,
      selectors: selectorActivitiesFacet,
    },
    {
      target: addresses["platformFacet"],
      action: FacetCutAction.Add,
      selectors: selectorPlatformFacet,
    },
  ];

  const calldata = bocInit.interface.encodeFunctionData("init", [
    deployer.address,
    bocTokenAddress,
    3,
  ]);
  const noCalldata = "0x";
  const target = await bocInit.getAddress();

  await bocDiamond.diamondCut(cuts, target, calldata);
};

cutDiamondFacets();
