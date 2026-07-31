#!/usr/bin/env python3
"""fig14: overhead of the ZK physics-proof step vs ECDSA-only minting
(N=10 each). Latency and gas from real executions/receipts.

CAVEAT (printed + hatched in figure): zk_prover.py is a MOCK Groth16 prover -
its proof-generation time is dominated by fixed time.sleep() calls, and
verifyPhysicsProof() is a simplified pure-Solidity check, not a pairing-based
SNARK verifier. Verify-tx and mint gas are real hardhat receipts."""

import numpy as np
import matplotlib.pyplot as plt

import figstyle as F

F.setup()

events = F.load_events("zk.jsonl")

# pair each zk_trial with the mint_tx_confirmed that immediately precedes it
last_gas = None
trials = {"plain": [], "zk": []}
for e in events:
    if e["stage"] == "mint_tx_confirmed":
        last_gas = e["gas_used"]
    elif e["stage"] == "zk_trial":
        rec = dict(e)
        rec["mint_gas"] = last_gas
        trials[e["mode"]].append(rec)

fig, (ax_a, ax_b) = plt.subplots(1, 2, figsize=(F.DOUBLE_COL, 2.5))
x = [0, 1]
names = ["ECDSA only", "ZK-verified"]

# ---- (a) latency ----
plain_mint = np.mean([t["mint_ms"] for t in trials["plain"]])
zk_mint = np.mean([t["mint_ms"] for t in trials["zk"]])
zk_gen = np.mean([t["proof_gen_ms"] for t in trials["zk"]])
zk_ver = np.mean([t["verify_call_ms"] for t in trials["zk"]])

ax_a.bar(0, plain_mint, 0.5, color=F.RED, edgecolor="white", label="Mint tx")
ax_a.bar(1, zk_mint, 0.5, color=F.RED, edgecolor="white")
ax_a.bar(1, zk_ver, 0.5, bottom=zk_mint, color=F.BLUE, edgecolor="white",
         label="On-chain verify call")
ax_a.bar(1, zk_gen, 0.5, bottom=zk_mint + zk_ver, color=F.ORANGE,
         edgecolor="white", hatch="///", label="Proof gen (mock prover)")
ax_a.annotate(f"{plain_mint:.0f} ms", (0, plain_mint), ha="center",
              textcoords="offset points", xytext=(0, 3), fontsize=6.5)
ax_a.annotate(f"{zk_mint+zk_ver+zk_gen:.0f} ms", (1, zk_mint + zk_ver + zk_gen),
              ha="center", textcoords="offset points", xytext=(0, 3), fontsize=6.5)
ax_a.set_xticks(x, names)
ax_a.set_yscale("log")
ax_a.set_ylabel("Mean latency (ms, log)")
ax_a.set_title("(a) Mint latency")
ax_a.legend(fontsize=6)

# ---- (b) gas ----
plain_gas = np.mean([t["mint_gas"] for t in trials["plain"] if t["mint_gas"]])
zk_mint_gas = np.mean([t["mint_gas"] for t in trials["zk"] if t["mint_gas"]])
zk_ver_gas = np.mean([t["verify_tx_gas"] for t in trials["zk"] if t["verify_tx_gas"]])

ax_b.bar(0, plain_gas / 1e3, 0.5, color=F.RED, edgecolor="white", label="Mint tx")
ax_b.bar(1, zk_mint_gas / 1e3, 0.5, color=F.RED, edgecolor="white")
ax_b.bar(1, zk_ver_gas / 1e3, 0.5, bottom=zk_mint_gas / 1e3, color=F.BLUE,
         edgecolor="white", label="Verify tx")
ax_b.annotate(f"{plain_gas/1e3:.0f}k", (0, plain_gas / 1e3), ha="center",
              textcoords="offset points", xytext=(0, 3), fontsize=6.5)
ax_b.annotate(f"{(zk_mint_gas+zk_ver_gas)/1e3:.0f}k",
              (1, (zk_mint_gas + zk_ver_gas) / 1e3), ha="center",
              textcoords="offset points", xytext=(0, 3), fontsize=6.5)
ax_b.set_xticks(x, names)
ax_b.set_ylabel("Mean gas (×10³)")
ax_b.set_title("(b) Gas per mint")
ax_b.legend(fontsize=6)

fig.suptitle("ZK physics-proof overhead (N=10; hatched = mock prover time)",
             y=1.04, fontsize=9)
fig.tight_layout()
F.save(fig, "fig14_zk_overhead")

print("\n=== fig14 summary stats ===")
print("NOTE: proof generation time comes from the repo's MOCK (sleep-based) prover.")
F.stats_line("plain mint_ms", [t["mint_ms"] for t in trials["plain"]])
F.stats_line("zk mint_ms", [t["mint_ms"] for t in trials["zk"]])
F.stats_line("zk proof_gen_ms (mock)", [t["proof_gen_ms"] for t in trials["zk"]])
F.stats_line("zk verify_call_ms", [t["verify_call_ms"] for t in trials["zk"]])
F.stats_line("plain mint gas", [t["mint_gas"] for t in trials["plain"] if t["mint_gas"]])
F.stats_line("zk verify tx gas", [t["verify_tx_gas"] for t in trials["zk"] if t["verify_tx_gas"]])
