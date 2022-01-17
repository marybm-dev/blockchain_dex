pragma solidity ^0.5.16;
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

import "./Token.sol";

/**
TODO:
[x] Set the fee account
[x] Deposit Ether
[ ] Withdraw Ether
[x] Deposit tokens
[ ] Withdraw tokens
[ ] Check balances
[ ] Make order
[ ] Cancel order
[ ] Fill order
[ ] Charge fees
 */

contract Exchange {
    using SafeMath for uint;

    // variables
    address public feeAccount; // the account that receives exchange fees
    uint256 public feePercent; // the fee percentage
    address constant ETHER = address(0); // store Ether in tokens mapping with blank address

    // token address maps to user's balance
    mapping(address => mapping(address => uint256)) public tokens;

    // events
    event Deposit(address token, address user, uint256 amount, uint256 balance);

    constructor(address _feeAccount, uint256 _feePercent) public {
        feeAccount = _feeAccount;
        feePercent = _feePercent;
    }

    // Fallback: reverts if Ether is sent to this smart contract by mistake
    function() external {
        revert();
    }

    function depositEther() payable public {
        tokens[ETHER][msg.sender] = tokens[ETHER][msg.sender].add(msg.value);
        emit Deposit(ETHER, msg.sender, msg.value, tokens[ETHER][msg.sender]);
    }

    function depositToken(address _token, uint _amount) public {
        require(_token != ETHER);
        require(Token(_token).transferFrom(msg.sender, address(this), _amount));
        tokens[_token][msg.sender] = tokens[_token][msg.sender].add(_amount);
        emit Deposit(_token, msg.sender, _amount, tokens[_token][msg.sender]);
    }
}

