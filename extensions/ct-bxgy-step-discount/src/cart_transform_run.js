// @ts-check

/**
 * @typedef {import("../generated/api").CartTransformRunInput} CartTransformRunInput
 * @typedef {import("../generated/api").CartTransformRunResult} CartTransformRunResult
 */

/**
 * @type {CartTransformRunResult}
 */
const NO_CHANGES = {
  operations: [],
};

/**
 * @param {CartTransformRunInput} input
 * @returns {CartTransformRunResult}
 */
export function cartTransformRun(input) {
  const customer = input.cart.buyerIdentity?.customer;
  const customerEmail = customer?.email || "";
  if (customerEmail && customerEmail.endsWith('@levi.com')) {
    console.log("IS LEVIS EMPLOYEE", customerEmail);
    return NO_CHANGES;
  }


  const eligibleLines = [];
  input.cart.lines.forEach((line) => {
    const qty = Number(line.quantity ?? 0);

    const merch = line.merchandise;
    const hasTag =
      merch &&
      merch.__typename === 'ProductVariant' &&
      merch.product &&
      merch.product.hasAnyTag === true;

    if (hasTag) {
      eligibleLines.push({
        line,
        quantity: qty,
      });
    }
  });

  console.log("Eligible Items", JSON.stringify(eligibleLines));
  
  // Calculate total quantity of all products with the tag
  const totalQuantity = eligibleLines.reduce((sum, item) => sum + item.quantity, 0);

  // Only apply transform if total quantity > 3
  if (totalQuantity < 2) {
    return NO_CHANGES;
  }

  // Build update operations for all eligible lines
  const operations = eligibleLines.reduce(
    (acc, { line }) => {
      const updateOperation = buildUpdateOperation(line);

      if (updateOperation) {
        return [...acc, { lineUpdate: updateOperation }];
      }

      return acc;
    },
    []
  );

  return operations.length > 0 ? { operations } : NO_CHANGES;
};

function buildUpdateOperation(cartLine) {
  const compareAtAmount = cartLine.cost?.compareAtAmountPerQuantity?.amount;
  
  // Only update if compareAtAmount exists
  if (!compareAtAmount) {
    return null;
  }
  
  const currentAmount = cartLine.cost?.amountPerQuantity?.amount;
  
  // Skip if compareAtAmount is the same as current price
  if (compareAtAmount === currentAmount) {
    return null;
  }
  
  return {
    cartLineId: cartLine.id,
    price: {
      adjustment: {
        fixedPricePerUnit: {
          amount: compareAtAmount,
        },
      },
    },
  };
}