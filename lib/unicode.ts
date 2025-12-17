// Unicode data handling classes - TypeScript version
// Adapted from unicode.js for Next.js

interface CodePointData {
    id: number;
    name: string;
    general_category: string;
    canonical_combining_class: string;
    bidi_class: string;
    decomposition_type: string;
    decomposition_mapping: string;
    numeric_type: string;
    numeric_value: string;
    bidi_mirrored: string;
    unicode_1_name: string;
    iso_comment: string;
    simple_uppercase_mapping: string;
    simple_lowercase_mapping: string;
    simple_titlecase_mapping: string;
}

interface PoolItem {
    id: number;
    name: string;
    description: string;
    char: string;
    weight: number;
}

export class UnicodeData {
    private data: { [key: number]: CodePointData } = {};

    parseLine(line: string): CodePointData {
        const codePointList = line.split(";");
        const codePointData: CodePointData = {
            id: parseInt(codePointList[0], 16),
            name: codePointList[1],
            general_category: codePointList[2],
            canonical_combining_class: codePointList[3],
            bidi_class: codePointList[4],
            decomposition_type: codePointList[5],
            decomposition_mapping: codePointList[6],
            numeric_type: codePointList[7],
            numeric_value: codePointList[8],
            bidi_mirrored: codePointList[9],
            unicode_1_name: codePointList[10],
            iso_comment: codePointList[11],
            simple_uppercase_mapping: codePointList[12],
            simple_lowercase_mapping: codePointList[13],
            simple_titlecase_mapping: codePointList[14],
        };
        return codePointData;
    }

    getHangulSyllableName(id: number): string {
        const initials = ["g", "gg", "n", "d", "dd", "r", "m", "b", "bb", "s", "ss", "", "j", "jj", "ch", "k", "t", "p", "h"]; // ㄱ ㄲ ㄴ ㄷ ㄸ ㄹ ㅁ ㅂ ㅃ ㅅ ㅆ ㅇ ㅈ ㅉ ㅊ ㅋ ㅌ ㅍ ㅎ
        const vowels = ["a", "ae", "ya", "yae", "eo", "e", "yeo", "ye", "o", "wa", "wae", "oe", "yo", "u", "weo", "we", "wi", "yu", "eu", "ui", "i"]; // ㅏ ㅐ ㅑ ㅒ ㅓ ㅔ ㅕ ㅖ ㅗ ㅘ ㅙ ㅚ ㅛ ㅜ ㅝ ㅞ ㅟ ㅠ ㅡ ㅢ ㅣ
        const finals = ["", "g", "gg", "gs", "n", "nj", "nh", "d", "l", "lg", "lm", "lb", "ls", "lt", "lp", "lh", "m", "b", "bs", "s", "ss", "ng", "j", "ch", "k", "t", "p", "h"]; // ∅ ㄱ ㄲ ㄳ ㄴ ㄵ ㄶ ㄷ ㄹ ㄺ ㄻ ㄼ ㄽ ㄾ ㄿ ㅀ ㅁ ㅂ ㅄ ㅅ ㅆ ㅇ ㅈ ㅊ ㅋ ㅌ ㅍ ㅎ
        // 19*21*28
        const order = id - 0xAC00;
        const initial = initials[Math.floor(order / 588)];
        const vowel = vowels[Math.floor((order % 588) / 28)];
        const final = finals[order % 28];
        return `${initial}${vowel}${final}`;
    }
    
    addRange(rangeFirst: number, rangeLast: number, rangeName: string, codePointData: CodePointData): void {
        const isHangul = rangeName.includes("Hangul");
        for (let id = rangeFirst; id <= rangeLast; id++) {
            const newCodePointData = { ...codePointData };
            newCodePointData.id = id;
            if (isHangul) {
                newCodePointData.name = `${rangeName} ${this.getHangulSyllableName(id)}`.toUpperCase();
            } else {
                newCodePointData.name = `${rangeName} ${id.toString(16)}`.toUpperCase();
            }
            this.data[id] = newCodePointData;
        }
    }

