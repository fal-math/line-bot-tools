export class CardShufffle {
  /**
   * Fisher–Yates でシャッフルして先頭 size 件抽出 & 昇順ソート
   */
  private chooseAndSort(size: number, source: number[]): number[] {
    if (size <= 0) return [];
    const arr = [...source];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.slice(0, size).sort((a, b) => a - b);
  }

  /**
   * ベースと残りから混在リストを生成して昇順ソート
   */
  private mixAndSort(base: number[], all: number[], pickBase: number, pickRest: number): number[] {
    const fromBase = this.chooseAndSort(pickBase, base);
    const fromRest = this.chooseAndSort(pickRest, all.filter(n => !base.includes(n)));
    return [...fromBase, ...fromRest].sort((a, b) => a - b);
  }

  private nums = Array.from({ length: 10 }, (_, i) => i);
  private hira = ['あ', 'い', 'う', 'え', 'お', 'か', 'き', 'く', 'け', 'こ'];
  private kata = ['サ', 'シ', 'ス', 'セ', 'ソ', 'タ', 'チ', 'ツ', 'テ', 'ト'];
  private kanji = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
  private charSets = [this.hira, this.kata, this.kanji] as const;

  public do() {
    const numLists: number[][] = [];
    numLists.push(this.chooseAndSort(5, this.nums));
    numLists.push(this.chooseAndSort(5, this.nums));
    numLists.push(this.chooseAndSort(5, this.nums));
    numLists.push(this.mixAndSort(numLists[0], this.nums, 2, 3));
    numLists.push(this.mixAndSort(numLists[1], this.nums, 2, 3));
    numLists.push(this.mixAndSort(numLists[2], this.nums, 2, 3));

    const clubCardLists = numLists.map((list, idx) => {
      const set = idx < 3 ? this.charSets[idx] : this.charSets[(idx - 3)];
      return list.map(i => set[i]);
    });

    const myCardsLists: number[][] = [];
    myCardsLists.push(this.chooseAndSort(5, this.nums));
    myCardsLists.push(this.chooseAndSort(5, this.nums));
    myCardsLists.push(this.mixAndSort(myCardsLists[0], this.nums, 2, 3));
    myCardsLists.push(this.mixAndSort(myCardsLists[1], this.nums, 2, 3));
    myCardsLists.push(this.mixAndSort(myCardsLists[2], this.nums, 2, 3));
    myCardsLists.push(this.mixAndSort(myCardsLists[3], this.nums, 2, 3));

    const order = ["一の位", "十の位"];
    const clubCardsStr = clubCardLists
      .map((lst, i) => `  ${i + 1}試合目: ${lst.join(', ')}`)
      .join("\n");
    const myCardsStr = myCardsLists
      .map((lst, i) => `  ${i + 1}試合目: ${order[i % 2]}が${lst.join(', ')}`)
      .join("\n");

    return { clubCardsStr, myCardsStr };
  }
}