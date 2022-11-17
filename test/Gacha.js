const {
  time,
  loadFixture,
} = require('@nomicfoundation/hardhat-network-helpers');
const { anyValue } = require('@nomicfoundation/hardhat-chai-matchers/withArgs');
const { solidity } = require('ethereum-waffle');
const { expect } = require('chai');
const { BigNumber } = require('ethers');

describe('Gacha', function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deploySwapFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    const Gacha = await ethers.getContractFactory('Gacha');
    const Swap = await ethers.getContractFactory('Swap');
    const gacha = await Gacha.deploy();
    const gachaAddress = await gacha.address;
    const swap = await Swap.deploy(gachaAddress);

    await gacha.deployed();
    await swap.deployed();

    const swapAddress = await swap.address;
    const ownerAddress = await owner.address;

    // prepare 10 tokens for 12.
    let i = 0;
    const tokenLength = 10;
    const tokenBalance = 13;
    const transferBalance = 1;
    while (i < tokenLength) {
      await gacha.ownerMint(tokenBalance, i);

      await gacha.safeTransferFrom(
        ownerAddress,
        swapAddress,
        i,
        transferBalance,
        '0x'
      );
      i++;
    }
    return { gacha, swap, owner };
  }
  async function deploySwapFixtureOwnerHasNoToken() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    const Gacha = await ethers.getContractFactory('Gacha');
    const Swap = await ethers.getContractFactory('Swap');
    const gacha = await Gacha.deploy();
    const gachaAddress = await gacha.address;
    const swap = await Swap.deploy(gachaAddress);

    await gacha.deployed();
    await swap.deployed();

    const swapAddress = await swap.address;
    const ownerAddress = await owner.address;

    // prepare only 1 token for contract.
    let i = 0;
    const tokenLength = 10;
    const tokenBalance = 1;
    const transferBalance = 1;
    while (i < tokenLength) {
      await gacha.ownerMint(tokenBalance, i);

      await gacha.safeTransferFrom(
        ownerAddress,
        swapAddress,
        i,
        transferBalance,
        '0x'
      );
      i++;
    }
    return { gacha, swap, owner };
  }

  describe('Deployment', function () {
    it('Should set the right name, symbol,token balance', async function () {
      const { gacha, swap, owner } = await loadFixture(deploySwapFixture);

      expect(await gacha.name()).to.equal('sample');
      expect(await gacha.symbol()).to.equal('SPL');

      const swapAddress = await swap.address;
      const ownerAddress = await owner.address;
      const tokenLength = 10;
      let i = 0;

      let balance;
      while (i < tokenLength) {
        // コントラクトに1枚ずつstockが入っているかの確認
        balance = await gacha.balanceOf(swapAddress, i);
        expect(balance.toNumber()).to.equal(1);
        // 交換用に12枚ずつオーナーが所有しているかの確認
        balance = await gacha.balanceOf(ownerAddress, i);
        expect(balance.toNumber()).to.equal(12);
        i++;
      }
      const emakiAddress = await swap.Emaki();
      const gachaAddress = await gacha.address;
      expect(emakiAddress).to.equal(gachaAddress);
    });
  });

  describe('Swaps', function () {
    describe('Success : Single Swap', function () {
      it('swap B->SS', async function () {
        const { gacha, swap, owner } = await loadFixture(deploySwapFixture);
        const swapAddress = await swap.address;
        const ownerAddress = await owner.address;
        let balance;
        // コントラクト 交換前
        balance = await gacha.balanceOf(swapAddress, 0);
        expect(balance.toNumber()).to.equal(1);
        balance = await gacha.balanceOf(swapAddress, 8);
        expect(balance.toNumber()).to.equal(1);
        // オーナー 交換前
        balance = await gacha.balanceOf(ownerAddress, 0);
        expect(balance.toNumber()).to.equal(12);
        balance = await gacha.balanceOf(ownerAddress, 8);
        expect(balance.toNumber()).to.equal(12);
        let res = await gacha.setApprovalForAll(swapAddress, true);
        const approved = await gacha.isApprovedForAll(
          ownerAddress,
          swapAddress
        );
        expect(approved).to.equal(true);

        res = await swap.swap([0], [12], 8);

        // コントラクトが交換したトークンが増えて材料としたトークンが減っているか。
        balance = await gacha.balanceOf(swapAddress, 0);
        expect(balance.toNumber()).to.equal(13);
        balance = await gacha.balanceOf(swapAddress, 8);
        expect(balance.toNumber()).to.equal(0);
        // オーナーが交換したトークンが増えて材料としたトークンが減っているか。
        balance = await gacha.balanceOf(ownerAddress, 0);
        expect(balance.toNumber()).to.equal(0);
        balance = await gacha.balanceOf(ownerAddress, 8);
        expect(balance.toNumber()).to.equal(13);
      });
      it('swap A->SS', async function () {
        const { gacha, swap, owner } = await loadFixture(deploySwapFixture);
        const swapAddress = await swap.address;
        const ownerAddress = await owner.address;
        let balance;
        // コントラクト 交換前
        balance = await gacha.balanceOf(swapAddress, 7);
        expect(balance.toNumber()).to.equal(1);
        balance = await gacha.balanceOf(swapAddress, 8);
        expect(balance.toNumber()).to.equal(1);
        // オーナー 交換前
        balance = await gacha.balanceOf(ownerAddress, 7);
        expect(balance.toNumber()).to.equal(12);
        balance = await gacha.balanceOf(ownerAddress, 8);
        expect(balance.toNumber()).to.equal(12);
        let res = await gacha.setApprovalForAll(swapAddress, true);
        const approved = await gacha.isApprovedForAll(
          ownerAddress,
          swapAddress
        );
        expect(approved).to.equal(true);

        res = await swap.swap([7], [4], 8);

        // コントラクトが交換したトークンが増えて材料としたトークンが減っているか。
        balance = await gacha.balanceOf(swapAddress, 7);
        expect(balance.toNumber()).to.equal(5);
        balance = await gacha.balanceOf(swapAddress, 8);
        expect(balance.toNumber()).to.equal(0);
        // オーナーが交換したトークンが増えて材料としたトークンが減っているか。
        balance = await gacha.balanceOf(ownerAddress, 7);
        expect(balance.toNumber()).to.equal(8);
        balance = await gacha.balanceOf(ownerAddress, 8);
        expect(balance.toNumber()).to.equal(13);
      });
      it('swap S->SS', async function () {
        const { gacha, swap, owner } = await loadFixture(deploySwapFixture);
        const swapAddress = await swap.address;
        const ownerAddress = await owner.address;
        let balance;
        // コントラクト 交換前
        balance = await gacha.balanceOf(swapAddress, 4);
        expect(balance.toNumber()).to.equal(1);
        balance = await gacha.balanceOf(swapAddress, 8);
        expect(balance.toNumber()).to.equal(1);
        // オーナー 交換前
        balance = await gacha.balanceOf(ownerAddress, 4);
        expect(balance.toNumber()).to.equal(12);
        balance = await gacha.balanceOf(ownerAddress, 8);
        expect(balance.toNumber()).to.equal(12);
        let res = await gacha.setApprovalForAll(swapAddress, true);
        const approved = await gacha.isApprovedForAll(
          ownerAddress,
          swapAddress
        );
        expect(approved).to.equal(true);

        res = await swap.swap([4], [2], 8);

        // コントラクトが交換したトークンが増えて材料としたトークンが減っているか。
        balance = await gacha.balanceOf(swapAddress, 4);
        expect(balance.toNumber()).to.equal(3);
        balance = await gacha.balanceOf(swapAddress, 8);
        expect(balance.toNumber()).to.equal(0);
        // オーナーが交換したトークンが増えて材料としたトークンが減っているか。
        balance = await gacha.balanceOf(ownerAddress, 4);
        expect(balance.toNumber()).to.equal(10);
        balance = await gacha.balanceOf(ownerAddress, 8);
        expect(balance.toNumber()).to.equal(13);
      });
      it('swap B->S', async function () {
        const { gacha, swap, owner } = await loadFixture(deploySwapFixture);
        const swapAddress = await swap.address;
        const ownerAddress = await owner.address;
        let balance;
        // コントラクト 交換前
        balance = await gacha.balanceOf(swapAddress, 0);
        expect(balance.toNumber()).to.equal(1);
        balance = await gacha.balanceOf(swapAddress, 4);
        expect(balance.toNumber()).to.equal(1);
        // オーナー 交換前
        balance = await gacha.balanceOf(ownerAddress, 0);
        expect(balance.toNumber()).to.equal(12);
        balance = await gacha.balanceOf(ownerAddress, 4);
        expect(balance.toNumber()).to.equal(12);
        let res = await gacha.setApprovalForAll(swapAddress, true);
        const approved = await gacha.isApprovedForAll(
          ownerAddress,
          swapAddress
        );
        expect(approved).to.equal(true);

        res = await swap.swap([0], [6], 4);

        // コントラクトが交換したトークンが増えて材料としたトークンが減っているか。
        balance = await gacha.balanceOf(swapAddress, 0);
        expect(balance.toNumber()).to.equal(7);
        balance = await gacha.balanceOf(swapAddress, 4);
        expect(balance.toNumber()).to.equal(0);
        // オーナーが交換したトークンが増えて材料としたトークンが減っているか。
        balance = await gacha.balanceOf(ownerAddress, 0);
        expect(balance.toNumber()).to.equal(6);
        balance = await gacha.balanceOf(ownerAddress, 4);
        expect(balance.toNumber()).to.equal(13);
      });
      it('swap A->S', async function () {
        const { gacha, swap, owner } = await loadFixture(deploySwapFixture);
        const swapAddress = await swap.address;
        const ownerAddress = await owner.address;
        let balance;
        // コントラクト 交換前
        balance = await gacha.balanceOf(swapAddress, 7);
        expect(balance.toNumber()).to.equal(1);
        balance = await gacha.balanceOf(swapAddress, 4);
        expect(balance.toNumber()).to.equal(1);
        // オーナー 交換前
        balance = await gacha.balanceOf(ownerAddress, 7);
        expect(balance.toNumber()).to.equal(12);
        balance = await gacha.balanceOf(ownerAddress, 4);
        expect(balance.toNumber()).to.equal(12);
        let res = await gacha.setApprovalForAll(swapAddress, true);
        const approved = await gacha.isApprovedForAll(
          ownerAddress,
          swapAddress
        );
        expect(approved).to.equal(true);

        res = await swap.swap([7], [2], 4);

        // コントラクトが交換したトークンが増えて材料としたトークンが減っているか。
        balance = await gacha.balanceOf(swapAddress, 7);
        expect(balance.toNumber()).to.equal(3);
        balance = await gacha.balanceOf(swapAddress, 4);
        expect(balance.toNumber()).to.equal(0);
        // オーナーが交換したトークンが増えて材料としたトークンが減っているか。
        balance = await gacha.balanceOf(ownerAddress, 7);
        expect(balance.toNumber()).to.equal(10);
        balance = await gacha.balanceOf(ownerAddress, 4);
        expect(balance.toNumber()).to.equal(13);
      });
      it('swap B->A', async function () {
        const { gacha, swap, owner } = await loadFixture(deploySwapFixture);
        const swapAddress = await swap.address;
        const ownerAddress = await owner.address;
        let balance;
        // コントラクト 交換前
        balance = await gacha.balanceOf(swapAddress, 0);
        expect(balance.toNumber()).to.equal(1);
        balance = await gacha.balanceOf(swapAddress, 7);
        expect(balance.toNumber()).to.equal(1);
        // オーナー 交換前
        balance = await gacha.balanceOf(ownerAddress, 0);
        expect(balance.toNumber()).to.equal(12);
        balance = await gacha.balanceOf(ownerAddress, 7);
        expect(balance.toNumber()).to.equal(12);
        let res = await gacha.setApprovalForAll(swapAddress, true);
        const approved = await gacha.isApprovedForAll(
          ownerAddress,
          swapAddress
        );
        expect(approved).to.equal(true);

        res = await swap.swap([0], [3], 7);

        // コントラクトが交換したトークンが増えて材料としたトークンが減っているか。
        balance = await gacha.balanceOf(swapAddress, 0);
        expect(balance.toNumber()).to.equal(4);
        balance = await gacha.balanceOf(swapAddress, 7);
        expect(balance.toNumber()).to.equal(0);
        // オーナーが交換したトークンが増えて材料としたトークンが減っているか。
        balance = await gacha.balanceOf(ownerAddress, 0);
        expect(balance.toNumber()).to.equal(9);
        balance = await gacha.balanceOf(ownerAddress, 7);
        expect(balance.toNumber()).to.equal(13);
      });
    });

    describe('Failed : Single Swap', function () {
      describe('Not enough token values', function () {
        it('swap B->SS', async function () {
          const { gacha, swap, owner } = await loadFixture(deploySwapFixture);
          const swapAddress = await swap.address;
          const ownerAddress = await owner.address;
          let balance;
          // コントラクト 交換前
          balance = await gacha.balanceOf(swapAddress, 0);
          expect(balance.toNumber()).to.equal(1);
          balance = await gacha.balanceOf(swapAddress, 8);
          expect(balance.toNumber()).to.equal(1);
          // オーナー 交換前
          balance = await gacha.balanceOf(ownerAddress, 0);
          expect(balance.toNumber()).to.equal(12);
          balance = await gacha.balanceOf(ownerAddress, 8);
          expect(balance.toNumber()).to.equal(12);

          let res = await gacha.setApprovalForAll(swapAddress, true);

          const approved = await gacha.isApprovedForAll(
            ownerAddress,
            swapAddress
          );
          expect(approved).to.equal(true);

          await expect(swap.swap([0], [11], 8)).to.revertedWith(
            'Not enough token values to complete transaction'
          );

          // コントラクトが交換したトークンが増えて材料としたトークンが減っているか。
          balance = await gacha.balanceOf(swapAddress, 0);
          expect(balance.toNumber()).to.equal(1);
          balance = await gacha.balanceOf(swapAddress, 8);
          expect(balance.toNumber()).to.equal(1);
          // オーナーが交換したトークンが増えて材料としたトークンが減っているか。
          balance = await gacha.balanceOf(ownerAddress, 0);
          expect(balance.toNumber()).to.equal(12);
          balance = await gacha.balanceOf(ownerAddress, 8);
          expect(balance.toNumber()).to.equal(12);
        });
        it('swap A->SS', async function () {
          const { gacha, swap, owner } = await loadFixture(deploySwapFixture);
          const swapAddress = await swap.address;
          const ownerAddress = await owner.address;
          let balance;
          // コントラクト 交換前
          balance = await gacha.balanceOf(swapAddress, 7);
          expect(balance.toNumber()).to.equal(1);
          balance = await gacha.balanceOf(swapAddress, 8);
          expect(balance.toNumber()).to.equal(1);
          // オーナー 交換前
          balance = await gacha.balanceOf(ownerAddress, 7);
          expect(balance.toNumber()).to.equal(12);
          balance = await gacha.balanceOf(ownerAddress, 8);
          expect(balance.toNumber()).to.equal(12);
          let res = await gacha.setApprovalForAll(swapAddress, true);
          const approved = await gacha.isApprovedForAll(
            ownerAddress,
            swapAddress
          );
          expect(approved).to.equal(true);

          await expect(swap.swap([7], [3], 8)).to.revertedWith(
            'Not enough token values to complete transaction'
          );

          // コントラクトが交換したトークンが増えて材料としたトークンが減っているか。
          balance = await gacha.balanceOf(swapAddress, 7);
          expect(balance.toNumber()).to.equal(1);
          balance = await gacha.balanceOf(swapAddress, 8);
          expect(balance.toNumber()).to.equal(1);
          // オーナーが交換したトークンが増えて材料としたトークンが減っているか。
          balance = await gacha.balanceOf(ownerAddress, 7);
          expect(balance.toNumber()).to.equal(12);
          balance = await gacha.balanceOf(ownerAddress, 8);
          expect(balance.toNumber()).to.equal(12);
        });
        it('swap S->SS', async function () {
          const { gacha, swap, owner } = await loadFixture(deploySwapFixture);
          const swapAddress = await swap.address;
          const ownerAddress = await owner.address;
          let balance;
          // コントラクト 交換前
          balance = await gacha.balanceOf(swapAddress, 4);
          expect(balance.toNumber()).to.equal(1);
          balance = await gacha.balanceOf(swapAddress, 8);
          expect(balance.toNumber()).to.equal(1);
          // オーナー 交換前
          balance = await gacha.balanceOf(ownerAddress, 4);
          expect(balance.toNumber()).to.equal(12);
          balance = await gacha.balanceOf(ownerAddress, 8);
          expect(balance.toNumber()).to.equal(12);
          let res = await gacha.setApprovalForAll(swapAddress, true);
          const approved = await gacha.isApprovedForAll(
            ownerAddress,
            swapAddress
          );
          expect(approved).to.equal(true);

          await expect(swap.swap([4], [1], 8)).to.revertedWith(
            'Not enough token values to complete transaction'
          );

          // コントラクトが交換したトークンが増えて材料としたトークンが減っているか。
          balance = await gacha.balanceOf(swapAddress, 4);
          expect(balance.toNumber()).to.equal(1);
          balance = await gacha.balanceOf(swapAddress, 8);
          expect(balance.toNumber()).to.equal(1);
          // オーナーが交換したトークンが増えて材料としたトークンが減っているか。
          balance = await gacha.balanceOf(ownerAddress, 4);
          expect(balance.toNumber()).to.equal(12);
          balance = await gacha.balanceOf(ownerAddress, 8);
          expect(balance.toNumber()).to.equal(12);
        });
        it('swap B->S', async function () {
          const { gacha, swap, owner } = await loadFixture(deploySwapFixture);
          const swapAddress = await swap.address;
          const ownerAddress = await owner.address;
          let balance;
          // コントラクト 交換前
          balance = await gacha.balanceOf(swapAddress, 0);
          expect(balance.toNumber()).to.equal(1);
          balance = await gacha.balanceOf(swapAddress, 4);
          expect(balance.toNumber()).to.equal(1);
          // オーナー 交換前
          balance = await gacha.balanceOf(ownerAddress, 0);
          expect(balance.toNumber()).to.equal(12);
          balance = await gacha.balanceOf(ownerAddress, 4);
          expect(balance.toNumber()).to.equal(12);
          let res = await gacha.setApprovalForAll(swapAddress, true);
          const approved = await gacha.isApprovedForAll(
            ownerAddress,
            swapAddress
          );
          expect(approved).to.equal(true);

          await expect(swap.swap([0], [5], 4)).to.revertedWith(
            'Not enough token values to complete transaction'
          );

          // コントラクトが交換したトークンが増えて材料としたトークンが減っているか。
          balance = await gacha.balanceOf(swapAddress, 0);
          expect(balance.toNumber()).to.equal(1);
          balance = await gacha.balanceOf(swapAddress, 4);
          expect(balance.toNumber()).to.equal(1);
          // オーナーが交換したトークンが増えて材料としたトークンが減っているか。
          balance = await gacha.balanceOf(ownerAddress, 0);
          expect(balance.toNumber()).to.equal(12);
          balance = await gacha.balanceOf(ownerAddress, 4);
          expect(balance.toNumber()).to.equal(12);
        });
        it('swap A->S', async function () {
          const { gacha, swap, owner } = await loadFixture(deploySwapFixture);
          const swapAddress = await swap.address;
          const ownerAddress = await owner.address;
          let balance;
          // コントラクト 交換前
          balance = await gacha.balanceOf(swapAddress, 7);
          expect(balance.toNumber()).to.equal(1);
          balance = await gacha.balanceOf(swapAddress, 4);
          expect(balance.toNumber()).to.equal(1);
          // オーナー 交換前
          balance = await gacha.balanceOf(ownerAddress, 7);
          expect(balance.toNumber()).to.equal(12);
          balance = await gacha.balanceOf(ownerAddress, 4);
          expect(balance.toNumber()).to.equal(12);
          let res = await gacha.setApprovalForAll(swapAddress, true);
          const approved = await gacha.isApprovedForAll(
            ownerAddress,
            swapAddress
          );
          expect(approved).to.equal(true);

          await expect(swap.swap([7], [1], 4)).to.revertedWith(
            'Not enough token values to complete transaction'
          );

          // コントラクトが交換したトークンが増えて材料としたトークンが減っているか。
          balance = await gacha.balanceOf(swapAddress, 7);
          expect(balance.toNumber()).to.equal(1);
          balance = await gacha.balanceOf(swapAddress, 4);
          expect(balance.toNumber()).to.equal(1);
          // オーナーが交換したトークンが増えて材料としたトークンが減っているか。
          balance = await gacha.balanceOf(ownerAddress, 7);
          expect(balance.toNumber()).to.equal(12);
          balance = await gacha.balanceOf(ownerAddress, 4);
          expect(balance.toNumber()).to.equal(12);
        });
        it('swap B->A', async function () {
          const { gacha, swap, owner } = await loadFixture(deploySwapFixture);
          const swapAddress = await swap.address;
          const ownerAddress = await owner.address;
          let balance;
          // コントラクト 交換前
          balance = await gacha.balanceOf(swapAddress, 0);
          expect(balance.toNumber()).to.equal(1);
          balance = await gacha.balanceOf(swapAddress, 7);
          expect(balance.toNumber()).to.equal(1);
          // オーナー 交換前
          balance = await gacha.balanceOf(ownerAddress, 0);
          expect(balance.toNumber()).to.equal(12);
          balance = await gacha.balanceOf(ownerAddress, 7);
          expect(balance.toNumber()).to.equal(12);
          let res = await gacha.setApprovalForAll(swapAddress, true);
          const approved = await gacha.isApprovedForAll(
            ownerAddress,
            swapAddress
          );
          expect(approved).to.equal(true);

          await expect(swap.swap([0], [2], 7)).to.revertedWith(
            'Not enough token values to complete transaction'
          );

          // コントラクトが交換したトークンが増えて材料としたトークンが減っているか。
          balance = await gacha.balanceOf(swapAddress, 0);
          expect(balance.toNumber()).to.equal(1);
          balance = await gacha.balanceOf(swapAddress, 7);
          expect(balance.toNumber()).to.equal(1);
          // オーナーが交換したトークンが増えて材料としたトークンが減っているか。
          balance = await gacha.balanceOf(ownerAddress, 0);
          expect(balance.toNumber()).to.equal(12);
          balance = await gacha.balanceOf(ownerAddress, 7);
          expect(balance.toNumber()).to.equal(12);
        });
      });
      describe('not approved', function () {
        it('swap B -> SS', async function () {
          const { gacha, swap, owner } = await loadFixture(deploySwapFixture);
          const swapAddress = await swap.address;
          const ownerAddress = await owner.address;
          let balance;
          // コントラクト 交換前
          balance = await gacha.balanceOf(swapAddress, 0);
          expect(balance.toNumber()).to.equal(1);
          balance = await gacha.balanceOf(swapAddress, 8);
          expect(balance.toNumber()).to.equal(1);
          // オーナー 交換前
          balance = await gacha.balanceOf(ownerAddress, 0);
          expect(balance.toNumber()).to.equal(12);
          balance = await gacha.balanceOf(ownerAddress, 8);
          expect(balance.toNumber()).to.equal(12);

          // for not approved, this code is comment out.
          // let res = await gacha.setApprovalForAll(swapAddress, true);

          const approved = await gacha.isApprovedForAll(
            ownerAddress,
            swapAddress
          );
          expect(approved).to.equal(false);

          await expect(swap.swap([0], [12], 8)).to.revertedWith('Not allowed');

          // コントラクトが交換したトークンが増えて材料としたトークンが減っているか。
          balance = await gacha.balanceOf(swapAddress, 0);
          expect(balance.toNumber()).to.equal(1);
          balance = await gacha.balanceOf(swapAddress, 8);
          expect(balance.toNumber()).to.equal(1);
          // オーナーが交換したトークンが増えて材料としたトークンが減っているか。
          balance = await gacha.balanceOf(ownerAddress, 0);
          expect(balance.toNumber()).to.equal(12);
          balance = await gacha.balanceOf(ownerAddress, 8);
          expect(balance.toNumber()).to.equal(12);
        });
      });
    });

    describe('Success : Multi Rank Swap', function () {
      it('swap B + A -> SS', async function () {
        const { gacha, swap, owner } = await loadFixture(deploySwapFixture);
        const swapAddress = await swap.address;
        const ownerAddress = await owner.address;
        let balance;
        // コントラクト 交換前
        balance = await gacha.balanceOf(swapAddress, 0);
        expect(balance.toNumber()).to.equal(1);
        balance = await gacha.balanceOf(swapAddress, 7);
        expect(balance.toNumber()).to.equal(1);
        balance = await gacha.balanceOf(swapAddress, 8);
        expect(balance.toNumber()).to.equal(1);
        // オーナー 交換前
        balance = await gacha.balanceOf(ownerAddress, 0);
        expect(balance.toNumber()).to.equal(12);
        balance = await gacha.balanceOf(ownerAddress, 7);
        expect(balance.toNumber()).to.equal(12);
        balance = await gacha.balanceOf(ownerAddress, 8);
        expect(balance.toNumber()).to.equal(12);
        let res = await gacha.setApprovalForAll(swapAddress, true);
        const approved = await gacha.isApprovedForAll(
          ownerAddress,
          swapAddress
        );
        expect(approved).to.equal(true);

        res = await swap.swap([0, 7], [6, 2], 8);

        // コントラクトが交換したトークンが増えて材料としたトークンが減っているか。
        balance = await gacha.balanceOf(swapAddress, 0);
        expect(balance.toNumber()).to.equal(7);
        balance = await gacha.balanceOf(swapAddress, 7);
        expect(balance.toNumber()).to.equal(3);
        balance = await gacha.balanceOf(swapAddress, 8);
        expect(balance.toNumber()).to.equal(0);
        // オーナーが交換したトークンが増えて材料としたトークンが減っているか。
        balance = await gacha.balanceOf(ownerAddress, 0);
        expect(balance.toNumber()).to.equal(6);
        balance = await gacha.balanceOf(ownerAddress, 7);
        expect(balance.toNumber()).to.equal(10);
        balance = await gacha.balanceOf(ownerAddress, 8);
        expect(balance.toNumber()).to.equal(13);
      });
      it('swap A + S -> SS', async function () {
        const { gacha, swap, owner } = await loadFixture(deploySwapFixture);
        const swapAddress = await swap.address;
        const ownerAddress = await owner.address;
        let balance;
        // コントラクト 交換前
        balance = await gacha.balanceOf(swapAddress, 7);
        expect(balance.toNumber()).to.equal(1);
        balance = await gacha.balanceOf(swapAddress, 4);
        expect(balance.toNumber()).to.equal(1);
        balance = await gacha.balanceOf(swapAddress, 8);
        expect(balance.toNumber()).to.equal(1);
        // オーナー 交換前
        balance = await gacha.balanceOf(ownerAddress, 7);
        expect(balance.toNumber()).to.equal(12);
        balance = await gacha.balanceOf(ownerAddress, 4);
        expect(balance.toNumber()).to.equal(12);
        balance = await gacha.balanceOf(ownerAddress, 8);
        expect(balance.toNumber()).to.equal(12);
        let res = await gacha.setApprovalForAll(swapAddress, true);
        const approved = await gacha.isApprovedForAll(
          ownerAddress,
          swapAddress
        );
        expect(approved).to.equal(true);

        res = await swap.swap([7, 4], [2, 1], 8);

        // コントラクトが交換したトークンが増えて材料としたトークンが減っているか。
        balance = await gacha.balanceOf(swapAddress, 7);
        expect(balance.toNumber()).to.equal(3);
        balance = await gacha.balanceOf(swapAddress, 4);
        expect(balance.toNumber()).to.equal(2);
        balance = await gacha.balanceOf(swapAddress, 8);
        expect(balance.toNumber()).to.equal(0);
        // オーナーが交換したトークンが増えて材料としたトークンが減っているか。
        balance = await gacha.balanceOf(ownerAddress, 7);
        expect(balance.toNumber()).to.equal(10);
        balance = await gacha.balanceOf(ownerAddress, 4);
        expect(balance.toNumber()).to.equal(11);
        balance = await gacha.balanceOf(ownerAddress, 8);
        expect(balance.toNumber()).to.equal(13);
      });
      it('swap B + A -> S', async function () {
        const { gacha, swap, owner } = await loadFixture(deploySwapFixture);
        const swapAddress = await swap.address;
        const ownerAddress = await owner.address;
        let balance;
        // コントラクト 交換前
        balance = await gacha.balanceOf(swapAddress, 0);
        expect(balance.toNumber()).to.equal(1);
        balance = await gacha.balanceOf(swapAddress, 7);
        expect(balance.toNumber()).to.equal(1);
        balance = await gacha.balanceOf(swapAddress, 4);
        expect(balance.toNumber()).to.equal(1);
        // オーナー 交換前
        balance = await gacha.balanceOf(ownerAddress, 0);
        expect(balance.toNumber()).to.equal(12);
        balance = await gacha.balanceOf(ownerAddress, 7);
        expect(balance.toNumber()).to.equal(12);
        balance = await gacha.balanceOf(ownerAddress, 4);
        expect(balance.toNumber()).to.equal(12);
        let res = await gacha.setApprovalForAll(swapAddress, true);
        const approved = await gacha.isApprovedForAll(
          ownerAddress,
          swapAddress
        );
        expect(approved).to.equal(true);

        res = await swap.swap([0, 7], [3, 1], 4);

        // コントラクトが交換したトークンが増えて材料としたトークンが減っているか。
        balance = await gacha.balanceOf(swapAddress, 0);
        expect(balance.toNumber()).to.equal(4);
        balance = await gacha.balanceOf(swapAddress, 7);
        expect(balance.toNumber()).to.equal(2);
        balance = await gacha.balanceOf(swapAddress, 4);
        expect(balance.toNumber()).to.equal(0);
        // オーナーが交換したトークンが増えて材料としたトークンが減っているか。
        balance = await gacha.balanceOf(ownerAddress, 0);
        expect(balance.toNumber()).to.equal(9);
        balance = await gacha.balanceOf(ownerAddress, 7);
        expect(balance.toNumber()).to.equal(11);
        balance = await gacha.balanceOf(ownerAddress, 4);
        expect(balance.toNumber()).to.equal(13);
      });
    });

    describe('Failed : Multi Rank Swap', function () {
      describe('Not enough token values', function () {
        it('swap B + A -> SS', async function () {
          const { gacha, swap, owner } = await loadFixture(deploySwapFixture);
          const swapAddress = await swap.address;
          const ownerAddress = await owner.address;
          let balance;
          // コントラクト 交換前
          balance = await gacha.balanceOf(swapAddress, 0);
          expect(balance.toNumber()).to.equal(1);
          balance = await gacha.balanceOf(swapAddress, 7);
          expect(balance.toNumber()).to.equal(1);
          balance = await gacha.balanceOf(swapAddress, 8);
          expect(balance.toNumber()).to.equal(1);
          // オーナー 交換前
          balance = await gacha.balanceOf(ownerAddress, 0);
          expect(balance.toNumber()).to.equal(12);
          balance = await gacha.balanceOf(ownerAddress, 7);
          expect(balance.toNumber()).to.equal(12);
          balance = await gacha.balanceOf(ownerAddress, 8);
          expect(balance.toNumber()).to.equal(12);
          let res = await gacha.setApprovalForAll(swapAddress, true);
          const approved = await gacha.isApprovedForAll(
            ownerAddress,
            swapAddress
          );
          expect(approved).to.equal(true);

          await expect(swap.swap([0, 7], [5, 2], 8)).to.revertedWith(
            'Not enough token values to complete transaction'
          );

          // コントラクトが交換したトークンが増えて材料としたトークンが減っているか。
          balance = await gacha.balanceOf(swapAddress, 0);
          expect(balance.toNumber()).to.equal(1);
          balance = await gacha.balanceOf(swapAddress, 7);
          expect(balance.toNumber()).to.equal(1);
          balance = await gacha.balanceOf(swapAddress, 8);
          expect(balance.toNumber()).to.equal(1);
          // オーナーが交換したトークンが増えて材料としたトークンが減っているか。
          balance = await gacha.balanceOf(ownerAddress, 0);
          expect(balance.toNumber()).to.equal(12);
          balance = await gacha.balanceOf(ownerAddress, 7);
          expect(balance.toNumber()).to.equal(12);
          balance = await gacha.balanceOf(ownerAddress, 8);
          expect(balance.toNumber()).to.equal(12);
        });
        it('swap A + S -> SS', async function () {
          const { gacha, swap, owner } = await loadFixture(deploySwapFixture);
          const swapAddress = await swap.address;
          const ownerAddress = await owner.address;
          let balance;
          // コントラクト 交換前
          balance = await gacha.balanceOf(swapAddress, 7);
          expect(balance.toNumber()).to.equal(1);
          balance = await gacha.balanceOf(swapAddress, 4);
          expect(balance.toNumber()).to.equal(1);
          balance = await gacha.balanceOf(swapAddress, 8);
          expect(balance.toNumber()).to.equal(1);
          // オーナー 交換前
          balance = await gacha.balanceOf(ownerAddress, 7);
          expect(balance.toNumber()).to.equal(12);
          balance = await gacha.balanceOf(ownerAddress, 4);
          expect(balance.toNumber()).to.equal(12);
          balance = await gacha.balanceOf(ownerAddress, 8);
          expect(balance.toNumber()).to.equal(12);
          let res = await gacha.setApprovalForAll(swapAddress, true);
          const approved = await gacha.isApprovedForAll(
            ownerAddress,
            swapAddress
          );
          expect(approved).to.equal(true);

          await expect(swap.swap([7, 4], [1, 1], 8)).to.revertedWith(
            'Not enough token values to complete transaction'
          );
          // コントラクトが交換したトークンが増えて材料としたトークンが減っているか。
          balance = await gacha.balanceOf(swapAddress, 7);
          expect(balance.toNumber()).to.equal(1);
          balance = await gacha.balanceOf(swapAddress, 4);
          expect(balance.toNumber()).to.equal(1);
          balance = await gacha.balanceOf(swapAddress, 8);
          expect(balance.toNumber()).to.equal(1);
          // オーナーが交換したトークンが増えて材料としたトークンが減っているか。
          balance = await gacha.balanceOf(ownerAddress, 7);
          expect(balance.toNumber()).to.equal(12);
          balance = await gacha.balanceOf(ownerAddress, 4);
          expect(balance.toNumber()).to.equal(12);
          balance = await gacha.balanceOf(ownerAddress, 8);
          expect(balance.toNumber()).to.equal(12);
        });
        it('swap B + A -> S', async function () {
          const { gacha, swap, owner } = await loadFixture(deploySwapFixture);
          const swapAddress = await swap.address;
          const ownerAddress = await owner.address;
          let balance;
          // コントラクト 交換前
          balance = await gacha.balanceOf(swapAddress, 0);
          expect(balance.toNumber()).to.equal(1);
          balance = await gacha.balanceOf(swapAddress, 7);
          expect(balance.toNumber()).to.equal(1);
          balance = await gacha.balanceOf(swapAddress, 4);
          expect(balance.toNumber()).to.equal(1);
          // オーナー 交換前
          balance = await gacha.balanceOf(ownerAddress, 0);
          expect(balance.toNumber()).to.equal(12);
          balance = await gacha.balanceOf(ownerAddress, 7);
          expect(balance.toNumber()).to.equal(12);
          balance = await gacha.balanceOf(ownerAddress, 4);
          expect(balance.toNumber()).to.equal(12);
          let res = await gacha.setApprovalForAll(swapAddress, true);
          const approved = await gacha.isApprovedForAll(
            ownerAddress,
            swapAddress
          );
          expect(approved).to.equal(true);

          await expect(swap.swap([0, 7], [2, 1], 4)).to.revertedWith(
            'Not enough token values to complete transaction'
          );

          // コントラクトが交換したトークンが増えて材料としたトークンが減っているか。
          balance = await gacha.balanceOf(swapAddress, 0);
          expect(balance.toNumber()).to.equal(1);
          balance = await gacha.balanceOf(swapAddress, 7);
          expect(balance.toNumber()).to.equal(1);
          balance = await gacha.balanceOf(swapAddress, 4);
          expect(balance.toNumber()).to.equal(1);
          // オーナーが交換したトークンが増えて材料としたトークンが減っているか。
          balance = await gacha.balanceOf(ownerAddress, 0);
          expect(balance.toNumber()).to.equal(12);
          balance = await gacha.balanceOf(ownerAddress, 7);
          expect(balance.toNumber()).to.equal(12);
          balance = await gacha.balanceOf(ownerAddress, 4);
          expect(balance.toNumber()).to.equal(12);
        });
      });
      describe('not approved', function () {
        it('swap B + A -> SS', async function () {
          const { gacha, swap, owner } = await loadFixture(deploySwapFixture);
          const swapAddress = await swap.address;
          const ownerAddress = await owner.address;
          let balance;
          // コントラクト 交換前
          balance = await gacha.balanceOf(swapAddress, 0);
          expect(balance.toNumber()).to.equal(1);
          balance = await gacha.balanceOf(swapAddress, 7);
          expect(balance.toNumber()).to.equal(1);
          balance = await gacha.balanceOf(swapAddress, 8);
          expect(balance.toNumber()).to.equal(1);
          // オーナー 交換前
          balance = await gacha.balanceOf(ownerAddress, 0);
          expect(balance.toNumber()).to.equal(12);
          balance = await gacha.balanceOf(ownerAddress, 7);
          expect(balance.toNumber()).to.equal(12);
          balance = await gacha.balanceOf(ownerAddress, 8);
          expect(balance.toNumber()).to.equal(12);

          // for not approved, this code is comment out.
          // let res = await gacha.setApprovalForAll(swapAddress, true);

          const approved = await gacha.isApprovedForAll(
            ownerAddress,
            swapAddress
          );
          expect(approved).to.equal(false);

          await expect(swap.swap([0, 7], [6, 2], 8)).to.revertedWith(
            'Not allowed'
          );

          // コントラクトが交換したトークンが増えて材料としたトークンが減っているか。
          balance = await gacha.balanceOf(swapAddress, 0);
          expect(balance.toNumber()).to.equal(1);
          balance = await gacha.balanceOf(swapAddress, 7);
          expect(balance.toNumber()).to.equal(1);
          balance = await gacha.balanceOf(swapAddress, 8);
          expect(balance.toNumber()).to.equal(1);
          // オーナーが交換したトークンが増えて材料としたトークンが減っているか。
          balance = await gacha.balanceOf(ownerAddress, 0);
          expect(balance.toNumber()).to.equal(12);
          balance = await gacha.balanceOf(ownerAddress, 7);
          expect(balance.toNumber()).to.equal(12);
          balance = await gacha.balanceOf(ownerAddress, 8);
          expect(balance.toNumber()).to.equal(12);
        });
      });
    });
    describe('Failed : Multi Rank Swap', function () {
      describe('user has no token for swap', function () {
        it('swap B -> SS', async function () {
          const { gacha, swap, owner } = await loadFixture(
            deploySwapFixtureOwnerHasNoToken
          );
          const swapAddress = await swap.address;
          const ownerAddress = await owner.address;
          let balance;
          // コントラクト 交換前
          balance = await gacha.balanceOf(swapAddress, 0);
          expect(balance.toNumber()).to.equal(1);
          balance = await gacha.balanceOf(swapAddress, 8);
          expect(balance.toNumber()).to.equal(1);
          // オーナー 交換前
          balance = await gacha.balanceOf(ownerAddress, 0);
          expect(balance.toNumber()).to.equal(0);
          balance = await gacha.balanceOf(ownerAddress, 8);
          expect(balance.toNumber()).to.equal(0);

          let res = await gacha.setApprovalForAll(swapAddress, true);

          const approved = await gacha.isApprovedForAll(
            ownerAddress,
            swapAddress
          );
          expect(approved).to.equal(true);

          await expect(swap.swap([0], [12], 8)).to.revertedWith(
            'ERC1155: insufficient balance for transfer'
          );

          // コントラクトが交換したトークンが増えて材料としたトークンが減っているか。
          balance = await gacha.balanceOf(swapAddress, 0);
          expect(balance.toNumber()).to.equal(1);
          balance = await gacha.balanceOf(swapAddress, 8);
          expect(balance.toNumber()).to.equal(1);
          // オーナーが交換したトークンが増えて材料としたトークンが減っているか。
          balance = await gacha.balanceOf(ownerAddress, 0);
          expect(balance.toNumber()).to.equal(0);
          balance = await gacha.balanceOf(ownerAddress, 8);
          expect(balance.toNumber()).to.equal(0);
        });
      });
    });

    describe('Validations', function () {
      it('value check should true', async function () {
        const { gacha, swap, owner } = await loadFixture(deploySwapFixture);
        const res = await swap.valueCheck([0], [12], 8);

        expect(res).to.equal(true);
      });
      it('value check should false', async function () {
        const { gacha, swap, owner } = await loadFixture(deploySwapFixture);
        const res = await swap.valueCheck([0], [11], 8);

        expect(res).to.equal(false);
      });
      it('allowanceCheck should true', async function () {
        const { gacha, swap, owner } = await loadFixture(deploySwapFixture);
        const swapAddress = await swap.address;

        await gacha.setApprovalForAll(swapAddress, true);
        const res = await swap.allowanceCheck();

        expect(res).to.equal(true);
      });
    });
  });
});
