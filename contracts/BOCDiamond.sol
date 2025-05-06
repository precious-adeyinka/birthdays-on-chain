// SPDX-License-Identifier: MIT

/********************************************************************************************************\
* Author: Precious Adeyinka <officialpreciousadeyinka@gmail.com> (https://twitter.com/preshadeyinka)
* Implements EIP-2535 Diamond Standard: https://eips.ethereum.org/EIPS/eip-2535
*
* Birthdays On Chain Platform Diamond.
/*********************************************************************************************************/

pragma solidity 0.8.28;
pragma experimental ABIEncoderV2;

import "@solidstate/contracts/proxy/diamond/SolidStateDiamond.sol";
import "@solidstate/contracts/access/ownable/OwnableStorage.sol";

contract BOCDiamond is SolidStateDiamond {
    constructor(address owner) {
        OwnableStorage.Layout storage l = OwnableStorage.layout();
        l.owner = owner;
    }
}