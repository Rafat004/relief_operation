// Binary Max-Heap for ranking demands by urgency score
// Used to extract top-K most urgent demands in O(n log n)

import { Demand } from "../types";

export class BinaryMaxHeap {
  private heap: Demand[] = [];

  private parent(i: number): number { return Math.floor((i - 1) / 2); }
  private left(i: number): number { return 2 * i + 1; }
  private right(i: number): number { return 2 * i + 2; }

  private swap(i: number, j: number): void {
    [this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]];
  }

  private siftUp(i: number): void {
    while (i > 0 && this.heap[this.parent(i)].urgency_score < this.heap[i].urgency_score) {
      this.swap(i, this.parent(i));
      i = this.parent(i);
    }
  }

  private siftDown(i: number): void {
    let largest = i;
    const l = this.left(i);
    const r = this.right(i);

    if (l < this.heap.length && this.heap[l].urgency_score > this.heap[largest].urgency_score) {
      largest = l;
    }
    if (r < this.heap.length && this.heap[r].urgency_score > this.heap[largest].urgency_score) {
      largest = r;
    }
    if (largest !== i) {
      this.swap(i, largest);
      this.siftDown(largest);
    }
  }

  insert(demand: Demand): void {
    this.heap.push(demand);
    this.siftUp(this.heap.length - 1);
  }

  extractMax(): Demand | undefined {
    if (this.heap.length === 0) return undefined;
    const max = this.heap[0];
    const last = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.siftDown(0);
    }
    return max;
  }

  size(): number { return this.heap.length; }
}

export interface RankingResult {
  rankedDemands: Demand[];
  runtimeMs: number;
}

/**
 * Algorithm 1: RANK — Sort demands by urgency score using a binary max-heap.
 * Time: O(n log n), Space: O(n)
 */
export function rankDemands(demands: Demand[]): RankingResult {
  const start = performance.now();

  const heap = new BinaryMaxHeap();
  for (const d of demands) {
    heap.insert(d);
  }

  const ranked: Demand[] = [];
  while (heap.size() > 0) {
    ranked.push(heap.extractMax()!);
  }

  const runtimeMs = Math.round((performance.now() - start) * 100) / 100;
  return { rankedDemands: ranked, runtimeMs };
}
