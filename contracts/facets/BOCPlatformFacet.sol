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
import "./BOCBaseFacet.sol";
import "./BOCAccessFacet.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract BOCPlatformFacet is BOCAccessFacet, BOCBaseFacet  {
    ///////////////////////////////////////////////////
    //             BOC PLATFORM FUNCTIONS            //
    ///////////////////////////////////////////////////

    struct UserComplete {
        BOCDiamondStorage.User user;
        BOCDiamondStorage.Birthday birthdays;
        BOCDiamondStorage.Message[] messages;
        BOCDiamondStorage.Gift[] gifts;
        BOCDiamondStorage.Notification[] notifications;
        BOCDiamondStorage.Goal goal;
        BOCDiamondStorage.Subscription subscriptions;
        uint256 balance;

    }

    function getCompleteUser(address _userAddress) external view returns(UserComplete memory) {
        return UserComplete(
            BOCDiamondStorage.getStorage().users[_userAddress],
            BOCDiamondStorage.getStorage().birthdays[_userAddress],
            BOCDiamondStorage.getStorage().messages[_userAddress],
            BOCDiamondStorage.getStorage().gifts[_userAddress],
            BOCDiamondStorage.getStorage().notifications[_userAddress],
            BOCDiamondStorage.getStorage().goals[_userAddress],
            BOCDiamondStorage.getStorage().subscriptions[_userAddress],
            BOCDiamondStorage.getStorage().balances[_userAddress]
        );
    }
    
    function updateBOCTokenContractAddress(address _newTokenContractAddress) external onlyOwner {
        BOCDiamondStorage.getStorage()._token = IERC20(_newTokenContractAddress);
    }
}