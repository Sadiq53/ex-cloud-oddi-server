function formatWeight(weightInKg) {
  const formatValue = (value) => {
    if (typeof value !== "number" || isNaN(value)) {
      return "0.00";
    }
    return Number(value.toFixed(2)).toString();
  };

  if (weightInKg >= 1000) {
    return `${formatValue(weightInKg / 1000)} ton`;
  } else {
    return `${formatValue(weightInKg)} kg`;
  }
}

function formatPrice(price) {
  const formatValue = (value) => {
    if (typeof value !== "number" || isNaN(value)) {
      return "0.00";
    }
    return Number(value.toFixed(2)).toString();
  };

  if (typeof price === "number" && price >= 100000) {
    return `${formatValue(price / 100000)} lakh`;
  } else if (typeof price === "number") {
    return `${formatValue(price)} Rs`;
  } else {
    return "0.00 Rs";
  }
}

module.exports = { formatWeight, formatPrice };