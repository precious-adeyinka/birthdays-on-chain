const BOCTokenModule = require("./BOCTokenProxyModule");

const upgradeModule = buildModule("UpgradeModule", (m: any) => {
  const proxyAdminOwner = m.getAccount(0);

  const { proxyAdmin, proxy } = m.useModule(BOCTokenModule);

  const BOCTokenV2 = m.contract("BOCTokenV2");

  m.call(proxyAdmin, "upgradeAndCall", [proxy, BOCTokenV2, "0x"], {
    from: proxyAdminOwner,
  });

  return {
    proxy,
    proxyAdmin,
  };
});

const BOCTokenV2Module = buildModule("BOCTokenV2Module", (m: any) => {
  const { proxy } = m.useModule(upgradeModule);

  const BOCTokenV2 = m.contractAt("BOCTokenV2", proxy);

  return { BOCTokenV2 };
});

module.exports = BOCTokenV2Module;
