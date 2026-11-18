// Security test-suite for the quorum-verified settlement path (paper Section VI-E).
// Run with:  cd blockchain && npx hardhat test
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

const ONE = 10n ** 18n;
const MIN_STAKE = 100n * ONE;      // S_min = 100 JLT
const SLASH_BPS = 5000n;           // lambda = 50 %
const RATED_W = 5000n;             // 5 kW inverter
const DT = 60n;                    // seconds  -> bound = 300 kJ at kappa = 1

async function deployAll(nOracles, stakeEach = 150n * ONE) {
  const signers = await ethers.getSigners();
  const [owner, treasury, producer, attacker] = signers;
  const oracles = signers.slice(4, 4 + nOracles);

  const Token = await ethers.getContractFactory("JouletToken");
  const token = await Token.deploy();
  await token.waitForDeployment();

  const Registry = await ethers.getContractFactory("OracleRegistry");
  const registry = await Registry.deploy(await token.getAddress(), treasury.address, MIN_STAKE, SLASH_BPS);
  await registry.waitForDeployment();

  await token.setRegistry(await registry.getAddress());
  await registry.setSettlement(await token.getAddress());
  await token.registerDevice(producer.address, RATED_W);

  for (const o of oracles) {
    await token.transfer(o.address, stakeEach);
    await token.connect(o).approve(await registry.getAddress(), stakeEach);
    await registry.connect(o).stake(stakeEach);
  }
  return { token, registry, owner, treasury, producer, attacker, oracles };
}

let nonceCounter = 0n;
async function makeBatch(token, producer, energyKJ, dt = DT, tsOffset = 0n) {
  const now = BigInt(await time.latest());
  nonceCounter += 1n;
  return {
    producer: producer.address,
    energyKJ,
    dtSeconds: dt,
    merkleRoot: ethers.keccak256(ethers.toUtf8Bytes("root-" + nonceCounter)),
    timestamp: now + tsOffset + nonceCounter, // strictly increasing, within the 300 s skew
  };
}

async function sign(token, wallet, batch) {
  const digest = await token.batchDigest(batch);
  return wallet.signMessage(ethers.getBytes(digest)); // EIP-191 prefix, as in the contract
}

async function signAll(token, wallets, batch) {
  return Promise.all(wallets.map((w) => sign(token, w, batch)));
}

