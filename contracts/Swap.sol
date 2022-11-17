// https://www.youtube.com/watch?v=nZmEI0xKOqA
// 13:30あたりでerc20通貨をerc721コントラクトに送ってmintして、、、みたいな説明をしている

// SPDX-License-Identifier: MIT LICENSE

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";

pragma solidity ^0.8.0;

contract Swap is  ERC1155Holder, Ownable{
ERC1155 public Emaki;
    constructor(address emakiAddress){
    // ERC1155 Emaki = ERC1155(0x5cEa23FbEEA919DeF8bB6c7410B7947a22a092FC);
    // ERC1155 Emaki = ERC1155(/**ここにコントラクトアドレス入れる*/);
        Emaki = ERC1155(emakiAddress);
    }

    // SS
    uint256 public constant FUZIN = 9;
    uint256 public constant RAIZIN = 8;
    // S
    uint256 public constant YAMATANOROCHI = 4;
    uint256 public constant KYUBI = 6;
    // A
    uint256 public constant KAMAITACHI = 2;
    uint256 public constant WANYUDO =1;
    uint256 public constant GYUKI = 7;
    // B
    uint256 public constant HANNYA = 3;
    uint256 public constant TENGU = 0;
    uint256 public constant YOKO = 5;

    uint256[] public tokenValues = [
        1,3,3,1,6,1,6,3,12,12
    ];

    function swap(uint256[] memory _fromIds, uint256[] memory _amounts, uint256 _toId) public {
        require(valueCheck(_fromIds, _amounts, _toId), "Not enough token values to complete transaction");
        require(allowanceCheck(), "Not allowed");
        Emaki.safeBatchTransferFrom(msg.sender, address(this), _fromIds, _amounts,"");
        Emaki.safeTransferFrom(address(this), msg.sender, _toId, 1,"");
    }

    function valueCheck(uint256[] memory _fromIds, uint256[] memory _amounts,uint256 _toId) public view returns (bool){
        uint256 len = _fromIds.length;
        uint256 i = 0;
        uint256 fromValue = 0;
        uint256 tokenId;
        uint256 value;

        while(i < len){
            tokenId = _fromIds[i];
            value = tokenValues[tokenId] * _amounts[i];
            fromValue += value;
            i++;
        }
        uint256 toValue = tokenValues[_toId];
        if (toValue <= fromValue){
            return true;
        }
        return false;
    }

    function allowanceCheck() public view returns (bool){
        bool isApproved = Emaki.isApprovedForAll(msg.sender, address(this));
        return isApproved;
    }

    function changeValues(uint256 _pid, uint256 _newValue) public {
        tokenValues[_pid] = _newValue;
    }

    function addValues(uint256 _newValue) public {
        tokenValues.push(_newValue);
    }

}
