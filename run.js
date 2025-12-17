const { getPerfumes } = require('./generated/getPerfumes.js'); // adjust filename if needed


console.log('Starting...');
(async () => {
    const result = await getPerfumes(1, 15);
    console.log(JSON.stringify(result, null, 2));
})();
