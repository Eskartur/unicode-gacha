// Unicode data handling classes - TypeScript version
// Adapted from unicode.js for Next.js
interface CJKReading {
    field: string;
    text: string;
}

interface CJKData {
    readings: CJKReading[];
}

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

interface BlockData {
    id: number;
    start: number;
    end: number;
    name: string;
    color: string;
}

interface PoolItem {
    id: number;
    weight: number;
}

interface CardData {
    id: number;
    name: string;
    description: string;
    char: string;
    blockName: string;
    blockColor: string;
}

export class UnicodeData {
    private data: { [key: number]: CodePointData } = {};
    private blocks: BlockData[] = [];
    private cjkData: { [key: number]: CJKData } = {};

    parseCodePoint(line: string): CodePointData {
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

    parseBlock(line: string): BlockData {
        const blockList = line.split(";");
        const blockRange = blockList[0].split("..");
        const blockStart = parseInt(blockRange[0], 16);
        const blockEnd = parseInt(blockRange[1], 16);
        const blockName = blockList[1];
        return { id: 0, start: blockStart, end: blockEnd, name: blockName, color: "" };
    }

    parseCJKReading(line: string): {id: number, reading: CJKReading} {
        const cjkReadingList = line.split("\t");
        const codePoint = parseInt(cjkReadingList[0].replace("U+", ""), 16);
        const field = cjkReadingList[1];
        const text = cjkReadingList[2];
        return { id: codePoint, reading: { field: field, text: text } };
    }

    async loadBlocks(): Promise<void> {
        this.blocks = [];
        let fileContent: string;
        if (typeof window === 'undefined') {
            // Server-side (Node.js) environment
            const fs = await import('fs');
            const path = await import('path');
            const filePath = path.join(process.cwd(), 'public', 'data', 'Blocks.txt');
            fileContent = fs.readFileSync(filePath, "utf-8");
        } else {
            // Client-side (browser) environment
            const response = await fetch("/data/Blocks.txt");
            fileContent = await response.text();
        }
        const lines = fileContent.split("\n");
        let blockID = 0;
        for (const line of lines) {
            if (line.startsWith("#") || line.trim() === "") {
                continue;
            }
            const blockData = this.parseBlock(line);
            // color from name hash)
            const mod = (n: number, m: number) => (n % m + m) % m;
            const color = `#${mod(blockData.name.split("").reduce((hash: number, char: string) => {
                return ((hash << 5) - hash) + char.charCodeAt(0);
            }, 0), 0xFFFFFF).toString(16).padStart(6, '0')}`;
            this.blocks.push({ ...blockData, id: blockID, color: color });
            blockID++;
        }
    }

    async loadCJKData(): Promise<void> {
        this.cjkData = {};
        let fileContent: string;
        if (typeof window === 'undefined') {
            const fs = await import('fs');
            const path = await import('path');
            const filePath = path.join(process.cwd(), 'public', 'data', 'CJKData.txt');
            fileContent = fs.readFileSync(filePath, "utf-8");
        } else {
            const response = await fetch("/data/Unihan/Unihan_Readings.txt");
            fileContent = await response.text();
        }
        const lines = fileContent.split("\n");
        for (const line of lines) {
            if (line.startsWith("#") || line.trim() === "") {
                continue;
            }
            const { id, reading } = this.parseCJKReading(line);
            if (!(id in this.cjkData)) {
                this.cjkData[id] = { readings: [] };
            }
            this.cjkData[id].readings.push(reading);
        }
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
            const codePointData = this.parseCodePoint(line);
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

    getBlock(codePoint: number): BlockData | null {
        if (this.blocks.length === 0) {
            return null;
        }
        for (const block of this.blocks) {
            if (codePoint >= block.start && codePoint <= block.end) {
                return block;
            }
        }
        return null;
    }

    getCJKReading(id: number): CJKReading[] {
        if (!(id in this.cjkData)) {
            return [];
        }
        return this.cjkData[id].readings;
    }

    getCardData(id: number): CardData | null {
        const codePointData = this.getCodePoint(id);
        if (codePointData === null) {
            return null;
        }
        const cjkReadings = this.getCJKReading(id);
        let description = `Name: ${codePointData.name}`;
        const block = this.getBlock(id);
        description += `\nBlock: ${block?.name || "Unknown"}`
        description += `\n${cjkReadings.map(reading => `${reading.field.slice(1)}: ${reading.text}`).join("\n")}`;
        return { id: id,
            name: codePointData.name,
            description: description,
            char: String.fromCharCode(id),
            blockName: block?.name || "",
            blockColor: block?.color || "#ffffff"
        };
    }
}

export class Pool {
    protected items: PoolItem[] = [];
    protected unicodeData: UnicodeData;
    protected unicodeDataInitialized: boolean = false;

    constructor(unicodeDataParam?: UnicodeData) {
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

    drawCard(amount: number = 1): CardData[] {
        const results = this.draw(amount);
        return results.map(item => this.unicodeData.getCardData(item.id) as CardData);
    }
}

// Define unicodeData at module level first (using let so it can be referenced)
let unicodeData: UnicodeData | undefined;

export class UnicodeBMPPool extends Pool {

    async initialize(): Promise<void> {
        // Build the pool items
        for (let id = 0; id < 65536; id++) {
            const codePointData = this.unicodeData.getCodePoint(id);
            // const block = this.unicodeData.getBlock(id);
            if (codePointData === null) {
                continue;
            }
            // const cjkReadings = this.unicodeData.getCJKReading(id);
            // let description = `Name: ${codePointData.name}`;
            // description += `\nBlock: ${block?.name || "Unknown"}`
            // description += `\n${cjkReadings.map(reading => `${reading.field.slice(1)}: ${reading.text}`).join("\n")}`;
            this.addItem({ id: id, weight: 1 });
        }
    }
}

// Initialize it (async, so this will be a promise in browser)
export async function initUnicodeData(): Promise<UnicodeData> {
    unicodeData = new UnicodeData();
    await unicodeData.addUnicodeData(0, 65535);
    await unicodeData.loadBlocks();
    await unicodeData.loadCJKData();
    return unicodeData;
}

