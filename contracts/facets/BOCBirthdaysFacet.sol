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

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract BOCBirthdaysFacet is BOCAccessFacet, BOCBaseFacet  {
    using SafeERC20 for IERC20;

    ///////////////////////////////////////////////////
    //       BOC BIRTHDAY & GOAL FUNCTIONS           //
    ///////////////////////////////////////////////////

    event UserWithdrewEther(address indexed user, uint256 amount, uint256 when);
    event UserWithdrewToken(address indexed user, address indexed token, uint256 amount, uint256 when);
    event BirthdayCreated(address indexed user, uint256 id, uint256 when);
    event GoalCreated(address indexed user, uint256 birthdayId, uint256 when);
    event GoalUpdated(address indexed user, uint256 birthdayId, uint256 when);
    event TimelineCreated(address indexed user,uint256 birthdayId, uint256 when);

    function createBirthday (uint256 _when) 
    public whenNoUserExists(msg.sender)
    {
        uint256 lastBirthdayCount = BOCDiamondStorage.getStorage().birthdays[msg.sender].id;
        BOCDiamondStorage.Birthday storage newBirthday = BOCDiamondStorage.getStorage().birthdays[msg.sender];

        newBirthday.id = lastBirthdayCount;
        newBirthday.when = _when;
        newBirthday.createdAt = block.timestamp;
        createTimeline(newBirthday.id);

        emit BirthdayCreated(msg.sender, lastBirthdayCount, _when);
    }

    function createGoal (uint256 _birthdayId, string memory _desc, uint256 _targetAmount) 
    public whenNoUserExists(msg.sender)
    {
        require(hasBirthday(msg.sender), "BOC: No birthdays found!");
        require(_isValidBirthday(msg.sender, _birthdayId), "BOC: Invalid Birthday ID!");
        BOCDiamondStorage.Birthday storage birthday = BOCDiamondStorage.getStorage().birthdays[msg.sender];
        BOCDiamondStorage.Goal memory newGoal = BOCDiamondStorage.Goal({ 
            createdAt: block.timestamp, 
            description : _desc,  
            targetAmount: _targetAmount,
            amountRaised: 0 
        });
        birthday.goal = newGoal;

        emit GoalCreated(msg.sender, _birthdayId, block.timestamp);
    }

    function updateGoal (uint256 _birthdayId, string memory _desc, uint256 _targetAmount) 
    external whenNoUserExists(msg.sender)
    {
        require(hasBirthday(msg.sender), "BOC: No birthdays found!");
        require(_isValidBirthday(msg.sender, _birthdayId), "BOC: Invalid Birthday ID!");
    
        BOCDiamondStorage.Birthday storage userBirthday = BOCDiamondStorage.getStorage().birthdays[msg.sender];
        BOCDiamondStorage.Goal storage userGoal = userBirthday.goal;
        require(userGoal.amountRaised == userGoal.targetAmount, "BOC: Goal in progress, wait until finished!");

        BOCDiamondStorage.Birthday storage birthday = BOCDiamondStorage.getStorage().birthdays[msg.sender];
        birthday.goal.description = _desc;
        birthday.goal.targetAmount = _targetAmount;

        emit GoalUpdated(msg.sender, _birthdayId, block.timestamp);
    }

    function createBirthdayAndGoal (uint256 _when, string memory _desc, uint256 _targetAmount) 
    external whenNoUserExists(msg.sender)
    {
        createBirthday(_when);
        BOCDiamondStorage.Birthday storage birthday = BOCDiamondStorage.getStorage().birthdays[msg.sender];
        createGoal(birthday.id, _desc, _targetAmount);
    }
 
    function createTimeline (uint256 _birthdayId) 
    public whenNoUserExists(msg.sender)
    {
        BOCDiamondStorage.Birthday storage birthday = BOCDiamondStorage.getStorage().birthdays[msg.sender];
        birthday.timeline.push(BOCDiamondStorage.BirthdayTimeline(block.timestamp));

        emit TimelineCreated(msg.sender, _birthdayId, block.timestamp);
    }

    function userWithdrawEther() external whenNoUserExists(msg.sender) {
        uint256 userBalance = BOCDiamondStorage.getStorage().balances[msg.sender];
        require(userBalance > 0, "BOC: Insufficient funds!");
        BOCDiamondStorage.Birthday storage userBirthday = BOCDiamondStorage.getStorage().birthdays[msg.sender];
        require(userBirthday.goal.amountRaised == userBirthday.goal.targetAmount, "BOC: Denied, until your goal has been achieved, keep sharing, you got this.");
        (bool sent, ) = payable(msg.sender).call{
            value: userBalance
        }("");
        require(sent, "BOC: Transaction failed!");
        BOCDiamondStorage.getStorage().balances[msg.sender] = 0;
        BOCDiamondStorage.getStorage().birthdays[msg.sender].goal.targetAmount = 0;
        BOCDiamondStorage.getStorage().birthdays[msg.sender].goal.amountRaised = 0;
        BOCDiamondStorage.getStorage().birthdays[msg.sender].goal.description = "BOC: Goal Achieved!";
        emit UserWithdrewEther(msg.sender, userBalance, block.timestamp);
    }

    function userWithdrawToken() external whenNoUserExists(msg.sender) {
        uint256 userBalance = BOCDiamondStorage.getStorage().balanceOf[address(BOCDiamondStorage.getStorage()._token)][msg.sender];
        require((userBalance > 0), "BOC: Insufficient BOC funds!");

        BOCDiamondStorage.Birthday storage userBirthday = BOCDiamondStorage.getStorage().birthdays[msg.sender];
        require(userBirthday.goal.amountRaised == userBirthday.goal.targetAmount, "BOC: Denied, until your goal has been achieved, keep sharing, you got this.");

        uint256 actualContractBalance = BOCDiamondStorage.getStorage()._token.balanceOf(address(this));
        require(actualContractBalance >= userBalance, "BOC: Contract liquidity too low for withdrawal. Please try again later.");

        BOCDiamondStorage.getStorage()._token.safeTransfer(msg.sender, userBalance);
        BOCDiamondStorage.getStorage().balanceOf[address(BOCDiamondStorage.getStorage()._token)][msg.sender] = 0;
        BOCDiamondStorage.getStorage().birthdays[msg.sender].goal.targetAmount = 0;
        BOCDiamondStorage.getStorage().birthdays[msg.sender].goal.amountRaised = 0;
        BOCDiamondStorage.getStorage().birthdays[msg.sender].goal.description = "BOC: Goal Achieved!";
        emit UserWithdrewToken(msg.sender, address(BOCDiamondStorage.getStorage()._token), userBalance, block.timestamp);
    }
}