/**
 * Smart Fund Allocation System
 * Adjusts rebalance orders to match available funds while maintaining portfolio balance
 */

import { RebalanceOrder } from './portfolio';

export interface FundAllocationResult {
  adjustedOrders: RebalanceOrder[];
  totalAvailableFunds: number;
  totalRequiredFunds: number;
  allocationStrategy: 'full' | 'partial' | 'proportional';
  adjustments: {
    orderIndex: number;
    originalAmount: number;
    adjustedAmount: number;
    reason: string;
  }[];
}

/**
 * Smart fund allocation that adjusts orders to match available funds
 */
export function allocateFundsSmartly(
  orders: RebalanceOrder[],
  availableEUR: number,
  availableAssets: Record<string, number>
): FundAllocationResult {
  const result: FundAllocationResult = {
    adjustedOrders: [...orders],
    totalAvailableFunds: availableEUR,
    totalRequiredFunds: 0,
    allocationStrategy: 'full',
    adjustments: []
  };

  // Separate sell and buy orders
  const sellOrders = orders.filter(order => order.side === 'sell');
  const buyOrders = orders.filter(order => order.side === 'buy');

  // Compute EUR requirements and planned frees
  const totalBuyEurPlanned = buyOrders.reduce((sum, o) => sum + Math.max(0, o.difference), 0);
  const totalSellEurPlanned = sellOrders.reduce((sum, o) => sum + Math.max(0, Math.abs(o.difference)), 0);

  // Preserve portfolio value: only free what we can actually deploy
  // If planned sells exceed needed buys (plus small fee buffer), scale sells down proportionally
  const FEE_BUFFER = 0.01; // €0.01 buffer to avoid rounding issues
  const eurNeededBeyondCash = Math.max(0, totalBuyEurPlanned + FEE_BUFFER - availableEUR);
  if (totalSellEurPlanned > 0 && eurNeededBeyondCash < totalSellEurPlanned) {
    const scale = Math.max(0, Math.min(1, eurNeededBeyondCash / totalSellEurPlanned));
    if (scale < 1) {
      sellOrders.forEach((order) => {
        // Scale volume and EUR difference (difference is negative for sell)
        const originalVolume = order.volume;
        const originalDiff = order.difference;
        const newVolume = originalVolume * scale;
        const newDiff = originalDiff * scale; // remains negative

        // Apply to adjustedOrders (preserve order index by identity)
        const i = result.adjustedOrders.findIndex(o => o === order);
        if (i >= 0) {
          result.adjustments.push({
            orderIndex: i,
            originalAmount: Math.abs(originalDiff),
            adjustedAmount: Math.abs(newDiff),
            reason: 'Scaled sell to match executable buys and preserve portfolio value'
          });
          result.adjustedOrders[i] = {
            ...result.adjustedOrders[i],
            volume: newVolume,
            difference: newDiff,
          };
        }
      });

      // Recompute available funds after scaling
      const scaledSellEur = totalSellEurPlanned * scale;
      result.totalAvailableFunds = availableEUR + scaledSellEur;
    }
  }

  // Calculate total funds that will be available after all sell orders
  let totalFundsFromSells = availableEUR;
  for (const sellOrder of sellOrders) {
    const availableAmount = availableAssets[sellOrder.symbol] || 0;
    if (availableAmount >= sellOrder.volume) {
      // Full sell order can be executed - add the full difference to available funds
      totalFundsFromSells += Math.abs(sellOrder.difference);
    } else {
      // Adjust sell order to available amount
      const adjustedVolume = availableAmount;
      const adjustedDifference = adjustedVolume * (Math.abs(sellOrder.difference) / sellOrder.volume);
      
      const adjustment = {
        orderIndex: orders.indexOf(sellOrder),
        originalAmount: sellOrder.volume,
        adjustedAmount: adjustedVolume,
        reason: `Insufficient ${sellOrder.symbol} balance: ${availableAmount.toFixed(6)} < ${sellOrder.volume.toFixed(6)}`
      };
      
      result.adjustments.push(adjustment);
      
      // Update the order
      const orderIndex = orders.indexOf(sellOrder);
      result.adjustedOrders[orderIndex] = {
        ...sellOrder,
        volume: adjustedVolume,
        difference: sellOrder.difference > 0 ? adjustedDifference : -adjustedDifference,
        currentValue: adjustedVolume * (sellOrder.currentValue / sellOrder.volume),
        targetValue: sellOrder.targetValue,
      };
      
      // Add the adjusted difference to available funds
      totalFundsFromSells += adjustedDifference;
    }
  }

  // Calculate total funds needed for buy orders
  const totalFundsNeeded = buyOrders.reduce((total, order) => total + Math.abs(order.difference), 0);
  result.totalRequiredFunds = totalFundsNeeded;
  result.totalAvailableFunds = totalFundsFromSells;

  // If we have enough funds, no adjustment needed
  if (totalFundsFromSells >= totalFundsNeeded) {
    result.allocationStrategy = 'full';
    return result;
  }

      // If we don't have enough funds, check if we can execute any orders
      if (totalFundsFromSells < 0.01) {
        // Not enough funds for any meaningful trades, skip all buy orders
        result.allocationStrategy = 'partial';
        console.log(`[SmartAllocation] Insufficient funds: €${totalFundsFromSells.toFixed(2)} available, €${totalFundsNeeded.toFixed(2)} needed - skipping all buy orders`);
        
        for (const buyOrder of buyOrders) {
          const adjustment = {
            orderIndex: orders.indexOf(buyOrder),
            originalAmount: Math.abs(buyOrder.difference),
            adjustedAmount: 0,
            reason: 'Insufficient funds - order skipped'
          };
          
          result.adjustments.push(adjustment);
          
          const orderIndex = orders.indexOf(buyOrder);
          result.adjustedOrders[orderIndex] = {
            ...buyOrder,
            volume: 0,
            difference: 0,
            currentValue: buyOrder.currentValue,
            targetValue: 0,
          };
        }
      } else {
        // Scale buy orders proportionally
        result.allocationStrategy = 'proportional';
        const scaleFactor = totalFundsFromSells / totalFundsNeeded;

        console.log(`[SmartAllocation] Insufficient funds: €${totalFundsFromSells.toFixed(2)} available, €${totalFundsNeeded.toFixed(2)} needed`);
        console.log(`[SmartAllocation] Scaling buy orders by factor: ${scaleFactor.toFixed(4)}`);

        // Adjust each buy order proportionally
        for (const buyOrder of buyOrders) {
          const originalAmount = Math.abs(buyOrder.difference);
          const adjustedAmount = originalAmount * scaleFactor;
          
          const adjustment = {
            orderIndex: orders.indexOf(buyOrder),
            originalAmount: originalAmount,
            adjustedAmount: adjustedAmount,
            reason: `Insufficient funds: scaled down by ${(scaleFactor * 100).toFixed(1)}%`
          };
          
          result.adjustments.push(adjustment);
          
          // Update the order
          const orderIndex = orders.indexOf(buyOrder);
          const adjustedVolume = buyOrder.volume * scaleFactor;
          const adjustedDifference = buyOrder.difference > 0 ? adjustedAmount : -adjustedAmount;
          
          result.adjustedOrders[orderIndex] = {
            ...buyOrder,
            volume: adjustedVolume,
            difference: adjustedDifference,
            currentValue: buyOrder.currentValue,
            targetValue: buyOrder.targetValue * scaleFactor,
          };
        }
      }

  return result;
}

