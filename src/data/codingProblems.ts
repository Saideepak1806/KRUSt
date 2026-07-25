export interface TestCase {
  input: string;
  expected: string;
  actual?: string;
  passed?: boolean;
}

export interface Problem {
  id: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  description: string;
  constraints: string[];
  testCases: TestCase[];
  starterTemplates: Record<string, string>;
}

export const PRESET_PROBLEMS: Problem[] = [
  {
    id: "two_sum",
    title: "Two Sum",
    difficulty: "easy",
    category: "Arrays & Hashing",
    description: "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have **exactly one solution**, and you may not use the same element twice.\n\nYou can return the answer in any order.",
    constraints: [
      "2 <= nums.length <= 10^4",
      "-10^9 <= nums[i] <= 10^9",
      "-10^9 <= target <= 10^9",
      "Only one valid answer exists."
    ],
    testCases: [
      { input: "nums = [2,7,11,15], target = 9", expected: "[0,1]" },
      { input: "nums = [3,2,4], target = 6", expected: "[1,2]" },
      { input: "nums = [3,3], target = 6", expected: "[0,1]" }
    ],
    starterTemplates: {
      python: "class Solution:\n    def twoSum(self, nums: list[int], target: int) -> list[int]:\n        # Write your code here\n        return [0, 1]",
      javascript: "/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number[]}\n */\nfunction twoSum(nums, target) {\n    // Write your code here\n    return [0, 1];\n}",
      typescript: "function twoSum(nums: number[], target: number): number[] {\n    // Write your code here\n    return [0, 1];\n}",
      java: "class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Write your code here\n        return new int[]{0, 1};\n    }\n}",
      cpp: "class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        // Write your code here\n        return {0, 1};\n    }\n};"
    }
  },
  {
    id: "valid_parentheses",
    title: "Valid Parentheses",
    difficulty: "easy",
    category: "Stacks",
    description: "Given a string `s` containing just the characters `'('`, `')'`, `'{'`, `'}'`, `'['` and `']'`, determine if the input string is valid.\n\nAn input string is valid if:\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.\n3. Every close bracket has a corresponding open bracket of the same type.",
    constraints: [
      "1 <= s.length <= 10^4",
      "s consists of parentheses only '()[]{}'."
    ],
    testCases: [
      { input: "s = \"()\"", expected: "true" },
      { input: "s = \"()[]{}\"", expected: "true" },
      { input: "s = \"(]\"", expected: "false" }
    ],
    starterTemplates: {
      python: "class Solution:\n    def isValid(self, s: str) -> bool:\n        # Write your code here\n        return True",
      javascript: "/**\n * @param {string} s\n * @return {boolean}\n */\nfunction isValid(s) {\n    // Write your code here\n    return true;\n}",
      typescript: "function isValid(s: string): boolean {\n    // Write your code here\n    return true;\n}",
      java: "class Solution {\n    public boolean isValid(String s) {\n        // Write your code here\n        return true;\n    }\n}",
      cpp: "class Solution {\npublic:\n    bool isValid(string s) {\n        // Write your code here\n        return true;\n    }\n};"
    }
  },
  {
    id: "reverse_string",
    title: "Reverse String",
    difficulty: "easy",
    category: "Two Pointers",
    description: "Write a function that reverses a string. The input string is given as an array of characters `s`.\n\nYou must do this by modifying the input array in-place with `O(1)` extra memory.",
    constraints: [
      "1 <= s.length <= 10^5",
      "s[i] is a printable ascii character."
    ],
    testCases: [
      { input: "s = [\"h\",\"e\",\"l\",\"l\",\"o\"]", expected: "[\"o\",\"l\",\"l\",\"e\",\"h\"]" },
      { input: "s = [\"H\",\"a\",\"n\",\"n\",\"a\",\"h\"]", expected: "[\"h\",\"a\",\"n\",\"n\",\"a\",\"H\"]" }
    ],
    starterTemplates: {
      python: "class Solution:\n    def reverseString(self, s: list[str]) -> None:\n        # Modify s in-place, do not return anything\n        s.reverse()",
      javascript: "/**\n * @param {character[]} s\n * @return {void} Do not return anything, modify s in-place instead.\n */\nfunction reverseString(s) {\n    // Write your code here\n    s.reverse();\n}",
      typescript: "function reverseString(s: string[]): void {\n    // Modify s in-place\n    s.reverse();\n}",
      java: "class Solution {\n    public void reverseString(char[] s) {\n        // Write your code here\n    }\n}",
      cpp: "class Solution {\npublic:\n    void reverseString(vector<char>& s) {\n        // Write your code here\n    }\n};"
    }
  },
  {
    id: "fizz_buzz",
    title: "Fizz Buzz",
    difficulty: "easy",
    category: "Basic Logic",
    description: "Given an integer `n`, return a string array `answer` (1-indexed) where:\n- `answer[i] == \"FizzBuzz\"` if `i` is divisible by 3 and 5.\n- `answer[i] == \"Fizz\"` if `i` is divisible by 3.\n- `answer[i] == \"Buzz\"` if `i` is divisible by 5.\n- `answer[i] == i` (as a string) if none of the above conditions are true.",
    constraints: [
      "1 <= n <= 10^4"
    ],
    testCases: [
      { input: "n = 3", expected: "[\"1\",\"2\",\"Fizz\"]" },
      { input: "n = 5", expected: "[\"1\",\"2\",\"Fizz\",\"4\",\"Buzz\"]" },
      { input: "n = 15", expected: "[\"1\",\"2\",\"Fizz\",\"4\",\"Buzz\",\"Fizz\",\"7\",\"8\",\"Fizz\",\"Buzz\",\"11\",\"Fizz\",\"13\",\"14\",\"FizzBuzz\"]" }
    ],
    starterTemplates: {
      python: "class Solution:\n    def fizzBuzz(self, n: int) -> list[str]:\n        # Write your code here\n        return []",
      javascript: "/**\n * @param {number} n\n * @return {string[]}\n */\nfunction fizzBuzz(n) {\n    // Write your code here\n    return [];\n}",
      typescript: "function fizzBuzz(n: number): string[] {\n    // Write your code here\n    return [];\n}",
      java: "class Solution {\n    public List<String> fizzBuzz(int n) {\n        // Write your code here\n        return null;\n    }\n}",
      cpp: "class Solution {\npublic:\n    vector<string> fizzBuzz(int n) {\n        // Write your code here\n        return {};\n    }\n};"
    }
  },
  {
    id: "single_number",
    title: "Single Number",
    difficulty: "easy",
    category: "Bit Manipulation",
    description: "Given a **non-empty** array of integers `nums`, every element appears twice except for one. Find that single one.\n\nYou must implement a solution with a linear runtime complexity and use only constant extra space.",
    constraints: [
      "1 <= nums.length <= 3 * 10^4",
      "-3 * 10^4 <= nums[i] <= 3 * 10^4",
      "Each element in the array appears twice except for one."
    ],
    testCases: [
      { input: "nums = [2,2,1]", expected: "1" },
      { input: "nums = [4,1,2,1,2]", expected: "4" },
      { input: "nums = [1]", expected: "1" }
    ],
    starterTemplates: {
      python: "class Solution:\n    def singleNumber(self, nums: list[int]) -> int:\n        # Write your code here\n        return 0",
      javascript: "/**\n * @param {number[]} nums\n * @return {number}\n */\nfunction singleNumber(nums) {\n    // Write your code here\n    return 0;\n}",
      typescript: "function singleNumber(nums: number[]): number {\n    // Write your code here\n    return 0;\n}",
      java: "class Solution {\n    public int singleNumber(int[] nums) {\n        // Write your code here\n        return 0;\n    }\n}",
      cpp: "class Solution {\npublic:\n    int singleNumber(vector<int>& nums) {\n        // Write your code here\n        return 0;\n    }\n};"
    }
  },
  {
    id: "merge_intervals",
    title: "Merge Intervals",
    difficulty: "medium",
    category: "Sorting / Arrays",
    description: "Given an array of `intervals` where `intervals[i] = [start_i, end_i]`, merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input.",
    constraints: [
      "1 <= intervals.length <= 10^4",
      "intervals[i].length == 2",
      "0 <= start_i <= end_i <= 10^4"
    ],
    testCases: [
      { input: "intervals = [[1,3],[2,6],[8,10],[15,18]]", expected: "[[1,6],[8,10],[15,18]]" },
      { input: "intervals = [[1,4],[4,5]]", expected: "[[1,5]]" }
    ],
    starterTemplates: {
      python: "class Solution:\n    def merge(self, intervals: list[list[int]]) -> list[list[int]]:\n        # Write your code here\n        return []",
      javascript: "/**\n * @param {number[][]} intervals\n * @return {number[][]}\n */\nfunction merge(intervals) {\n    // Write your code here\n    return [];\n}",
      typescript: "function merge(intervals: number[][]): number[][] {\n    // Write your code here\n    return [];\n}",
      java: "class Solution {\n    public int[][] merge(int[][] intervals) {\n        // Write your code here\n        return null;\n    }\n}",
      cpp: "class Solution {\npublic:\n    vector<vector<int>> merge(vector<vector<int>>& intervals) {\n        // Write your code here\n        return {};\n    }\n};"
    }
  },
  {
    id: "longest_substring",
    title: "Longest Substring Without Repeating Characters",
    difficulty: "medium",
    category: "Sliding Window",
    description: "Given a string `s`, find the length of the **longest substring** without repeating characters.",
    constraints: [
      "0 <= s.length <= 5 * 10^4",
      "s consists of English letters, digits, symbols and spaces."
    ],
    testCases: [
      { input: "s = \"abcabcbb\"", expected: "3" },
      { input: "s = \"bbbbb\"", expected: "1" },
      { input: "s = \"pwwkew\"", expected: "3" }
    ],
    starterTemplates: {
      python: "class Solution:\n    def lengthOfLongestSubstring(self, s: str) -> int:\n        # Write your code here\n        return 0",
      javascript: "/**\n * @param {string} s\n * @return {number}\n */\nfunction lengthOfLongestSubstring(s) {\n    // Write your code here\n    return 0;\n}",
      typescript: "function lengthOfLongestSubstring(s: string): number {\n    // Write your code here\n    return 0;\n}",
      java: "class Solution {\n    public int lengthOfLongestSubstring(String s) {\n        // Write your code here\n        return 0;\n    }\n}",
      cpp: "class Solution {\npublic:\n    int lengthOfLongestSubstring(string s) {\n        // Write your code here\n        return 0;\n    }\n};"
    }
  },
  {
    id: "group_anagrams",
    title: "Group Anagrams",
    difficulty: "medium",
    category: "Hash Map / Strings",
    description: "Given an array of strings `strs`, group the anagrams together. You can return the answer in any order.\n\nAn Anagram is a word or phrase formed by rearranging the letters of a different word or phrase, typically using all the original letters exactly once.",
    constraints: [
      "1 <= strs.length <= 10^4",
      "0 <= strs[i].length <= 100",
      "strs[i] consists of lowercase English letters."
    ],
    testCases: [
      { input: "strs = [\"eat\",\"tea\",\"tan\",\"ate\",\"nat\",\"bat\"]", expected: "[[\"bat\"],[\"nat\",\"tan\"],[\"ate\",\"eat\",\"tea\"]]" },
      { input: "strs = [\"\"]", expected: "[[\"\"]]" },
      { input: "strs = [\"a\"]", expected: "[[\"a\"]]" }
    ],
    starterTemplates: {
      python: "class Solution:\n    def groupAnagrams(self, strs: list[str]) -> list[list[str]]:\n        # Write your code here\n        return []",
      javascript: "/**\n * @param {string[]} strs\n * @return {string[][]}\n */\nfunction groupAnagrams(strs) {\n    // Write your code here\n    return [];\n}",
      typescript: "function groupAnagrams(strs: string[]): string[][] {\n    // Write your code here\n    return [];\n}",
      java: "class Solution {\n    public List<List<String>> groupAnagrams(String[] strs) {\n        // Write your code here\n        return null;\n    }\n}",
      cpp: "class Solution {\npublic:\n    vector<vector<string>> groupAnagrams(vector<string>& strs) {\n        // Write your code here\n        return {};\n    }\n};"
    }
  },
  {
    id: "flatten_array",
    title: "Flatten Nested Array",
    difficulty: "medium",
    category: "Recursion",
    description: "Given a multi-dimensional array of nested integers/arrays, write a function to flatten it into a single flat array of integers.",
    constraints: [
      "0 <= array.length <= 1000",
      "The nesting depth can be up to 10."
    ],
    testCases: [
      { input: "arr = [1, [2, [3, [4]], 5]]", expected: "[1,2,3,4,5]" },
      { input: "arr = [[1, 2], 3, [4, 5]]", expected: "[1,2,3,4,5]" }
    ],
    starterTemplates: {
      python: "class Solution:\n    def flatten(self, arr: list) -> list[int]:\n        # Write your code here\n        return []",
      javascript: "/**\n * @param {any[]} arr\n * @return {number[]}\n */\nfunction flatten(arr) {\n    // Write your code here\n    return [];\n}",
      typescript: "function flatten(arr: any[]): number[] {\n    // Write your code here\n    return [];\n}",
      java: "class Solution {\n    public List<Integer> flatten(List<Object> arr) {\n        // Write your code here\n        return null;\n    }\n}",
      cpp: "class Solution {\npublic:\n    vector<int> flatten(vector<any> arr) {\n        // Write your code here\n        return {};\n    }\n};"
    }
  },
  {
    id: "coin_change",
    title: "Coin Change",
    difficulty: "medium",
    category: "Dynamic Programming",
    description: "You are given an integer array `coins` representing coins of different denominations and an integer `amount` representing a total amount of money.\n\nReturn the **fewest number of coins** that you need to make up that amount. If that amount of money cannot be made up by any combination of the coins, return `-1`.\n\nYou may assume that you have an infinite number of each kind of coin.",
    constraints: [
      "1 <= coins.length <= 12",
      "1 <= coins[i] <= 2^31 - 1",
      "0 <= amount <= 10^4"
    ],
    testCases: [
      { input: "coins = [1,2,5], amount = 11", expected: "3" },
      { input: "coins = [2], amount = 3", expected: "-1" },
      { input: "coins = [1], amount = 0", expected: "0" }
    ],
    starterTemplates: {
      python: "class Solution:\n    def coinChange(self, coins: list[int], amount: int) -> int:\n        # Write your code here\n        return 0",
      javascript: "/**\n * @param {number[]} coins\n * @param {number} amount\n * @return {number}\n */\nfunction coinChange(coins, amount) {\n    // Write your code here\n    return 0;\n}",
      typescript: "function coinChange(coins: number[], amount: number): number {\n    // Write your code here\n    return 0;\n}",
      java: "class Solution {\n    public int coinChange(int[] coins, int amount) {\n        // Write your code here\n        return 0;\n    }\n}",
      cpp: "class Solution {\npublic:\n    int coinChange(vector<int>& coins, int amount) {\n        // Write your code here\n        return 0;\n    }\n};"
    }
  },
  {
    id: "trapping_rain_water",
    title: "Trapping Rain Water",
    difficulty: "hard",
    category: "Two Pointers",
    description: "Given `n` non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.",
    constraints: [
      "n == height.length",
      "1 <= n <= 2 * 10^4",
      "0 <= height[i] <= 10^5"
    ],
    testCases: [
      { input: "height = [0,1,0,2,1,0,1,3,2,1,2,1]", expected: "6" },
      { input: "height = [4,2,0,3,2,5]", expected: "9" }
    ],
    starterTemplates: {
      python: "class Solution:\n    def trap(self, height: list[int]) -> int:\n        # Write your code here\n        return 0",
      javascript: "/**\n * @param {number[]} height\n * @return {number}\n */\nfunction trap(height) {\n    // Write your code here\n    return 0;\n}",
      typescript: "function trap(height: number[]): number {\n    // Write your code here\n    return 0;\n}",
      java: "class Solution {\n    public int trap(int[] height) {\n        // Write your code here\n        return 0;\n    }\n}",
      cpp: "class Solution {\npublic:\n    int trap(vector<int>& height) {\n        // Write your code here\n        return 0;\n    }\n};"
    }
  },
  {
    id: "median_two_arrays",
    title: "Median of Two Sorted Arrays",
    difficulty: "hard",
    category: "Binary Search",
    description: "Given two sorted arrays `nums1` and `nums2` of size `m` and `n` respectively, return **the median** of the two sorted arrays.\n\nThe overall run time complexity should be `O(log(m+n))`.",
    constraints: [
      "nums1.length == m",
      "nums2.length == n",
      "0 <= m <= 1000",
      "0 <= n <= 1000",
      "1 <= m + n <= 2000",
      "-10^6 <= nums1[i], nums2[i] <= 10^6"
    ],
    testCases: [
      { input: "nums1 = [1,3], nums2 = [2]", expected: "2.0" },
      { input: "nums1 = [1,2], nums2 = [3,4]", expected: "2.5" }
    ],
    starterTemplates: {
      python: "class Solution:\n    def findMedianSortedArrays(self, nums1: list[int], nums2: list[int]) -> float:\n        # Write your code here\n        return 0.0",
      javascript: "/**\n * @param {number[]} nums1\n * @param {number[]} nums2\n * @return {number}\n */\nfunction findMedianSortedArrays(nums1, nums2) {\n    // Write your code here\n    return 0.0;\n}",
      typescript: "function findMedianSortedArrays(nums1: number[], nums2: number[]): number {\n    // Write your code here\n    return 0.0;\n}",
      java: "class Solution {\n    public double findMedianSortedArrays(int[] nums1, int[] nums2) {\n        // Write your code here\n        return 0.0;\n    }\n}",
      cpp: "class Solution {\npublic:\n    double findMedianSortedArrays(vector<int>& nums1, vector<int>& nums2) {\n        // Write your code here\n        return 0.0;\n    }\n};"
    }
  },
  {
    id: "sliding_window_max",
    title: "Sliding Window Maximum",
    difficulty: "hard",
    category: "Monotonic Queue",
    description: "You are given an array of integers `nums`, there is a sliding window of size `k` which is moving from the very left of the array to the very right. You can only see the `k` numbers in the window. Each time the sliding window moves right by one position.\n\nReturn the max sliding window.",
    constraints: [
      "1 <= nums.length <= 10^5",
      "-10^4 <= nums[i] <= 10^4",
      "1 <= k <= nums.length"
    ],
    testCases: [
      { input: "nums = [1,3,-1,-3,5,3,6,7], k = 3", expected: "[3,3,5,5,6,7]" },
      { input: "nums = [1], k = 1", expected: "[1]" }
    ],
    starterTemplates: {
      python: "class Solution:\n    def maxSlidingWindow(self, nums: list[int], k: int) -> list[int]:\n        # Write your code here\n        return []",
      javascript: "/**\n * @param {number[]} nums\n * @param {number} k\n * @return {number[]}\n */\nfunction maxSlidingWindow(nums, k) {\n    // Write your code here\n    return [];\n}",
      typescript: "function maxSlidingWindow(nums: number[], k: number): number[] {\n    // Write your code here\n    return [];\n}",
      java: "class Solution {\n    public int[] maxSlidingWindow(int[] nums, int k) {\n        // Write your code here\n        return new int[]{};\n    }\n}",
      cpp: "class Solution {\npublic:\n    vector<int> maxSlidingWindow(vector<int>& nums, int k) {\n        // Write your code here\n        return {};\n    }\n};"
    }
  },
  {
    id: "lru_cache",
    title: "LRU Cache",
    difficulty: "hard",
    category: "Design",
    description: "Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.\n\nImplement the LRUCache class:\n- `LRUCache(capacity)` Initialize the LRU cache with positive size capacity.\n- `get(key)` Return the value of the key if the key exists, otherwise return -1.\n- `put(key, value)` Update the value of the key if the key exists. Otherwise, add the key-value pair to the cache. If the number of keys exceeds the capacity from this operation, evict the least recently used key.",
    constraints: [
      "1 <= capacity <= 3000",
      "0 <= key <= 10^4",
      "0 <= value <= 10^5"
    ],
    testCases: [
      { input: "actions = [\"LRUCache\", \"put\", \"put\", \"get\", \"put\", \"get\", \"put\", \"get\", \"get\", \"get\"], params = [[2], [1, 1], [2, 2], [1], [3, 3], [2], [4, 4], [1], [3], [4]]", expected: "[null, null, null, 1, null, -1, null, -1, 3, 4]" }
    ],
    starterTemplates: {
      python: "class LRUCache:\n    def __init__(self, capacity: int):\n        # Write your code here\n        pass\n    def get(self, key: int) -> int:\n        # Write your code here\n        return -1\n    def put(self, key: int, value: int) -> None:\n        # Write your code here\n        pass",
      javascript: "class LRUCache {\n    /**\n     * @param {number} capacity\n     */\n    constructor(capacity) {\n        this.capacity = capacity;\n    }\n    /**\n     * @param {number} key\n     * @return {number}\n     */\n    get(key) {\n        // Write your code here\n        return -1;\n    }\n    /**\n     * @param {number} key\n     * @param {number} value\n     * @return {void}\n     */\n    put(key, value) {\n        // Write your code here\n    }\n}",
      typescript: "class LRUCache {\n    constructor(capacity: number) {\n        // Write your code here\n    }\n    get(key: number): number {\n        // Write your code here\n        return -1;\n    }\n    put(key: number, value: number): void {\n        // Write your code here\n    }\n}",
      java: "class LRUCache {\n    public LRUCache(int capacity) {\n        // Write your code here\n    }\n    public int get(int key) {\n        // Write your code here\n        return -1;\n    }\n    public void put(int key, int value) {\n        // Write your code here\n    }\n}",
      cpp: "class LRUCache {\npublic:\n    LRUCache(int capacity) {\n        // Write your code here\n    }\n    int get(int key) {\n        // Write your code here\n        return -1;\n    }\n    void put(int key, int value) {\n        // Write your code here\n    }\n};"
    }
  },
  {
    id: "network_delay_time",
    title: "Network Delay Time",
    difficulty: "hard",
    category: "Graphs",
    description: "You are given a network of `n` nodes, labeled from `1` to `n`. You are also given `times`, a list of travel times as directed edges `times[i] = (u_i, v_i, w_i)`, where `u_i` is the source node, `v_i` is the target node, and `w_i` is the time it takes for a signal to travel from source to target.\n\nWe will send a signal from a given node `k`. Return the **minimum** time it takes for all the `n` nodes to receive the signal. If it is impossible for all the `n` nodes to receive the signal, return `-1`.",
    constraints: [
      "1 <= k <= n <= 100",
      "1 <= times.length <= 6000",
      "times[i].length == 3",
      "1 <= u_i, v_i <= n",
      "0 <= w_i <= 100",
      "All pairs (u_i, v_i) are unique."
    ],
    testCases: [
      { input: "times = [[2,1,1],[2,3,1],[3,4,1]], n = 4, k = 2", expected: "2" },
      { input: "times = [[1,2,1]], n = 2, k = 1", expected: "1" },
      { input: "times = [[1,2,1]], n = 2, k = 2", expected: "-1" }
    ],
    starterTemplates: {
      python: "class Solution:\n    def networkDelayTime(self, times: list[list[int]], n: int, k: int) -> int:\n        # Write your code here\n        return -1",
      javascript: "/**\n * @param {number[][]} times\n * @param {number} n\n * @param {number} k\n * @return {number}\n */\nfunction networkDelayTime(times, n, k) {\n    // Write your code here\n    return -1;\n}",
      typescript: "function networkDelayTime(times: number[][], n: number, k: number): number {\n    // Write your code here\n    return -1;\n}",
      java: "class Solution {\n    public int networkDelayTime(int[][] times, int n, int k) {\n        // Write your code here\n        return -1;\n    }\n}",
      cpp: "class Solution {\npublic:\n    int networkDelayTime(vector<vector<int>>& times, int n, int k) {\n        // Write your code here\n        return -1;\n    }\n};"
    }
  }
];

