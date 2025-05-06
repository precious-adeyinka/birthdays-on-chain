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
// import "@solidstate/contracts/token/ERC20/IERC20.sol";

library BOCDiamondStorage {
    // Storage state
    bytes32 constant BOC_STORAGE_POSITION = keccak256("boc.app.storage");

    enum NotificationType {Gift, Message}
    enum SubscriptionType {BOC, ETH}

    struct User {
        address uid;
        string fullname;
        string nickname;
        string gender;
        string photo;
        SubscriptionType currency;
        bool isActive;
        bool hasSubscription;
        uint256 joinedDate;
    }

    struct Goal {
        uint256 createdAt;
        string description;
        uint256 targetAmount;
        uint256 amountRaised;
    }

    struct BirthdayTimeline {
        uint256 createdAt;
    }

    struct Birthday {
        uint256 id;
        uint256 createdAt;
        uint256 when;
        BirthdayTimeline[] timeline;
        Goal goal;
    }

    struct Message {
        uint256 id;
        uint256 createdAt;
        address sender; 
        address recipient;
        string message;
    }

    struct Gift {
        uint256 id;
        uint256 createdAt;
        address sender; 
        address recipient;
        uint256 amount;
    }

    struct Notification {
        uint256 id;
        address sender;
        address receiver;
        uint256 notificationTypeId;
        NotificationType notificationType;
        uint256 createdAt;
    }

    struct Subscription {
        uint256 id;
        uint256 createdAt;
        SubscriptionType subscriptionType;
        uint256 amount;
        bool hasExpired;
        uint256 billingPeriod;
    }

    struct BOCStorage {
        address _owner;
        IERC20 _token;
        mapping(address => Notification[]) notifications;
        mapping(address => Message[]) messages;
        mapping(address => Gift[]) gifts;
        mapping(address => Birthday) birthdays;
        mapping(address => Goal) goals;
        mapping(address => User) users;
        mapping(address => Subscription) subscriptions;
        mapping(address => bool) isSubscribed;
        mapping(address => mapping(address => uint256)) balanceOf; // token => user => balance
        mapping(address => uint256) balances; // user => balance
        mapping(address => uint256) subscriptionBalances;
        mapping(address => bool) authorizedOperators;
        address[] subscribedUsers;
        uint256 withdrawalFee;
    }

    function getStorage() internal pure returns (BOCStorage storage bs) {
        bytes32 position = BOC_STORAGE_POSITION;
        assembly {
            bs.slot := position
        }
    }
}