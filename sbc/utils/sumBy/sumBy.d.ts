type TransformType = "number" | "string" | "json";
interface SumByConfig<T> {
    array: T[];
    key?: keyof T & string;
    transform?: TransformType;
}
export declare const sumBy: <T extends Record<string, any> | number | string>(config: SumByConfig<T>) => number;
export {};
//# sourceMappingURL=sumBy.d.ts.map