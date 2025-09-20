function formatAmount(amount) {
    if (amount < 100000) {
        return `${amount} Rs`;
    } else {
        const lakhValue = (amount / 100000).toFixed(2);
        const cleanLakhValue = lakhValue.replace(/\.?0+$/, '');
        return `${cleanLakhValue} lakh`;
    }
}

module.exports = {
    formatAmount
}