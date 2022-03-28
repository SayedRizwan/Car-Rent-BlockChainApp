var Renting = artifacts.require("Renting");

module.exports = function(deployer, network, accounts) {
  deployer.deploy(Renting);
};
