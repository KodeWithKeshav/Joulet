// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title OracleRegistry
 * @notice Staked oracle registry for Joulet (paper Section IV-E).
 *
 *  - An oracle locks at least `minStake` JLT to become active.
 *  - Its voting weight is w_j = stake_j * rho_j, where the reputation factor
 *    rho_j lies in (0, 1] (kept in basis points, 1..10000).
 *  - Only the settlement contract may slash. A slash moves `slashBps`/10000 of
 *    the oracle's stake to the community treasury, halves its reputation and
 *    deregisters the oracle if the remaining stake is below `minStake`.
 *
 * Prototype scope: there is no withdrawal path (a production version needs an
 * unbonding delay longer than the evidence window) and `rho` uses fixed steps.
 */
contract OracleRegistry is Ownable {
    uint256 public constant BPS = 10_000;
    uint256 public constant REP_STEP_BPS = 100;     // +1 % after each accepted batch
    uint256 public constant REP_FLOOR_BPS = 100;    // rho never reaches 0

    IERC20 public immutable stakeToken;
    address public immutable treasury;
    uint256 public immutable minStake;   // S_min (token wei)
    uint256 public immutable slashBps;   // lambda in (0, 10000]

    address public settlement;           // the only address allowed to slash / reward

    mapping(address => uint256) public stakeOf;
    mapping(address => uint256) public reputationBps;   // rho_j
    mapping(address => bool) public isActive;

    address[] private _active;
    mapping(address => uint256) private _pos;           // index + 1 in _active

    event Staked(address indexed oracle, uint256 amount, uint256 totalStake);
    event Activated(address indexed oracle);
    event Deactivated(address indexed oracle);
    event Slashed(address indexed oracle, uint256 amount, uint256 remainingStake);
    event SettlementSet(address settlement);

    error NotSettlement();
    error SettlementAlreadySet();
    error BadParameter();

    modifier onlySettlement() {
        if (msg.sender != settlement) revert NotSettlement();
        _;
    }

    constructor(address stakeToken_, address treasury_, uint256 minStake_, uint256 slashBps_)
        Ownable(msg.sender)
    {
        if (stakeToken_ == address(0) || treasury_ == address(0) || minStake_ == 0) revert BadParameter();
        if (slashBps_ == 0 || slashBps_ > BPS) revert BadParameter();
        stakeToken = IERC20(stakeToken_);
        treasury = treasury_;
        minStake = minStake_;
        slashBps = slashBps_;
    }

    /// @notice One-time binding to the settlement contract (the JLT token).
    function setSettlement(address settlement_) external onlyOwner {
        if (settlement != address(0)) revert SettlementAlreadySet();
        if (settlement_ == address(0)) revert BadParameter();
        settlement = settlement_;
        emit SettlementSet(settlement_);
    }

    /// @notice Lock `amount` JLT as collateral (caller must have approved this contract).
    function stake(uint256 amount) external {
        require(amount > 0, "zero amount");
        require(stakeToken.transferFrom(msg.sender, address(this), amount), "transfer failed");
        stakeOf[msg.sender] += amount;
        if (reputationBps[msg.sender] == 0) reputationBps[msg.sender] = BPS;
        emit Staked(msg.sender, amount, stakeOf[msg.sender]);
        if (!isActive[msg.sender] && stakeOf[msg.sender] >= minStake) _activate(msg.sender);
    }

    /// @notice Voting weight w_j = stake_j * rho_j / 10000 (0 for inactive oracles).
    function weightOf(address oracle) public view returns (uint256) {
        if (!isActive[oracle]) return 0;
        return (stakeOf[oracle] * reputationBps[oracle]) / BPS;
    }

    /// @notice Sum of the weights of all active oracles.
    function totalWeight() external view returns (uint256 sum) {
        uint256 n = _active.length;
        for (uint256 i = 0; i < n; i++) sum += weightOf(_active[i]);
    }

    function activeCount() external view returns (uint256) {
        return _active.length;
    }

    /// @notice Slash `slashBps` of the stake; called by settlement on a physical-bound violation.
    function slash(address oracle) external onlySettlement returns (uint256 amount) {
        amount = (stakeOf[oracle] * slashBps) / BPS;
        if (amount > 0) {
            stakeOf[oracle] -= amount;
            require(stakeToken.transfer(treasury, amount), "treasury transfer failed");
        }
        uint256 rep = reputationBps[oracle] / 2;
        reputationBps[oracle] = rep < REP_FLOOR_BPS ? REP_FLOOR_BPS : rep;
        emit Slashed(oracle, amount, stakeOf[oracle]);
        if (isActive[oracle] && stakeOf[oracle] < minStake) _deactivate(oracle);
    }

    /// @notice Raise rho after an accepted batch (capped at 1.0).
    function reward(address oracle) external onlySettlement {
        uint256 rep = reputationBps[oracle] + REP_STEP_BPS;
        reputationBps[oracle] = rep > BPS ? BPS : rep;
    }

    function _activate(address oracle) private {
        isActive[oracle] = true;
        _active.push(oracle);
        _pos[oracle] = _active.length;
        emit Activated(oracle);
    }

    function _deactivate(address oracle) private {
        uint256 p = _pos[oracle];
        if (p == 0) return;
        address last = _active[_active.length - 1];
        _active[p - 1] = last;
        _pos[last] = p;
        _active.pop();
        _pos[oracle] = 0;
        isActive[oracle] = false;
        emit Deactivated(oracle);
    }
}
