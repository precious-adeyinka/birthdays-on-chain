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
import "./BOCAccessFacet.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

abstract contract BOCBaseFacet is BOCAccessFacet {
    event EtherWithdraw(address indexed from, address indexed to, uint256 amount, uint256 when);
    event TokenWithdraw(address indexed from, address indexed to, address indexed token, uint256 amount, uint256 when);

    ///////////////////////////////////////////////////
    //                    MODIFIERS                  //
    ///////////////////////////////////////////////////

    modifier whenUserExists (address _userAddress) {
        require(_doesUserExist(_userAddress) == false, "BOC: User already exist!");
        _;
    }

    modifier whenNoUserExists (address _userAddress) {
        require(_doesUserExist(_userAddress), "BOC: User not found!");
        _;
    }

    modifier checkSubscription(address _userAddress) {
        require(_hasSubscription(_userAddress), "BOC: Subscription expired!");
        _;
    }

    function getWithdrawalFee() internal view onlyOwner returns(uint256) {
        return BOCDiamondStorage.getStorage().withdrawalFee;
    }

    function withdrawEther() internal onlyOwner {
        require(address(this).balance > 0, "BOC: Insufficient Ether Balance!");
        (bool success, ) = BOCDiamondStorage.getStorage()._owner.call{
            value: BOCDiamondStorage.getStorage().balances[BOCDiamondStorage.getStorage()._owner]
        }("");
        require(success, "BOC: Ether withdrawal failed!");
        BOCDiamondStorage.getStorage().balances[BOCDiamondStorage.getStorage()._owner] = 0;
        emit EtherWithdraw(address(this), BOCDiamondStorage.getStorage()._owner, BOCDiamondStorage.getStorage().balances[BOCDiamondStorage.getStorage()._owner], block.timestamp);
    }

    function withdrawToken(address _tokenAddress, address _receiver) internal onlyOwner {
        address owner_ = BOCDiamondStorage.getStorage()._owner;
        uint256 _ownerTokenBalance = BOCDiamondStorage.getStorage().balanceOf[_tokenAddress][owner_];
        IERC20(_tokenAddress).approve(address(this), _ownerTokenBalance);
        IERC20(_tokenAddress).transferFrom(BOCDiamondStorage.getStorage()._owner, _receiver, _ownerTokenBalance);
        BOCDiamondStorage.getStorage().balanceOf[_tokenAddress][owner_] = 0;
        emit TokenWithdraw(BOCDiamondStorage.getStorage()._owner, _receiver, _tokenAddress, _ownerTokenBalance, block.timestamp);
    }

    function _doesUserExist (address _userAddress) private view returns(bool) {
        return BOCDiamondStorage.getStorage().users[_userAddress].isActive;
    }

    function _checkUserSubscription (address _userAddress) 
    internal view whenNoUserExists(_userAddress) returns(bool) {
        BOCDiamondStorage.Subscription storage existingSubscription = BOCDiamondStorage.getStorage().subscriptions[_userAddress];
      
        if(existingSubscription.createdAt > 0 && !existingSubscription.hasExpired && (existingSubscription.billingPeriod < block.timestamp)) {
            return false;
        }

        return true;
    }

    function _updateExpiredSubscriptions() internal {
        for (uint i = 0; i < BOCDiamondStorage.getStorage().subscribedUsers.length; i++) {
            if (!_checkUserSubscription(BOCDiamondStorage.getStorage().subscribedUsers[i])) {
                address userAddress = BOCDiamondStorage.getStorage().subscribedUsers[i];
                BOCDiamondStorage.User storage user = BOCDiamondStorage.getStorage().users[userAddress];
                user.hasSubscription = false;
                BOCDiamondStorage.Subscription storage existingSubscription = BOCDiamondStorage.getStorage().subscriptions[userAddress];
                existingSubscription.hasExpired = true;
                BOCDiamondStorage.getStorage().isSubscribed[userAddress] = false;
                BOCDiamondStorage.getStorage().subscriptionBalances[userAddress] = 0;
            }
        }
    }

    function _hasSubscription (address _userAddress) 
    internal whenNoUserExists(_userAddress) returns(bool) {
        BOCDiamondStorage.Subscription storage existingSubscription = BOCDiamondStorage.getStorage().subscriptions[_userAddress];

        if(existingSubscription.createdAt == 0) {
            return false;
        }

        bool hasExpired = (existingSubscription.billingPeriod - 31 days) < block.timestamp;
        if(hasExpired) {
            existingSubscription.hasExpired = true;
            existingSubscription.amount = 0;
            BOCDiamondStorage.getStorage().users[_userAddress].hasSubscription = false;
            BOCDiamondStorage.getStorage().isSubscribed[msg.sender] = false;
            BOCDiamondStorage.getStorage().subscriptionBalances[_userAddress] = 0;

            return false;
        } else {
            return true;
        }
    }

    function hasBirthday (address _userAddress) 
    internal view whenNoUserExists(_userAddress) returns(bool) {
        return BOCDiamondStorage.getStorage().birthdays[_userAddress].createdAt > 0;
    }

    function birthdayHasGoal(BOCDiamondStorage.Birthday memory _birthday) 
    internal pure returns(bool) {
        return _birthday.goal.createdAt != 0;
    }

    function getBirthday(address _userAddress) 
    internal view whenNoUserExists(_userAddress) returns(BOCDiamondStorage.Birthday memory) {
        require(hasBirthday(_userAddress) == true, "BOC: No Birthday found!");
        return BOCDiamondStorage.getStorage().birthdays[_userAddress];
    }

    function _isValidBirthday(address _userAddress, uint256 _birthdayId) 
    internal view whenNoUserExists(_userAddress) returns (bool) 
    {
        require(hasBirthday(_userAddress), "BOC: No Birthday found!");
        uint256 birthdayCount = getBirthdays(_userAddress).id;
        return _birthdayId <= birthdayCount; 
    }

    function getBirthdays(address _userAdress) 
    internal view whenNoUserExists(_userAdress) returns(BOCDiamondStorage.Birthday memory) {
        require(hasBirthday(_userAdress) == true, "BOC: No Birthday found!");
        return BOCDiamondStorage.getStorage().birthdays[_userAdress];
    }

}