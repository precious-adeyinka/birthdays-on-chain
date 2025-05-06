// SPDX-License-Identifier: MIT

/********************************************************************************************************\
* Author: Precious Adeyinka <officialpreciousadeyinka@gmail.com> (https://twitter.com/preshadeyinka)
* Implements EIP-2535 Diamond Standard: https://eips.ethereum.org/EIPS/eip-2535
*
* Birthdays On Chain Platform Diamond.
/*********************************************************************************************************/

pragma solidity 0.8.28;
pragma experimental ABIEncoderV2;


import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../storage/BOCDiamondStorage.sol";
import "../facets/BOCAccessFacet.sol";

contract BOCInit is BOCAccessFacet {
    function init(address _owner, address _token, uint256 _withdrawalFee) external {
        BOCDiamondStorage.BOCStorage storage s = BOCDiamondStorage.getStorage();
        s.withdrawalFee = _withdrawalFee; // % (percent) withdrawal fee
        s._owner = _owner;
        s._token = IERC20(_token);
    }
}