    async addUnicodeData(rangeStart: number = 0, rangeEnd: number = 65535): Promise<void> {
        let fileContent: string;
        if (typeof window === 'undefined') {
            // Server-side (Node.js) environment
            const fs = await import('fs');
            const path = await import('path');
            const filePath = path.join(process.cwd(), 'public', 'data', 'UnicodeData.txt');
            fileContent = fs.readFileSync(filePath, "utf-8");
        } else {
            // Client-side (browser) environment
            const response = await fetch("/data/UnicodeData.txt");
            fileContent = await response.text();
        }
        const lines = fileContent.split("\n");
        let rangeFirst = 0;
        
        for (const line of lines) {
            if (line.startsWith("#")) {
                continue;
            }
            const codePointData = this.parseLine(line);
            if (codePointData.id < rangeStart || codePointData.id > rangeEnd) {
                continue;
            }
            if (isNaN(codePointData.id)) {
                continue;
            }
            if (codePointData.name.endsWith(">")) {
                if (codePointData.name.endsWith("First>")) {
                    rangeFirst = codePointData.id;
                    continue;
                } else if (codePointData.name.endsWith("Last>")) {
                    const rangeLast = codePointData.id;
                    const rangeName = codePointData.name.slice(1, -7);
                    if (rangeName.includes("CJK") || rangeName.includes("Hangul")) {
                        this.addRange(rangeFirst, rangeLast, rangeName, codePointData);
                        continue;
                    } else {
                        continue;
                    }
                } else {
                    continue;
                }
            }
            this.data[codePointData.id] = codePointData;
        }
    }
    
    getCodePoint(id: number): CodePointData | null {
        if (!(id in this.data)) {
            return null;
        }
        return this.data[id];
    }
}

export class Pool {
    protected items: PoolItem[] = [];

    addItem(item: PoolItem): void {
        this.items.push(item);
    }
    
    draw(amount: number = 1): PoolItem[] {
        if (this.items.length === 0 || amount <= 0) {
            return [];
        }
        const totalWeight = this.items.reduce((sum, item) => sum + item.weight, 0);
        let results: PoolItem[] = [];
        for (let i = 0; i < amount; i++) {
            let randomValue = Math.random() * totalWeight;
            for (const item of this.items) {
                if (randomValue < item.weight) {
                    results.push(item);
                    break;
                }
                randomValue -= item.weight;
            }
        }
        return results;
    }
}

// Define unicodeData at module level first (using let so it can be referenced)
let unicodeData: UnicodeData | undefined;

export class UnicodeBMPPool extends Pool {
    private unicodeData: UnicodeData;
    private unicodeDataInitialized: boolean = false;

    constructor(unicodeDataParam?: UnicodeData) {
        super();
        // Reference the module-level unicodeData variable (like Python does)
        if (unicodeDataParam === undefined) {
            if (unicodeData === undefined || unicodeData === null) {
                this.unicodeData = new UnicodeData();
                // Note: addUnicodeData is now async, so initialization must be awaited
                this.unicodeDataInitialized = false;
            } else {
                this.unicodeData = unicodeData;
                this.unicodeDataInitialized = true;
            }
        } else {
            this.unicodeData = unicodeDataParam;
            this.unicodeDataInitialized = true;
        }
        // Items will be added after initialization
    }

    async initialize(): Promise<void> {
        if (!this.unicodeDataInitialized) {
            await this.unicodeData.addUnicodeData(0, 65535);
            this.unicodeDataInitialized = true;
        }
        // Build the pool items
        for (let id = 0; id < 65536; id++) {
            const codePointData = this.unicodeData.getCodePoint(id);
            if (codePointData === null) {
                continue;
            }
            this.addItem({ id: id, name: codePointData.name, description: "", char: String.fromCharCode(id), weight: 1 });
        }
    }
}

// Initialize it (async, so this will be a promise in browser)
export async function initUnicodeData(): Promise<UnicodeData> {
    unicodeData = new UnicodeData();
    await unicodeData.addUnicodeData(0, 65535);
    return unicodeData;
}

