import type { GridMap, GridPoint } from "../../domain/model/grid";
import {
  defaultEntryCost,
  findPathAStar,
  findPathBfs,
  type EntryCost,
  type SearchAlgorithm,
  type SearchResult,
} from "../../domain/navigation/search";

export function calculateRoute(
  map: GridMap,
  start: GridPoint,
  goal: GridPoint,
  algorithm: SearchAlgorithm,
  entryCost: EntryCost = defaultEntryCost,
): SearchResult {
  return algorithm === "astar"
    ? findPathAStar(map, start, goal, entryCost)
    : findPathBfs(map, start, goal);
}
