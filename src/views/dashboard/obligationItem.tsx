import React, { useMemo } from "react";
import { useUserCollateralBalance, useTokenName } from "../../hooks";
import {
  calculateBorrowAPY,
  collateralExchangeRate,
  collateralToLiquidity,
  LendingObligation,
  LendingReserve,
  reserveMarketCap,
} from "../../models/lending";
import { TokenIcon } from "../../components/TokenIcon";
import {
  wadToLamports,
  formatNumber,
  fromLamports,
  formatPct,
} from "../../utils/utils";
import { Button, Card } from "antd";
import { Link } from "react-router-dom";
import { cache, ParsedAccount, useMint } from "../../contexts/accounts";
import { simulateMarketOrderFill } from "../../contexts/market";

export const ObligationItem = (props: {
  obligation: ParsedAccount<LendingObligation>;
}) => {
  const { obligation } = props;

  const borrowReserve = cache.get(
    obligation.info.borrowReserve
  ) as ParsedAccount<LendingReserve>;

  const collateralReserve = cache.get(
    obligation.info.collateralReserve
  ) as ParsedAccount<LendingReserve>;

  const liquidityMint = useMint(borrowReserve.info.liquidityMint);
  const collateralMint = useMint(collateralReserve.info.liquidityMint);

  const borrowAmount = fromLamports(
    wadToLamports(obligation.info.borrowAmountWad),
    liquidityMint
  );

  const borrowAPY = useMemo(() => calculateBorrowAPY(borrowReserve.info), [
    borrowReserve,
  ]);
  
  const collateralLamports = collateralToLiquidity(obligation.info.depositedCollateral, borrowReserve.info);
  const collateral = fromLamports(collateralLamports, collateralMint);

  const borrowName = useTokenName(borrowReserve?.info.liquidityMint);
  const collateralName = useTokenName(collateralReserve?.info.liquidityMint);


  const cost = simulateMarketOrderFill(collateralLamports, borrowReserve.info);
  console.log(cost);

  // TODO: health factor
//   let borrow_amount_as_collateral = withdraw_reserve_rates.liquidity_to_collateral(
//     simulate_market_order_fill(
//         obligation.borrowed_liquidity_wads,
//         memory,
//         dex_market_order_book_side_info,
//         dex_market_info,
//         &repay_reserve,
//     )?
//     .round_u64(),
// );

  return (
    <Card>
      <div className="dashboard-item">
        <span style={{ display: "flex" }}>
          <div style={{ display: "flex" }}>
            <TokenIcon
              mintAddress={collateralReserve?.info.liquidityMint}
              style={{ marginRight: "-0.5rem" }}
            />
            <TokenIcon mintAddress={borrowReserve?.info.liquidityMint} />
          </div>
          {collateralName}
          /
          {borrowName}
        </span>
        <div>
          {formatNumber.format(borrowAmount)} {borrowName}
        </div>
        <div>
          {formatNumber.format(collateral)} {collateralName}
        </div>
        <div>{formatPct.format(borrowAPY)}</div>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Link to={`/borrow/${borrowReserve.pubkey.toBase58()}`}>
            <Button>
              <span>Borrow</span>
            </Button>
          </Link>
          <Link to={`/repay/loan/${obligation.pubkey.toBase58()}`}>
            <Button>
              <span>Repay</span>
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
};