export const PROBLEM_SPECIFICATIONS: Record<string, { label: string; bg: string; text: string; spec: string; roles: string[] }> = {
  "two_sum": {
    label: "Frontend & Fullstack",
    bg: "bg-blue-500/10 border-blue-500/30",
    text: "text-blue-400",
    spec: "Basic data processing and hash-map indexing optimization.",
    roles: ["Software Engineer", "Web Developer", "Frontend Engineer", "Full-Stack Developer"]
  },
  "valid_parentheses": {
    label: "DevOps & Security",
    bg: "bg-purple-500/10 border-purple-500/30",
    text: "text-purple-400",
    spec: "Syntactic parsing, stacked nested validation, and expression security auditing.",
    roles: ["DevOps Engineer", "Cloud Engineer", "Cybersecurity Analyst", "System Architect"]
  },
  "reverse_string": {
    label: "Systems & Embedded",
    bg: "bg-amber-500/10 border-amber-500/30",
    text: "text-amber-400",
    spec: "In-place mutations under strict O(1) space limits and memory allocation.",
    roles: ["Embedded Software Engineer", "Systems Engineer", "QA Automation Engineer", "UI/UX Designer & Developer"]
  },
  "fizz_buzz": {
    label: "Data & Core Logic",
    bg: "bg-teal-500/10 border-teal-500/30",
    text: "text-teal-400",
    spec: "Division logic branch flow, high performance iteration loops.",
    roles: ["Junior Developer", "Data Analyst", "Data Engineer"]
  },
  "single_number": {
    label: "Bit Manipulation & Arrays",
    bg: "bg-teal-500/10 border-teal-500/30",
    text: "text-teal-400",
    spec: "Bitwise XOR patterns and unique occurrence filtering.",
    roles: ["Data Scientist", "Data Analyst", "Software Engineer"]
  },
  "merge_intervals": {
    label: "Analytics & Systems",
    bg: "bg-rose-500/10 border-rose-500/30",
    text: "text-rose-400",
    spec: "Overlapping series categorization, array sorting, timeline merges.",
    roles: ["Data Scientist", "Data Analyst", "Backend Engineer", "ML Engineer"]
  },
  "longest_substring": {
    label: "Fullstack Performance",
    bg: "bg-indigo-500/10 border-indigo-500/30",
    text: "text-indigo-400",
    spec: "Dynamic sliding window, optimized sequence queries, uniqueness checks.",
    roles: ["Full-Stack Developer", "Software Engineer", "Systems Architect"]
  },
  "group_anagrams": {
    label: "Strings & Sorting",
    bg: "bg-sky-500/10 border-sky-500/30",
    text: "text-sky-400",
    spec: "Categorized sorting and hash-map storage patterns.",
    roles: ["Data Analyst", "Software Engineer", "Full-Stack Developer"]
  },
  "flatten_array": {
    label: "Recursion & Structures",
    bg: "bg-amber-500/10 border-amber-500/30",
    text: "text-amber-400",
    spec: "Recursive depth parsing and multi-dimensional list expansion.",
    roles: ["UI/UX Designer & Developer", "Web Developer", "Frontend Engineer"]
  },
  "coin_change": {
    label: "Algorithmic Systems",
    bg: "bg-emerald-500/10 border-emerald-500/30",
    text: "text-emerald-400",
    spec: "Dynamic Programming tabulation, financial recursion minimization, state trees.",
    roles: ["Senior Software Engineer", "Financial Software Developer", "Algorithm specialist"]
  },
  "trapping_rain_water": {
    label: "Double-Pointer Math",
    bg: "bg-blue-500/10 border-blue-500/30",
    text: "text-blue-400",
    spec: "Two-pointer linear water accumulation tracking.",
    roles: ["Software Engineer", "Senior Software Engineer"]
  },
  "median_two_arrays": {
    label: "Binary Search Math",
    bg: "bg-pink-500/10 border-pink-500/30",
    text: "text-pink-400",
    spec: "O(log(M+N)) partition search for median calculation.",
    roles: ["Data Scientist", "Algorithm Specialist", "Senior Software Engineer"]
  },
  "sliding_window_max": {
    label: "Monotonic Queue",
    bg: "bg-red-500/10 border-red-500/30",
    text: "text-red-400",
    spec: "Double-ended queue dynamic sliding maximum limits.",
    roles: ["Data Analyst", "Software Engineer", "Systems Architect"]
  },
  "lru_cache": {
    label: "State Design Pattern",
    bg: "bg-orange-500/10 border-orange-500/30",
    text: "text-orange-400",
    spec: "Doubly linked list with instant hash-map state lookups.",
    roles: ["UI/UX Designer & Developer", "Frontend Engineer", "Systems Architect"]
  },
  "network_delay_time": {
    label: "Dijkstra Priority Graph",
    bg: "bg-indigo-500/10 border-indigo-500/30",
    text: "text-indigo-400",
    spec: "Priority queue shortest path traversal metrics.",
    roles: ["Cloud Infrastructure Engineer", "DevOps Engineer", "Systems Engineer"]
  }
};
