#!/bin/zsh
# Phase 2 data collection: runs after the profile trials complete.
# Order chosen so latency-sensitive experiments run without competing load;
# gas/ZK (receipt-based, load-insensitive) overlap the long Ttarget sweep.
set -u
cd /Users/keshavs/Desktop/Joulet_Beta/iot-simulation
PY=./.venv/bin/python
D=/Users/keshavs/Desktop/Joulet_Beta/paper_experiments/data
L=$D/proc_logs

echo "=== [1/4] device-count sweep (latency-sensitive, isolated) ==="
for n in 1 5 10 20; do
  $PY experiments/run_scale_level.py $n 120 5 $D/scale.jsonl >> $L/scale.log 2>&1
done
echo "scale sweep done"

echo "=== [2/4] consensus-node sweep (latency-sensitive, isolated) ==="
$PY experiments/run_consensus_sweep.py $D/consensus_sweep.jsonl >> $L/consensus_sweep.log 2>&1
echo "consensus sweep done"

echo "=== [3/4] attack trials + long run (isolated) ==="
# trials already collected (attacks_trials.jsonl, 10/10 complete) — appending
# a second run would duplicate run_ids attack_t00..t09 in the same file
if [ ! -s $D/attacks_trials.jsonl ]; then
  $PY experiments/run_attack_trials.py trials $D/attacks_trials.jsonl >> $L/attacks.log 2>&1
fi
$PY experiments/run_attack_trials.py long $D/attacks_long.jsonl >> $L/attacks.log 2>&1
echo "attacks done"

echo "=== [4/4] Ttarget sweep (parallel) + gas comparison (parallel) + ZK ==="
( $PY experiments/run_ttarget.py 30 720 6 $D/ttarget.jsonl >> $L/ttarget30.log 2>&1 ) &
( sleep 5; $PY experiments/run_ttarget.py 60 900 7 $D/ttarget.jsonl >> $L/ttarget60.log 2>&1 ) &
( sleep 10; $PY experiments/run_ttarget.py 120 1500 8 $D/ttarget.jsonl >> $L/ttarget120.log 2>&1 ) &
( sleep 15
  for t in 0 1 2 3 4; do
    $PY experiments/run_gas_arm.py direct $t $D/gas_comparison.jsonl >> $L/gas_direct.log 2>&1
  done ) &
( sleep 20
  for t in 0 1 2 3 4; do
    $PY experiments/run_gas_arm.py static $t $D/gas_comparison.jsonl >> $L/gas_static.log 2>&1
  done ) &
( sleep 25
  for t in 0 1 2 3 4; do
    $PY experiments/run_gas_arm.py ard $t $D/gas_comparison.jsonl >> $L/gas_ard.log 2>&1
  done ) &
( sleep 30; $PY experiments/run_zk_overhead.py $D/zk.jsonl >> $L/zk.log 2>&1 ) &
wait
echo "PHASE 2 COMPLETE"