/**
 * Alternative allocation strategy: prioritize larger orders
 */
export function allocateFundsByPriority(
  orders: RebalanceOrder[],
  availableEUR: number,
  availableAssets: Record<string, number>
): FundAllocationResult {
  const result: FundAllocationResult = {
    adjustedOrders: [...orders],
    totalAvailableFunds: availableEUR,
    totalRequiredFunds: 0,
    allocationStrategy: 'partial',
    adjustments: []
  };

  // Calculate available funds after sell orders
  let totalFundsFromSells = availableEUR;
  const sellOrders = orders.filter(order => order.side === 'sell');
  
  for (const sellOrder of sellOrders) {
    const availableAmount = availableAssets[sellOrder.symbol] || 0;
    if (availableAmount >= sellOrder.volume) {
      // Full sell order can be executed - add the full difference to available funds
      totalFundsFromSells += Math.abs(sellOrder.difference);
    } else {
      // Adjust sell order to available amount
      const adjustedVolume = availableAmount;
      const adjustedDifference = adjustedVolume * (Math.abs(sellOrder.difference) / sellOrder.volume);
      
      const adjustment = {
        orderIndex: orders.indexOf(sellOrder),
        originalAmount: sellOrder.volume,
        adjustedAmount: adjustedVolume,
        reason: `Insufficient ${sellOrder.symbol} balance`
      };
      
      result.adjustments.push(adjustment);
      
      const orderIndex = orders.indexOf(sellOrder);
      result.adjustedOrders[orderIndex] = {
        ...sellOrder,
        volume: adjustedVolume,
        difference: sellOrder.difference > 0 ? adjustedDifference : -adjustedDifference,
        currentValue: adjustedVolume * (sellOrder.currentValue / sellOrder.volume),
        targetValue: sellOrder.targetValue,
      };
      
      // Add the adjusted difference to available funds
      totalFundsFromSells += adjustedDifference;
    }
  }

  // Sort buy orders by amount (largest first)
  const buyOrders = orders.filter(order => order.side === 'buy')
    .sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference));

  let remainingFunds = totalFundsFromSells;
  
  // Execute buy orders in priority order until funds run out
  for (const buyOrder of buyOrders) {
    const requiredAmount = Math.abs(buyOrder.difference);
    
    if (remainingFunds >= requiredAmount) {
      // Full order can be executed
      remainingFunds -= requiredAmount;
    } else if (remainingFunds > 0) {
      // Partial order can be executed
      const scaleFactor = remainingFunds / requiredAmount;
      const adjustedVolume = buyOrder.volume * scaleFactor;
      const adjustedDifference = buyOrder.difference > 0 ? remainingFunds : -remainingFunds;
      
      const adjustment = {
        orderIndex: orders.indexOf(buyOrder),
        originalAmount: requiredAmount,
        adjustedAmount: remainingFunds,
        reason: `Partial execution: ${(scaleFactor * 100).toFixed(1)}% of order`
      };
      
      result.adjustments.push(adjustment);
      
      const orderIndex = orders.indexOf(buyOrder);
      result.adjustedOrders[orderIndex] = {
        ...buyOrder,
        volume: adjustedVolume,
        difference: adjustedDifference,
        currentValue: buyOrder.currentValue,
        targetValue: buyOrder.targetValue * scaleFactor,
      };
      
      remainingFunds = 0;
    } else {
      // No funds left, skip this order
      const adjustment = {
        orderIndex: orders.indexOf(buyOrder),
        originalAmount: requiredAmount,
        adjustedAmount: 0,
        reason: 'Insufficient funds - order skipped'
      };
      
      result.adjustments.push(adjustment);
      
      const orderIndex = orders.indexOf(buyOrder);
      result.adjustedOrders[orderIndex] = {
        ...buyOrder,
        volume: 0,
        difference: 0,
        currentValue: buyOrder.currentValue,
        targetValue: 0,
      };
    }
  }

  result.totalRequiredFunds = buyOrders.reduce((total, order) => total + Math.abs(order.difference), 0);
  result.totalAvailableFunds = totalFundsFromSells;

  return result;
}

