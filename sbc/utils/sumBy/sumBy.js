export const sumBy = (config) => {
    const { array, key, transform = "number" } = config;
    return array.reduce((acc, obj) => {
        let value;
        if (key && typeof obj === "object" && obj !== null) {
            value = obj[key];
        }
        else {
            value = obj;
        }
        switch (transform) {
            case "number":
                value = Number(value);
                break;
            case "string":
                value = String(value);
                break;
            case "json":
                try {
                    value = JSON.parse(value);
                }
                catch {
                    throw new Error(`Invalid JSON: ${value}`);
                }
                break;
        }
        if (typeof value === "number" && !isNaN(value)) {
            return acc + value;
        }
        return acc;
    }, 0);
};
// // Case 1: Array of objects
// const txs = [{ amt: "10" }, { amt: "12" }, { amt: "7" }];
// console.log(sumBy({ array: txs, key: "amt", transform: "number" }));
// // 29
// // Case 2: Array of numbers
// const nums = [10, 20, 30];
// console.log(sumBy({ array: nums }));
// // 60
// // Case 3: Array of strings (numbers in string form)
// const strNums = ["5", "15", "20"];
// console.log(sumBy({ array: strNums, transform: "number" }));
// // 40
// // Case 4: Array of JSON strings
// const jsonArr = ['{"v":10}', '{"v":20}'];
// console.log(sumBy({ array: jsonArr.map(j => JSON.parse(j).v) }));
// // 30
