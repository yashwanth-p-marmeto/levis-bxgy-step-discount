import {
  DiscountClass,
  ProductDiscountSelectionStrategy,
} from '../generated/api';


/**
  * @typedef {import("../generated/api").CartInput} RunInput
  * @typedef {import("../generated/api").CartLinesDiscountsGenerateRunResult} CartLinesDiscountsGenerateRunResult
  */

/**
  * @param {RunInput} input
  * @returns {CartLinesDiscountsGenerateRunResult}
  */

export function cartLinesDiscountsGenerateRun(input) {
  if (!input.cart.lines.length) {
    throw new Error('No cart lines found');
  }
  const customer = input.cart.buyerIdentity?.customer;
  const customerEmail = customer?.email || "";
  if (customerEmail && customerEmail.endsWith('@levi.com')) {
    console.log("IS LEVIS EMPLOYEE", customerEmail);
    return {
      operations: [],
    };
  }

  const hasProductDiscountClass = input.discount.discountClasses.includes(
    DiscountClass.Product,
  );

  if (!hasProductDiscountClass) {
    return { operations: [] };
  }

  const operations = [];
  const targets = [];
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

  const totalQuantity = eligibleLines.reduce((sum, item) => sum + item.quantity, 0);
  console.log("Total Quantity ", totalQuantity);

  let message;
  let value;
  
  if (totalQuantity >= 3) {
    eligibleLines.forEach((item) => {
      targets.push({
        cartLine: {
          id: item.line.id,
        },
      });
    });
    message = "BUY 3 GET 60% OFF";
    value = 60;
  } else if (totalQuantity === 2) {
    eligibleLines.forEach((item) => {
      targets.push({
        cartLine: {
          id: item.line.id,
        },
      });
    });
    message = "BUY 2 GET 50% OFF";
    value = 50;
  }

  if (targets.length === 0) {
    return { operations: [] };
  }

  console.log("Targets", JSON.stringify(eligibleLines));
  console.log("Message", message);
  console.log("Value", value);

  operations.push({
    productDiscountsAdd: {
      candidates: [
        {
          message: message,
          targets: targets,
          value: {
            percentage: {
              value: value,
            },
          },
        },
      ],
      selectionStrategy: ProductDiscountSelectionStrategy.First,
    },
  });

  return {
    operations,
  };
}