/**
 * Validate that adjusted orders maintain portfolio balance
 */
export function validateAdjustedOrders(originalOrders: RebalanceOrder[], adjustedOrders: RebalanceOrder[]): {
  valid: boolean;
  netChange: number;
  warnings: string[];
} {
  const warnings: string[] = [];
  
  // Calculate net EUR change for original orders
  const originalNetChange = originalOrders.reduce((total, order) => {
    return total + (order.side === 'sell' ? Math.abs(order.difference) : -Math.abs(order.difference));
  }, 0);
  
  // Calculate net EUR change for adjusted orders
  const adjustedNetChange = adjustedOrders.reduce((total, order) => {
    return total + (order.side === 'sell' ? Math.abs(order.difference) : -Math.abs(order.difference));
  }, 0);
  
  const netChangeDifference = Math.abs(originalNetChange - adjustedNetChange);
  
  if (netChangeDifference > 0.01) {
    warnings.push(`Portfolio balance changed by €${netChangeDifference.toFixed(2)} due to fund allocation`);
  }
  
  // Check if any orders were completely skipped
  const skippedOrders = adjustedOrders.filter(order => order.volume === 0 && order.difference === 0);
  if (skippedOrders.length > 0) {
    warnings.push(`${skippedOrders.length} orders were skipped due to insufficient funds`);
  }
  
  return {
    valid: netChangeDifference < 1.0, // Allow small differences
    netChange: adjustedNetChange,
    warnings
  };
}
