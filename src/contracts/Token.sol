pragma solidity^0.5.16;

contract Token {
    string public name = "Queer Token";
    string public symbol = "QUEER";
    uint256 public decimals = 18;
    uint256 public totalSupply;

    constructor() public {
        totalSupply = 69420 * (10 ** decimals);
    }
}