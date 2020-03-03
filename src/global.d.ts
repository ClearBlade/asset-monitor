interface PromiseConstructor {
    runQueue: () => void;
}

declare const log: { (s: unknown): void };

// native library needs lower case
// eslint-disable-next-line @typescript-eslint/class-name-casing
declare class geo {
    constructor(type: string);
    Point(lat: number, lng: number): number[];
    Polygon(polygon: Array<number[]>): Array<number[]>;
    Within(polygon: Array<number[]>, point: number[]): boolean;
}
