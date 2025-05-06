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

contract BOCSubscribeFacet is BOCAccessFacet, BOCBaseFacet  {
    ///////////////////////////////////////////////////
    //          BOC SUBSCRIPTION FUNCTIONS           //
    ///////////////////////////////////////////////////

    event UserSubscribed(address indexed user, uint256 when);

    function subscribeWithEther() 
    external payable whenNoUserExists(msg.sender) {
        require(msg.value > 1 wei, "BOC: Not enough Ether!");
        require(!BOCDiamondStorage.getStorage().isSubscribed[msg.sender], "BOC: You are already subscribed!");
        BOCDiamondStorage.getStorage().subscriptions[msg.sender] = BOCDiamondStorage.Subscription({
            id: (BOCDiamondStorage.getStorage().subscriptions[msg.sender].id + 1),
            createdAt: block.timestamp,
            subscriptionType: BOCDiamondStorage.SubscriptionType.ETH,
            amount: msg.value,
            hasExpired: false,
            billingPeriod: (block.timestamp + 31 days)
        });
        BOCDiamondStorage.getStorage().isSubscribed[msg.sender] = true;
        BOCDiamondStorage.User storage user = BOCDiamondStorage.getStorage().users[msg.sender];
        user.hasSubscription = true;
        BOCDiamondStorage.getStorage().subscriptionBalances[msg.sender] = msg.value;
        BOCDiamondStorage.getStorage().subscribedUsers.push(msg.sender);
        BOCDiamondStorage.getStorage().balances[BOCDiamondStorage.getStorage()._owner] += msg.value;

        // update expired subscriptions
        _updateExpiredSubscriptions();

        emit UserSubscribed(msg.sender, block.timestamp);
    }

    function subscribeWithToken(uint256 _amount) 
    external whenNoUserExists(msg.sender) {
        require(_amount > 0, "BOC: Insufficient BOC Balance!");
        require(!BOCDiamondStorage.getStorage().isSubscribed[msg.sender], "BOC: You are already subscribed!");

        BOCDiamondStorage.getStorage()._token.transferFrom(msg.sender, address(this), _amount);

        BOCDiamondStorage.getStorage().subscriptions[msg.sender] = BOCDiamondStorage.Subscription({
            id: (BOCDiamondStorage.getStorage().subscriptions[msg.sender].id + 1),
            createdAt: block.timestamp,
            subscriptionType: BOCDiamondStorage.SubscriptionType.BOC,
            amount: _amount,
            hasExpired: false,
            billingPeriod: (block.timestamp + 31 days)
        });
        BOCDiamondStorage.getStorage().isSubscribed[msg.sender] = true;
        BOCDiamondStorage.User storage user = BOCDiamondStorage.getStorage().users[msg.sender];
        user.hasSubscription = true;
        BOCDiamondStorage.getStorage().subscriptionBalances[msg.sender] = _amount;
        BOCDiamondStorage.getStorage().subscribedUsers.push(msg.sender);
        BOCDiamondStorage.getStorage().balanceOf[address(BOCDiamondStorage.getStorage()._token)][BOCDiamondStorage.getStorage()._owner] += _amount;

        // update expired subscriptions
        _updateExpiredSubscriptions();

        emit UserSubscribed(msg.sender, block.timestamp);
    }

    function getSubscribedUsers() external view returns(BOCDiamondStorage.User[] memory) {
        uint activeCount = 0;

        // Count how many active users there are
        for (uint i = 0; i < BOCDiamondStorage.getStorage().subscribedUsers.length; i++) {
            address userAddress = BOCDiamondStorage.getStorage().subscribedUsers[i];
            if (_checkUserSubscription(userAddress)) {
                activeCount++;
            }
        }

        // Create an array to store active users
        BOCDiamondStorage.User[] memory usersList = new BOCDiamondStorage.User[](activeCount);
        uint index = 0;

        // Populate the usersList with active users
        for (uint i = 0; i < BOCDiamondStorage.getStorage().subscribedUsers.length; i++) {
            address userAddress = BOCDiamondStorage.getStorage().subscribedUsers[i];
            if (_checkUserSubscription(userAddress)) {
                usersList[index] = BOCDiamondStorage.getStorage().users[userAddress];
                index++;
            }
        }

        return usersList;
    }
}