// SPDX-License-Identifier: MIT

/********************************************************************************************************\
* Author: Precious Adeyinka <officialpreciousadeyinka@gmail.com> (https://twitter.com/preshadeyinka)
* Implements EIP-2535 Diamond Standard: https://eips.ethereum.org/EIPS/eip-2535
*
* Birthdays On Chain Platform Diamond.
/*********************************************************************************************************/

pragma solidity 0.8.28;
pragma experimental ABIEncoderV2;

import "../storage/BOCDiamondStorage.sol";

contract BOCAccessFacet {
    modifier onlyOwner {
        require(msg.sender == BOCDiamondStorage.getStorage()._owner, "BOC: Owner only Operation!");
        _;
    }

    modifier onlyAuthorize {
        require(BOCDiamondStorage.getStorage().authorizedOperators[msg.sender] || msg.sender == BOCDiamondStorage.getStorage()._owner, "BOC: Unauthorized Operation!");
        _;
    }

    function _addAuthorizedOperator(address operator) internal onlyOwner {
        BOCDiamondStorage.BOCStorage storage s = BOCDiamondStorage.getStorage();
        s.authorizedOperators[operator] = true;
    }
}