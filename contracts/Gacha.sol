// https://www.youtube.com/watch?v=nZmEI0xKOqA
// 13:30あたりでerc20通貨をerc721コントラクトに送ってmintして、、、みたいな説明をしている

// SPDX-License-Identifier: MIT LICENSE

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/utils/Strings.sol";


pragma solidity ^0.8.0;

contract Gacha is ERC1155, Ownable {
    string baseMetadataURIPrefix;
    string baseMetadataURISuffix;
    using Strings for uint256;

    // SS
    uint256 public constant FUZIN = 9;
    uint256 public constant RAIZIN = 8;
    // S
    uint256 public constant YAMATANOROCHI = 7;
    uint256 public constant KYUBI = 6;
    // A
    uint256 public constant KAMAITACHI = 5;
    uint256 public constant WANYUDO =4;
    uint256 public constant GYUKI = 3;
    // B
    uint256 public constant HANNYA = 2;
    uint256 public constant TENGU = 1;
    uint256 public constant YOKO = 0;

    uint256 randNonce = 0;

    struct TokenInfo {
        IERC20 paytoken;
        uint256[] costvalues;
    }

    TokenInfo[] public AllowedCrypto;

    function addCurrency(
        IERC20 _paytoken,
        uint256[] memory _costvalues
    ) public onlyOwner {
        require(_costvalues.length == 10, "token number is 10.");
        AllowedCrypto.push(
            TokenInfo({
                paytoken: _paytoken,
                costvalues: _costvalues
            })
        );
    }


    uint256[] rankTokenB = [HANNYA,TENGU,YOKO];
    uint256[] rankTokenA = [KAMAITACHI,WANYUDO,GYUKI];
    uint256[] rankTokenS = [YAMATANOROCHI,KYUBI];
    uint256[] rankTokenSS = [FUZIN,RAIZIN];

    uint256[][] public rankedTokens = [
        rankTokenB,rankTokenA,rankTokenS,rankTokenSS
    ];
        string public name;
        string public symbol;
    uint256[] gfcCostvalues;

    constructor() ERC1155("") {

        name = "sample";
        symbol = "SPL";
        baseMetadataURIPrefix = "";
        baseMetadataURISuffix = "";
        uint256 degit = 1000000000000000000;

        // B
        gfcCostvalues.push(10 * degit);
        gfcCostvalues.push(10 * degit);
        gfcCostvalues.push(10 * degit);

        // A
        gfcCostvalues.push(30 * degit);
        gfcCostvalues.push(30 * degit);
        gfcCostvalues.push(30 * degit);

        // S
        gfcCostvalues.push(50 * degit);
        gfcCostvalues.push(50 * degit);


        // SS
        gfcCostvalues.push(100 * degit);
        gfcCostvalues.push(100 * degit);
        IERC20 GFC = IERC20(0x5cEa23FbEEA919DeF8bB6c7410B7947a22a092FC);
        addCurrency(GFC,gfcCostvalues);
    }

    function uri(uint256 _id) public view override returns (string memory) {
        return string(abi.encodePacked(
            baseMetadataURIPrefix,
            Strings.toString(_id),
            baseMetadataURISuffix
        ));
    }
    function ownerMint(uint256 _amount,uint256 _id) public onlyOwner() {
        _mint(msg.sender, _id, _amount, "");
    }

    function publicMint(uint256 _pid,uint256[] memory _ids ,uint256[] memory _amounts) public payable {
        require(!includeRankSS(_ids), "Rank SS token is not able to purchase.");
        //　指定の価格で買えるような実装をする
        uint256 cost = getCost(_pid, _ids,_amounts);
        TokenInfo storage tokens = AllowedCrypto[_pid];
        IERC20 paytoken;
        paytoken = tokens.paytoken;
        uint256 allowCost = paytoken.allowance(msg.sender,address(this));
        require(allowCost >= cost, "Not enough balance to complete transaction.");
        paytoken.transferFrom(msg.sender, address(this), cost);
        _mintBatch(msg.sender, _ids, _amounts, "");
    }

    function getCost(uint256 _pid, uint256[] memory _amounts,uint256[] memory _ids) public view returns (uint256){
        TokenInfo storage tokens = AllowedCrypto[_pid];
        uint256 totalCost = 0;
        uint256[] storage costvalues = tokens.costvalues;
        uint256 length = _amounts.length;
        uint256 i = 0;
        while(i < length){
            uint256 id = _ids[i];
            uint256 amount = _amounts[i];
            uint256 cost = costvalues[id] * amount;
            totalCost += cost;
            i++;
        }
        return totalCost;
    }

    function includeRankSS(uint256[] memory _ids) public view returns (bool){
        uint256 len = _ids.length;
        bool included = true;
        bool notIncluded = false;

        uint256 i = 0;
        while(i < len){
            if(_ids[i] == rankTokenSS[0] || _ids[i] == rankTokenSS[1]){
                return included;
            }
            i++;
        }
        return notIncluded;
    }

    function gachaMint(uint256 _amount) public payable {
        // ここにgfcのtransfer周りの実装を追加する
        uint256 num;
        uint256 id;
        for (uint256 i = 1; i <= _amount; i++) {
            num = getRandomNum(msg.sender);
            id = getId(num);
            uint256 mintAmount = 1;
            _mint(msg.sender, id, mintAmount, "");
        }
    }

    function getId(uint256 _num) public returns (uint256){
        uint256 id = _num % 100;
        if(0 <= id && id < 50){
            uint256 rankB = 0;
            return getRandomFromRank(rankB);
        }else if(50 <= id && id < 80){
            uint256 rankA = 1;
            return getRandomFromRank(rankA);
        }else if(80 <= id && id < 95){
            uint256 rankS = 2;
            return getRandomFromRank(rankS);
        }else if(95 <= id){
            uint256 rankSS = 3;
            return getRandomFromRank(rankSS);
        }
        // require("ERROR in getId function.");
        return 0;
    }

    function getRandomFromRank(uint256 rank) public returns (uint256){
        uint256 len = rankedTokens[rank].length;
        uint256 tokenId = getRandomNum(msg.sender) % len;
        require(rank < rankedTokens.length,"index is over length.");
        return rankedTokens[rank][tokenId];
    }

    function getRandomNum(address _to) public returns (uint256){
        randNonce++;

        uint256 randomNum = uint256(
            keccak256(
                abi.encode(
                    _to,
                    block.timestamp,
                    randNonce
                )
            )
        );
        return randomNum;
    }

    function setBaseMetadataURI(string memory _prefix, string memory _suffix) public onlyOwner(){
        baseMetadataURIPrefix = _prefix;
        baseMetadataURISuffix = _suffix;
    }
    function changeProbabilities(uint256 _pid,uint256 probability) public onlyOwner() {
    // 確率いじれるようにする
    }
    function changeCostvalue(uint256 _pid,uint256 _id,uint256 _newCostvalue) public onlyOwner() {
        AllowedCrypto[_pid].costvalues[_id] =  _newCostvalue;
    }


}
