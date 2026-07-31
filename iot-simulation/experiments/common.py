#!/usr/bin/env python3
"""
Experiment harness for Joulet paper data collection.

Launches real component stacks (N oracle_node.py processes + 1
consensus_engine.py process, each stack bound to its own freshly deployed
JouletToken contract on the local hardhat chain) and replays actual CSV
readings through signer.py -> oracle nodes -> consensus -> chain.

All components append structured events to a shared JSONL metrics file
(JOULET_METRICS_FILE) via metrics_logger.py.
"""

import csv
import json
import os
import random
import socket
import subprocess
import sys
import time
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone

import requests
from web3 import Web3
from eth_account import Account

IOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPO_DIR = os.path.dirname(IOT_DIR)
DATA_DIR = os.path.join(REPO_DIR, "paper_experiments", "data")
ARTIFACT = os.path.join(REPO_DIR, "blockchain", "artifacts", "contracts",
                        "JouletToken.sol", "JouletToken.json")
PYTHON = os.path.join(IOT_DIR, ".venv", "bin", "python")
RPC_URL = "http://127.0.0.1:8545"
MNEMONIC = "test test test test test test test test test test test junk"

Account.enable_unaudited_hdwallet_features()


def hh_key(index):
    """Standard hardhat account private key at HD index."""
    acct = Account.from_mnemonic(MNEMONIC, account_path=f"m/44'/60'/0'/0/{index}")
    return acct.key.hex(), acct.address


def get_w3():
    w3 = Web3(Web3.HTTPProvider(RPC_URL))
    assert w3.is_connected(), "hardhat node not reachable"
    return w3


def deploy_joulet(w3, consensus_address):
    """Deploy a fresh JouletToken from hardhat account 0 and authorize the
    given consensus engine address. Returns contract address."""
    with open(ARTIFACT) as f:
        art = json.load(f)
    dep_key, dep_addr = hh_key(0)
    contract = w3.eth.contract(abi=art["abi"], bytecode=art["bytecode"])

    def send(txfn):
        # retry on nonce races: several parallel stacks deploy from account 0
        last_err = None
        for _ in range(8):
            try:
                tx = txfn.build_transaction({
                    "from": dep_addr,
                    "nonce": w3.eth.get_transaction_count(dep_addr, "pending"),
                    "gas": 6_000_000,
                    "gasPrice": w3.eth.gas_price,
                })
                signed = w3.eth.account.sign_transaction(tx, private_key=dep_key)
                h = w3.eth.send_raw_transaction(signed.raw_transaction)
                return w3.eth.wait_for_transaction_receipt(h, timeout=60)
            except Exception as e:
                last_err = e
                time.sleep(random.uniform(0.2, 1.5))
        raise last_err

    rcpt = send(contract.constructor())
    addr = rcpt.contractAddress
    deployed = w3.eth.contract(address=addr, abi=art["abi"])
    send(deployed.functions.setOracleConsensus(Web3.to_checksum_address(consensus_address)))
    return addr, art["abi"]


def wait_port(port, timeout=20):
    t0 = time.time()
    while time.time() - t0 < timeout:
        with socket.socket() as s:
            s.settimeout(0.5)
            try:
                s.connect(("127.0.0.1", port))
                return True
            except OSError:
                time.sleep(0.3)
    raise RuntimeError(f"port {port} did not open")


class Stack:
    """One isolated Joulet stack: n oracle nodes + consensus engine + fresh contract."""

    def __init__(self, stack_id, n_oracles=3, quorum=3, target_interval=15.0,
                 initial_difficulty=5.0, metrics_file=None, profile_label="",
                 run_id="", malicious_ids=()):
        self.stack_id = stack_id
        self.n_oracles = n_oracles
        self.oracle_ports = [5300 + stack_id * 20 + i for i in range(n_oracles)]
        self.consensus_port = 5300 + stack_id * 20 + 15
        self.metrics_file = metrics_file
        self.procs = []
        self.quorum = quorum
        self.target_interval = target_interval
        self.initial_difficulty = initial_difficulty
        self.profile_label = profile_label
        self.run_id = run_id
        self.malicious_ids = set(malicious_ids)
        # each stack signs mints from its own hardhat account -> no nonce races
        self.consensus_key, self.consensus_addr = hh_key(1 + stack_id)
        self.contract_address = None

    def env(self, extra=None):
        e = dict(os.environ)
        e.update({
            "JOULET_METRICS_FILE": self.metrics_file or "",
            "JOULET_PROFILE_LABEL": self.profile_label,
            "JOULET_RUN_ID": self.run_id,
            "JOULET_SKIP_WEATHER": "1",
            "RPC_URL": RPC_URL,
        })
        if extra:
            e.update(extra)
        return e

    def start(self):
        w3 = get_w3()
        self.contract_address, self.abi = deploy_joulet(w3, self.consensus_addr)

        logdir = os.path.join(DATA_DIR, "proc_logs")
        os.makedirs(logdir, exist_ok=True)

        cons_env = self.env({
            "CONSENSUS_PORT": str(self.consensus_port),
            "DIFF_TARGET_INTERVAL": str(self.target_interval),
            "INITIAL_DIFFICULTY": str(self.initial_difficulty),
            "CONSENSUS_QUORUM": str(self.quorum),
            "CONTRACT_ADDRESS": self.contract_address,
            "ORACLE_PRIVATE_KEY": self.consensus_key,
        })
        self.procs.append(subprocess.Popen(
            [PYTHON, "consensus_engine.py"], cwd=IOT_DIR, env=cons_env,
            stdout=open(os.path.join(logdir, f"s{self.stack_id}_consensus.log"), "a"),
            stderr=subprocess.STDOUT))

        for i, port in enumerate(self.oracle_ports):
            oid = f"oracle_{i+1}"
            cmd = [PYTHON, "oracle_node.py", "--port", str(port), "--id", oid]
            if oid in self.malicious_ids:
                cmd.append("--malicious")
            oenv = self.env({
                "CONSENSUS_ENGINE_URL": f"http://127.0.0.1:{self.consensus_port}",
            })
            self.procs.append(subprocess.Popen(
                cmd, cwd=IOT_DIR, env=oenv,
                stdout=open(os.path.join(logdir, f"s{self.stack_id}_{oid}.log"), "a"),
                stderr=subprocess.STDOUT))

        wait_port(self.consensus_port)
        for p in self.oracle_ports:
            wait_port(p)
        time.sleep(0.5)
        return self

    def stop(self):
        for p in self.procs:
            p.terminate()
        for p in self.procs:
            try:
                p.wait(timeout=5)
            except subprocess.TimeoutExpired:
                p.kill()
        self.procs = []


