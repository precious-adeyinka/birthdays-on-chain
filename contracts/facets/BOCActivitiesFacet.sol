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

contract BOCActivitiesFacet is BOCAccessFacet, BOCBaseFacet  {
    ///////////////////////////////////////////////////
    //          BOC MESSAGE & GIFT FUNCTIONS         //
    ///////////////////////////////////////////////////

    event NotificationCreated(
        uint256 id, 
        address indexed from, 
        address indexed to, 
        BOCDiamondStorage.NotificationType notificationType, 
        uint256 notificationTypeId, 
        uint256 when
    );
    event GiftCreated(address indexed receiver, address indexed sender, uint256 id, uint256 amout, uint256 when);
    event MessageCreated(address indexed receiver, address indexed sender, uint256 id, uint256 when);

    function sendMessage (address _userAddress, string memory _msg) 
    external whenNoUserExists(_userAddress)
    {
        require(_userAddress != msg.sender, "BOC: Can't message your self!");

        uint256 _msgCount = BOCDiamondStorage.getStorage().messages[_userAddress].length;
        uint256 _notificationCount = BOCDiamondStorage.getStorage().notifications[_userAddress].length;

        BOCDiamondStorage.getStorage().messages[_userAddress].push(BOCDiamondStorage.Message({
            id: (_msgCount + 1),
            createdAt: block.timestamp,
            sender: msg.sender,
            recipient: _userAddress,
            message: _msg
        }));

        BOCDiamondStorage.getStorage().notifications[_userAddress].push(BOCDiamondStorage.Notification({
            id: (_notificationCount + 1), 
            createdAt: block.timestamp,
            sender: msg.sender,  
            receiver: _userAddress,
            notificationTypeId: (_msgCount + 1),
            notificationType: BOCDiamondStorage.NotificationType.Message
        }));

        emit MessageCreated(_userAddress, msg.sender, (_msgCount + 1), block.timestamp);
        emit NotificationCreated(
            (_notificationCount + 1), 
            msg.sender, 
            _userAddress, 
            BOCDiamondStorage.NotificationType.Message, 
            (_msgCount + 1), 
            block.timestamp
        );

    }

    function hasMessage (address _userAddress) 
    internal view whenNoUserExists(_userAddress) returns(bool) {
        return BOCDiamondStorage.getStorage().messages[_userAddress].length > 0;
    }
    
    function _messageExists(address _userAddress, uint256 _msgId) 
    internal view whenNoUserExists(_userAddress) returns(bool) {
        require(hasMessage(_userAddress) == true, "BOC: No Message found!");
        require((BOCDiamondStorage.getStorage().messages[_userAddress].length - 1) >= _msgId, "BOC: Invalid Message ID!");
        return BOCDiamondStorage.getStorage().messages[_userAddress][_msgId].id != 0;
    }

    function getMessage(address _userAddress, uint256 _messageId) 
    internal view whenNoUserExists(_userAddress) returns(BOCDiamondStorage.Message memory) {
        require(hasMessage(_userAddress) == true, "BOC: No Message found!");
        require(_messageExists(_userAddress, _messageId) == true, "BOC: Invalid Message!");
        return BOCDiamondStorage.getStorage().messages[_userAddress][_messageId];
    }

    function getMessages(address _userAdress) 
    internal view whenNoUserExists(_userAdress) returns(BOCDiamondStorage.Message[] memory) {
        require(hasMessage(_userAdress) == true, "BOC: No Message found!");
        return BOCDiamondStorage.getStorage().messages[_userAdress];
    }

    function sendEtherAsGift (address _userAddress) 
    external payable whenNoUserExists(_userAddress)
    {
        require(msg.value > 0, "BOC: Gift must be greater than zero!");
        require(_userAddress != msg.sender, "BOC: Can't gift your self!");
        require(_userAddress != address(0), "BOC: Invalid receiver address!");
        require(msg.sender != address(0), "BOC: Invalid sender address!");
        require(hasBirthday(_userAddress), "BOC: No birthday found!");
        BOCDiamondStorage.Birthday storage userBirthday = BOCDiamondStorage.getStorage().birthdays[_userAddress];
        BOCDiamondStorage.Goal storage userGoal = userBirthday.goal;
        require(msg.value + userGoal.amountRaised <= userGoal.targetAmount, "BOC: Gift exceeds the target amount!");

        uint256 _giftCount = BOCDiamondStorage.getStorage().gifts[_userAddress].length;
        uint256 _notificationCount = BOCDiamondStorage.getStorage().notifications[_userAddress].length;

        BOCDiamondStorage.getStorage().gifts[_userAddress].push(BOCDiamondStorage.Gift({
            id: (_giftCount + 1),
            createdAt: block.timestamp,
            sender: msg.sender,
            recipient: _userAddress,
            amount: msg.value
        }));

        BOCDiamondStorage.getStorage().balances[_userAddress] += msg.value;
        BOCDiamondStorage.getStorage().birthdays[_userAddress].goal.amountRaised += msg.value;

        BOCDiamondStorage.getStorage().notifications[_userAddress].push(BOCDiamondStorage.Notification({
            id: (_notificationCount + 1), 
            createdAt: block.timestamp,
            sender: msg.sender,  
            receiver: _userAddress,
            notificationTypeId: (_giftCount + 1),
            notificationType: BOCDiamondStorage.NotificationType.Gift
        }));

        emit GiftCreated(
            _userAddress, 
            msg.sender, 
            (_giftCount + 1), 
            msg.value, 
            block.timestamp
        );
      
        emit NotificationCreated(
            (_notificationCount + 1), 
            msg.sender, 
            _userAddress, 
            BOCDiamondStorage.NotificationType.Gift, 
            (_giftCount + 1), 
            block.timestamp
        );
    }

    function sendTokenAsGift (address _userAddress, uint256 _amount) 
    external whenNoUserExists(_userAddress)
    {
        require(_amount > 0, "BOC: Gift must be greater than zero!");
        require(BOCDiamondStorage.getStorage()._token.balanceOf(msg.sender) > 0, "BOC: You don't have enough BOC Tokens to send!");
        require(_userAddress != msg.sender, "BOC: Can't gift your self!");
        require(_userAddress != address(0), "BOC: Invalid receiver address!");
        require(msg.sender != address(0), "BOC: Invalid sender address!");
        require(hasBirthday(_userAddress), "BOC: No birthday found!");
        BOCDiamondStorage.Birthday storage userBirthday = BOCDiamondStorage.getStorage().birthdays[_userAddress];
        BOCDiamondStorage.Goal storage userGoal = userBirthday.goal;
        require(_amount + userGoal.amountRaised <= userGoal.targetAmount, "BOC: Gift exceeds the target amount!");

        bool giftTransferSuccess = BOCDiamondStorage.getStorage()._token.transferFrom(msg.sender, address(this), _amount);
        if (!giftTransferSuccess) revert("BOC Transfer Failed!");

        uint256 _giftCount = BOCDiamondStorage.getStorage().gifts[_userAddress].length;
        uint256 _notificationCount = BOCDiamondStorage.getStorage().notifications[_userAddress].length;

        BOCDiamondStorage.getStorage().gifts[_userAddress].push(BOCDiamondStorage.Gift({
            id: (_giftCount + 1),
            createdAt: block.timestamp,
            sender: msg.sender,
            recipient: _userAddress,
            amount: _amount
        }));

        BOCDiamondStorage.getStorage().balanceOf[address(BOCDiamondStorage.getStorage()._token)][_userAddress] += _amount;
        BOCDiamondStorage.getStorage().birthdays[_userAddress].goal.amountRaised += _amount;

        BOCDiamondStorage.getStorage().notifications[_userAddress].push(BOCDiamondStorage.Notification({
            id: (_notificationCount + 1), 
            createdAt: block.timestamp,
            sender: msg.sender,  
            receiver: _userAddress,
            notificationTypeId: (_giftCount + 1),
            notificationType: BOCDiamondStorage.NotificationType.Gift
        }));

        emit GiftCreated(
            _userAddress, 
            msg.sender, 
            (_giftCount + 1), 
            _amount,
            block.timestamp
        );
      
        emit NotificationCreated(
            (_notificationCount + 1), 
            msg.sender, 
            _userAddress, 
            BOCDiamondStorage.NotificationType.Gift, 
            (_giftCount + 1), 
            block.timestamp
        );
    }

    function hasGift (address _userAddress) 
    internal view whenNoUserExists(_userAddress) returns(bool) {
        return BOCDiamondStorage.getStorage().gifts[_userAddress].length > 0;
    }

    function _giftExists(address _userAddress, uint256 _giftId) 
    internal view whenNoUserExists(_userAddress) returns(bool) {
        require(hasGift(_userAddress) == true, "BOC: No Gift found!");
        require((BOCDiamondStorage.getStorage().gifts[_userAddress].length - 1) >= _giftId, "BOC: Invalid Gift ID!");
        return BOCDiamondStorage.getStorage().gifts[_userAddress][_giftId].id != 0;
    }

    function getGift(address _userAddress, uint256 _giftId) 
    internal view whenNoUserExists(_userAddress) returns(BOCDiamondStorage.Gift memory) {
        require(hasGift(_userAddress) == true, "BOC: No Gift found!");
        require(_giftExists(_userAddress, _giftId) == true, "BOC: Invalid Gift!");
        return BOCDiamondStorage.getStorage().gifts[_userAddress][_giftId];
    }

    function getGifts(address _userAdress) 
    internal view whenNoUserExists(_userAdress) returns(BOCDiamondStorage.Gift[] memory) {
        require(hasGift(_userAdress) == true, "BOC: No Gift found!");
        return BOCDiamondStorage.getStorage().gifts[_userAdress];
    }
    
}