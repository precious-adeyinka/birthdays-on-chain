const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

const proxyModule = buildModule("ProxyModule", (m: any) => {
  const proxyAdminOwner = m.getAccount(0);

  const BOCTokenV1 = m.contract("BOCTokenV1");

  const initialize = m.encodeFunctionCall(BOCTokenV1, "initialize", [
    proxyAdminOwner,
    proxyAdminOwner,
  ]);

  const proxy = m.contract("TransparentUpgradeableProxy", [
    BOCTokenV1,
    proxyAdminOwner,
    initialize,
  ]);

  const proxyAdminAddress = m.readEventArgument(
    proxy,
    "AdminChanged",
    "newAdmin"
  );

  const proxyAdmin = m.contractAt("ProxyAdmin", proxyAdminAddress);

  return { proxy, proxyAdmin };
});

const BOCTokenV1Module = buildModule("BOCTokenV1Module", (m: any) => {
  const { proxy, proxyAdmin } = m.useModule(proxyModule);

  const BOCToken = m.contractAt("BOCTokenV1", proxy);

  return {
    BOCToken,
    proxy,
    proxyAdmin,
  };
});

export default BOCTokenV1Module;