describe("Joulet quorum-verified settlement: security tests", function () {
  describe("S1 honest operation", function () {
    it("mints 1 JLT per kJ when all oracles attest an in-bound batch", async function () {
      const { token, producer, oracles } = await deployAll(4);
      const b = await makeBatch(token, producer, 250n);
      const sigs = await signAll(token, oracles, b);
      await expect(token.reportVerifiedBatch(b, sigs)).to.emit(token, "VerifiedBatchMinted");
      expect(await token.balanceOf(producer.address)).to.equal(250n * ONE);
      expect(await token.verifiedBatchCount()).to.equal(1n);
    });

    it("accepts a batch exactly at the physical bound (kappa = 1)", async function () {
      const { token, producer, oracles } = await deployAll(3);
      const bound = await token.physicalBoundKJ(producer.address, DT);
      expect(bound).to.equal(300n);
      const b = await makeBatch(token, producer, bound);
      await token.reportVerifiedBatch(b, await signAll(token, oracles, b));
      expect(await token.balanceOf(producer.address)).to.equal(300n * ONE);
    });

    it("tolerates one Byzantine/offline oracle out of four (3 of 4 > 2/3)", async function () {
      const { token, producer, oracles } = await deployAll(4);
      const b = await makeBatch(token, producer, 100n);
      const sigs = await signAll(token, oracles.slice(0, 3), b);
      await token.reportVerifiedBatch(b, sigs);
      expect(await token.balanceOf(producer.address)).to.equal(100n * ONE);
    });
  });

  describe("S2 signature forgery and tampering", function () {
    it("rejects a signature from an unregistered key", async function () {
      const { token, producer, oracles, attacker } = await deployAll(4);
      const b = await makeBatch(token, producer, 100n);
      const sigs = await signAll(token, [oracles[0], oracles[1], oracles[2]], b);
      sigs[2] = await sign(token, attacker, b); // forged slot
      await expect(token.reportVerifiedBatch(b, sigs)).to.be.revertedWith("signer not active");
    });

    it("rejects a batch whose energy was altered after signing", async function () {
      const { token, producer, oracles } = await deployAll(4);
      const b = await makeBatch(token, producer, 100n);
      const sigs = await signAll(token, oracles, b);
      const tampered = { ...b, energyKJ: 200n };
      await expect(token.reportVerifiedBatch(tampered, sigs)).to.be.revertedWith("signer not active");
    });

    it("rejects a batch re-targeted to another producer", async function () {
      const { token, producer, oracles, attacker } = await deployAll(4);
      await token.registerDevice(attacker.address, RATED_W);
      const b = await makeBatch(token, producer, 100n);
      const sigs = await signAll(token, oracles, b);
      await expect(token.reportVerifiedBatch({ ...b, producer: attacker.address }, sigs)).to.be.revertedWith("signer not active");
    });

    it("rejects a malformed signature", async function () {
      const { token, producer, oracles } = await deployAll(3);
      const b = await makeBatch(token, producer, 100n);
      await expect(token.reportVerifiedBatch(b, ["0x1234", "0x1234", "0x1234"])).to.be.reverted;
      void oracles;
    });
  });

  describe("S3 replay and ordering", function () {
    it("rejects an exact replay of an accepted batch", async function () {
      const { token, producer, oracles } = await deployAll(3);
      const b = await makeBatch(token, producer, 100n);
      const sigs = await signAll(token, oracles, b);
      await token.reportVerifiedBatch(b, sigs);
      await expect(token.reportVerifiedBatch(b, sigs)).to.be.revertedWith("stale timestamp");
      expect(await token.balanceOf(producer.address)).to.equal(100n * ONE);
    });

    it("rejects an older batch submitted after a newer one (non-monotonic timestamp)", async function () {
      const { token, producer, oracles } = await deployAll(3);
      const older = await makeBatch(token, producer, 100n);
      const newer = await makeBatch(token, producer, 100n);
      await token.reportVerifiedBatch(newer, await signAll(token, oracles, newer));
      await expect(token.reportVerifiedBatch(older, await signAll(token, oracles, older))).to.be.revertedWith("stale timestamp");
    });

    it("rejects a timestamp far in the future", async function () {
      const { token, producer, oracles } = await deployAll(3);
      const b = await makeBatch(token, producer, 100n, DT, 10_000n);
      await expect(token.reportVerifiedBatch(b, await signAll(token, oracles, b))).to.be.revertedWith("future timestamp");
    });

    it("does not slash twice when an over-capacity batch is replayed", async function () {
      const { token, registry, producer, oracles } = await deployAll(3);
      const b = await makeBatch(token, producer, 301n); // 1 kJ above the bound
      const sigs = await signAll(token, oracles, b);
      await token.reportVerifiedBatch(b, sigs);
      const stakeAfterFirst = await registry.stakeOf(oracles[0].address);
      await expect(token.reportVerifiedBatch(b, sigs)).to.be.revertedWith("stale timestamp");
      expect(await registry.stakeOf(oracles[0].address)).to.equal(stakeAfterFirst);
    });
  });

  describe("S4 quorum and weights", function () {
    it("rejects a single oracle acting alone in a 4-oracle federation", async function () {
      const { token, producer, oracles } = await deployAll(4);
      const b = await makeBatch(token, producer, 100n);
      await expect(token.reportVerifiedBatch(b, await signAll(token, [oracles[0]], b))).to.be.revertedWith("quorum not reached");
    });

    it("rejects exactly 2 of 4 equal-weight oracles (needs strictly more than 2/3)", async function () {
      const { token, producer, oracles } = await deployAll(4);
      const b = await makeBatch(token, producer, 100n);
      await expect(token.reportVerifiedBatch(b, await signAll(token, oracles.slice(0, 2), b))).to.be.revertedWith("quorum not reached");
    });

    it("rejects the same oracle signature counted twice", async function () {
      const { token, producer, oracles } = await deployAll(4);
      const b = await makeBatch(token, producer, 100n);
      const s = await sign(token, oracles[0], b);
      await expect(token.reportVerifiedBatch(b, [s, s, s])).to.be.revertedWith("duplicate signer");
    });

    it("an oracle below S_min cannot contribute weight", async function () {
      const signers = await ethers.getSigners();
      const { token, registry, producer, oracles } = await deployAll(3);
      const weak = signers[12];
      await token.transfer(weak.address, 50n * ONE); // below S_min = 100 JLT
      await token.connect(weak).approve(await registry.getAddress(), 50n * ONE);
      await registry.connect(weak).stake(50n * ONE);
      expect(await registry.isActive(weak.address)).to.equal(false);
      const b = await makeBatch(token, producer, 100n);
      const sigs = await signAll(token, [oracles[0], oracles[1], weak], b);
      await expect(token.reportVerifiedBatch(b, sigs)).to.be.revertedWith("signer not active");
    });

    it("weights votes by stake x reputation: one heavy oracle outweighs two light ones", async function () {
      const signers = await ethers.getSigners();
      const { token, registry, producer } = await deployAll(0);
      const heavy = signers[4], l1 = signers[5], l2 = signers[6];
      for (const [o, amt] of [[heavy, 1000n * ONE], [l1, 100n * ONE], [l2, 100n * ONE]]) {
        await token.transfer(o.address, amt);
        await token.connect(o).approve(await registry.getAddress(), amt);
        await registry.connect(o).stake(amt);
      }
      const b = await makeBatch(token, producer, 100n);
      // heavy alone: 1000 / 1200 = 83 % > 2/3 -> accepted
      await token.reportVerifiedBatch(b, [await sign(token, heavy, b)]);
      // two light oracles alone: 200 / 1200 = 17 % -> rejected
      const b2 = await makeBatch(token, producer, 100n);
      await expect(token.reportVerifiedBatch(b2, await signAll(token, [l1, l2], b2))).to.be.revertedWith("quorum not reached");
    });
  });

  describe("S5 physical bound and slashing", function () {
    it("rejects an over-capacity claim, mints nothing and slashes every signer by lambda", async function () {
      const { token, registry, treasury, producer, oracles } = await deployAll(4, 150n * ONE);
      const b = await makeBatch(token, producer, 301n); // bound is 300 kJ
      await expect(token.reportVerifiedBatch(b, await signAll(token, oracles, b))).to.emit(token, "BatchRejectedOverCapacity");
      expect(await token.balanceOf(producer.address)).to.equal(0n);
      for (const o of oracles) expect(await registry.stakeOf(o.address)).to.equal(75n * ONE); // 150 -> 75
      expect(await token.balanceOf(treasury.address)).to.equal(4n * 75n * ONE);
    });

    it("deregisters an oracle whose stake falls below S_min and reduces its reputation", async function () {
      const { token, registry, producer, oracles } = await deployAll(3, 150n * ONE);
      const b = await makeBatch(token, producer, 1000n);
      await token.reportVerifiedBatch(b, await signAll(token, oracles, b));
      expect(await registry.isActive(oracles[0].address)).to.equal(false); // 75 < 100
      expect(await registry.reputationBps(oracles[0].address)).to.equal(5000n);
      expect(await registry.activeCount()).to.equal(0n);
    });

    it("honours kappa > 1 as a metering-error tolerance", async function () {
      const { token, producer, oracles } = await deployAll(3);
      await token.setKappaBps(11_000); // 1.10
      expect(await token.physicalBoundKJ(producer.address, DT)).to.equal(330n);
      const b = await makeBatch(token, producer, 330n);
      await token.reportVerifiedBatch(b, await signAll(token, oracles, b));
      expect(await token.balanceOf(producer.address)).to.equal(330n * ONE);
    });

    it("an unregistered device cannot mint", async function () {
      const { token, oracles, attacker } = await deployAll(3);
      const b = await makeBatch(token, attacker, 10n);
      await expect(token.reportVerifiedBatch(b, await signAll(token, oracles, b))).to.be.revertedWith("unregistered device");
    });

    it("LIMITATION: an inflated but in-capacity batch attested by a full quorum is accepted", async function () {
      // Documents the residual risk stated in the paper: the on-chain bound only
      // catches claims above rated capacity; in-capacity inflation requires the
      // off-chain re-verification of Merkle leaves by honest oracles.
      const { token, producer, oracles } = await deployAll(4);
      const b = await makeBatch(token, producer, 299n);
      await token.reportVerifiedBatch(b, await signAll(token, oracles, b));
      expect(await token.balanceOf(producer.address)).to.equal(299n * ONE);
    });
  });

  describe("S6 access control", function () {
    it("only the settlement contract may slash or reward", async function () {
      const { registry, attacker, oracles } = await deployAll(3);
      await expect(registry.connect(attacker).slash(oracles[0].address)).to.be.revertedWithCustomError(registry, "NotSettlement");
      await expect(registry.connect(attacker).reward(oracles[0].address)).to.be.revertedWithCustomError(registry, "NotSettlement");
    });

    it("the settlement binding can be set only once", async function () {
      const { registry, attacker } = await deployAll(3);
      await expect(registry.setSettlement(attacker.address)).to.be.revertedWithCustomError(registry, "SettlementAlreadySet");
    });

    it("only the owner registers devices and sets kappa", async function () {
      const { token, attacker, producer } = await deployAll(3);
      await expect(token.connect(attacker).registerDevice(producer.address, 1n)).to.be.reverted;
      await expect(token.connect(attacker).setKappaBps(12_000)).to.be.reverted;
      await expect(token.setKappaBps(9_000)).to.be.revertedWith("kappa out of range");
    });
  });

  describe("S7 measured on-chain cost of the verification path", function () {
    for (const n of [1, 3, 4, 7]) {
      it(`gas for one accepted batch with ${n} oracle signature(s)`, async function () {
        const { token, producer, oracles } = await deployAll(n);
        const b = await makeBatch(token, producer, 100n);
        const sigs = await signAll(token, oracles, b);
        const rc = await (await token.reportVerifiedBatch(b, sigs)).wait();
        console.log(`        n=${n}: gasUsed=${rc.gasUsed}`);
        expect(rc.gasUsed).to.be.greaterThan(0n);
      });
    }
  });
});