# ---------------------------------------------------------------------------
# Data replay helpers
# ---------------------------------------------------------------------------

def load_csv(name):
    path = os.path.join(IOT_DIR, "mock_data", name)
    with open(path) as f:
        return list(csv.DictReader(f))


def rows_in_hours(rows, h_lo, h_hi):
    """Rows whose ORIGINAL timestamp hour is in [h_lo, h_hi)."""
    return [r for r in rows if h_lo <= int(r["Timestamp"][11:13]) < h_hi]


def craft_timestamp(display_hour=None):
    """ISO timestamp whose UTC instant is *now* (passes the oracle replay
    check) and whose displayed local hour is `display_hour` (passes the
    daylight check) by choosing an appropriate UTC offset - i.e. the device
    reports in its own local timezone."""
    now_utc = datetime.now(timezone.utc)
    if display_hour is None:
        display_hour = 12
    offset_h = (display_hour - now_utc.hour) % 24
    if offset_h > 14:
        offset_h -= 24
    tz = timezone(timedelta(hours=offset_h))
    return now_utc.astimezone(tz).isoformat()


class ReadingSubmitter:
    """Signs and broadcasts CSV rows to all oracle nodes of a stack."""

    def __init__(self, stack):
        # NOTE: JOULET_METRICS_FILE / JOULET_PROFILE_LABEL / JOULET_RUN_ID must
        # be set in os.environ BEFORE this module (and signer) is imported.
        import metrics_logger
        import signer
        self.signer = signer
        self.metrics = metrics_logger
        self.stack = stack
        self.pool = ThreadPoolExecutor(max_workers=16)
        self.nonce = int(time.time() * 1000) % 10**9

    def submit_row(self, row, device_id=None, keep_hour=False):
        """Sign one CSV row (timestamp refreshed to now, unique nonce) and
        broadcast to every oracle node. Returns (sig_id, results)."""
        payload = dict(row)
        if device_id:
            payload["Device_ID"] = device_id
        orig_hour = int(row["Timestamp"][11:13])
        payload["Timestamp"] = craft_timestamp(orig_hour if keep_hour else 12)
        self.nonce += 1
        payload["nonce"] = self.nonce

        key = self.signer.PRIVATE_KEYS.get(payload["Device_ID"])
        signature = self.signer.sign_data(key, payload)
        sig_id = self.metrics.payload_sig_id(payload)
        self.metrics.log_event("packet_submitted", sig_id=sig_id,
                               device_id=payload["Device_ID"],
                               power_kw=float(payload["Power_kW"]))

        def post(port):
            try:
                r = requests.post(f"http://127.0.0.1:{port}/api/oracle/submit",
                                  json={"payload": payload, "signature": signature},
                                  timeout=10)
                return r.status_code
            except Exception as e:
                return str(e)

        futures = [self.pool.submit(post, p) for p in self.stack.oracle_ports]
        results = [f.result() for f in futures]
        return sig_id, results

    def submit_forged(self, row, wrong_key_device):
        """AttackPanel 'signature forgery': sign with another device's key."""
        payload = dict(row)
        payload["Timestamp"] = craft_timestamp(12)
        self.nonce += 1
        payload["nonce"] = self.nonce
        wrong_key = self.signer.PRIVATE_KEYS[wrong_key_device]
        signature = self.signer.sign_data(wrong_key, payload)
        sig_id = self.metrics.payload_sig_id(payload)
        self.metrics.log_event("packet_submitted", sig_id=sig_id,
                               device_id=payload["Device_ID"], forged=True)
        for p in self.stack.oracle_ports:
            try:
                requests.post(f"http://127.0.0.1:{p}/api/oracle/submit",
                              json={"payload": payload, "signature": signature},
                              timeout=10)
            except Exception:
                pass
        return sig_id
