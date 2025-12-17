const { getOrders } = require('./generated/getOrders.js'); // adjust filename if needed


console.log('Starting...');
(async () => {
    const result = await getOrders(1, 20);
    console.log(JSON.stringify(result, null, 2));
})();
