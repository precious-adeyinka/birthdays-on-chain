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

contract BOCUsersFacet is BOCAccessFacet, BOCBaseFacet  {
    ///////////////////////////////////////////////////
    //                 USER FUNCTIONS                //
    ///////////////////////////////////////////////////

    event UserCreated(address indexed user, uint256 when);
    event UpdateUser(address indexed user, uint256 when);

    function bocWithdrawEther() external onlyOwner() {
        withdrawEther();
    }

    function bocWithdrawToken(address _tokenAddress, address _receiver) external onlyOwner {
        withdrawToken(_tokenAddress, _receiver);
    }

    function checkBalance() external view onlyOwner returns(uint256) {
        return BOCDiamondStorage.getStorage().balances[msg.sender];
    }

    function checkTokenBalance() external view onlyOwner returns(uint256) {
        return BOCDiamondStorage.getStorage().balanceOf[address(BOCDiamondStorage.getStorage()._token)][msg.sender];
    }

    function createUser(
        string memory _fullname, 
        string memory _nickname,
        string memory _gender,
        BOCDiamondStorage.SubscriptionType _currency,
        string memory _photo
    ) external whenUserExists(msg.sender) {
        BOCDiamondStorage.User memory user = BOCDiamondStorage.User({ 
            uid: msg.sender,
            fullname : _fullname,
            nickname : _nickname,
            gender: _gender,
            photo: _photo,
            currency: _currency,
            isActive: true,
            hasSubscription: false,
            joinedDate: block.timestamp  
        });

        BOCDiamondStorage.getStorage().users[msg.sender] = user;

        emit UserCreated(msg.sender, block.timestamp);
    }

    function updateUser(
        string memory _fullname, 
        string memory _nickname,
        BOCDiamondStorage.SubscriptionType _currency,
        string memory _photo
    ) external whenNoUserExists(msg.sender) {
        BOCDiamondStorage.User storage user = BOCDiamondStorage.getStorage().users[msg.sender];

        user.fullname = _fullname;
        user.nickname = _nickname;
        user.currency = _currency;
        user.photo = _photo;

        emit UpdateUser(msg.sender, block.timestamp);
    }

    function getUser (address _userAddress) 
    external 
    view 
    whenNoUserExists(_userAddress) 
    returns(BOCDiamondStorage.User memory) {
        return BOCDiamondStorage.getStorage().users[_userAddress];
    }

    function getUserMessages (address _userAddress) 
    external 
    view 
    whenNoUserExists(_userAddress) 
    returns(BOCDiamondStorage.Message[] memory) {
        return BOCDiamondStorage.getStorage().messages[_userAddress];
    }

    function getUserNotifications (address _userAddress) 
    external 
    view 
    whenNoUserExists(_userAddress) 
    returns(BOCDiamondStorage.Notification[] memory) {
        return BOCDiamondStorage.getStorage().notifications[_userAddress];
    }

    function getUserGifts (address _userAddress) 
    external 
    view 
    whenNoUserExists(_userAddress) 
    returns(BOCDiamondStorage.Gift[] memory) {
        return BOCDiamondStorage.getStorage().gifts[_userAddress];
    }

    function getUserBirthdays (address _userAddress) 
    external 
    view 
    whenNoUserExists(_userAddress) 
    returns(BOCDiamondStorage.Birthday memory) {
        return BOCDiamondStorage.getStorage().birthdays[_userAddress];
    }

    function getUserGoal (address _userAddress) 
    external 
    view 
    whenNoUserExists(_userAddress) 
    returns(BOCDiamondStorage.Goal memory) {
        require(hasBirthday(_userAddress) == true, "BOC: No Birthday found!");
        BOCDiamondStorage.Birthday memory userBirthday = getBirthdays(_userAddress);
        require(birthdayHasGoal(userBirthday) == true, "BOC: No Goal found!");
        return userBirthday.goal;
    }

    function getUserSubscription (address _userAddress) 
    external 
    view 
    whenNoUserExists(_userAddress) 
    returns(BOCDiamondStorage.Subscription memory) {
        return BOCDiamondStorage.getStorage().subscriptions[_userAddress];
    }

    function getUserBalance (address _userAddress) 
    external 
    view 
    whenNoUserExists(_userAddress) 
    returns(uint256) {
        return BOCDiamondStorage.getStorage().balances[_userAddress];
    }

    function getUserTokenBalance (address _userAddress) 
    external 
    view 
    whenNoUserExists(_userAddress) 
    returns(uint256) {
        return BOCDiamondStorage.getStorage().balanceOf[address(BOCDiamondStorage.getStorage()._token)][_userAddress];
    }
}