import { useMemo } from "react";
import { useLendingObligations } from "./useLendingObligations";
import { LendingReserve } from "../models/lending";
import { useLendingReserves } from "./useLendingReserves";
import { ParsedAccount } from "../contexts/accounts";

export const useLiquidableObligations = () => {
  const { obligations } = useLendingObligations();
  const { reserveAccounts } = useLendingReserves();

  const availableReserves = useMemo(() => {
    return reserveAccounts.reduce((map, reserve) => {
        map.set(reserve.pubkey.toBase58(), reserve);
      return map;
    }, new Map<string, ParsedAccount<LendingReserve>>())
  }, [reserveAccounts])

  const liquidableObligations = useMemo(() => {
    if (availableReserves.size === 0) {
      return [];
    }

    return obligations
      .map(obligation => (
        {
          obligation,
          reserve: availableReserves.get(obligation.info.borrowReserve.toBase58()) as ParsedAccount<LendingReserve>
        }
      ))
      .filter(item => item.reserve)
      .map(item => {
        // TODO: calculate LTV 
        const ltv = 81;
        const liquidationThreshold = item.reserve.info.config.liquidationThreshold;
        const health = (ltv - liquidationThreshold) / liquidationThreshold
        return {
          obligation: item.obligation,
          ltv,
          liquidationThreshold,
          health
        }
      })
      .filter(item => item.ltv > item.liquidationThreshold)
      .sort((a, b) => b.health - a.health);
  }, [obligations, availableReserves]);

  return {
    liquidableObligations
  };
} 