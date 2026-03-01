# manhattan heuristic function
def manhattan_heuristic(node, puzzle):
    return puzzle.h2(node)


# misplaced tiles heuristic function
def misplaced_heuristic(node, puzzle):
    # count the number of tiles that are not in their goal position
    # (ignore the blank, represented by 0)
    return sum(
        1 for i, tile in enumerate(node.state) if tile != 0 and tile != puzzle.goal[i]
    )


initial_state = (1, 4, 2, 0, 7, 5, 3, 6, 8)
puzzle = EightPuzzle(initial_state)

# astar manhattan heuristic
solution_astar_manhattan = astar_search(
    puzzle, lambda node: node.path_cost + manhattan_heuristic(node, puzzle)
)
if solution_astar_manhattan:
    print("a* with manhattan heuristic found a solution:")
    print("moves:", solution_astar_manhattan.solution())
    print("path cost:", solution_astar_manhattan.path_cost)
else:
    print("a* with manhattan heuristic: no solution")

# astar misplaced tiles
solution_astar_misplaced = astar_search(
    puzzle, lambda node: node.path_cost + misplaced_heuristic(node, puzzle)
)
if solution_astar_misplaced:
    print("\na* with misplaced tiles heuristic found a solution:")
    print("moves:", solution_astar_misplaced.solution())
    print("path cost:", solution_astar_misplaced.path_cost)
else:
    print("a* with misplaced tiles heuristic: no solution")

# ---- greedy best-first search with manhattan heuristic ----
solution_greedy_manhattan = best_first_search(
    puzzle, lambda node: manhattan_heuristic(node, puzzle)
)
if solution_greedy_manhattan:
    print("\ngreedy best-first search with manhattan heuristic found a solution:")
    print("moves:", solution_greedy_manhattan.solution())
    print("path cost:", solution_greedy_manhattan.path_cost)
else:
    print("greedy best-first search with manhattan heuristic: no solution")

# ---- greedy best-first search with misplaced tiles heuristic ----
solution_greedy_misplaced = best_first_search(
    puzzle, lambda node: misplaced_heuristic(node, puzzle)
)
if solution_greedy_misplaced:
    print("\ngreedy best-first search with misplaced tiles heuristic found a solution:")
    print("moves:", solution_greedy_misplaced.solution())
    print("path cost:", solution_greedy_misplaced.path_cost)
else:
    print("greedy best-first search with misplaced tiles heuristic: no solution")
