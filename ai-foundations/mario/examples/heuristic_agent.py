"""
Heuristic-based Tetris agent with a testing framework.

This agent uses simulation to evaluate all possible final positions for each piece
and selects the best move based on heuristic evaluation.
"""
import time
import numpy as np
import copy
from typing import Callable 
from dataclasses import dataclass

# Import Tetris environment
from tetris import TetrisEnv, Action
from tetris.engine.board import Board


@dataclass
class MoveEvaluation:
    """Evaluation of a potential move."""
    action_sequence: list[Action]  # Sequence of actions to reach this position
    score: float  # Heuristic score
    metrics: dict[str, float]  # Detailed metrics for analysis


class HeuristicAgent:
    """
    A heuristic-based agent for playing Tetris.
    
    This agent simulates all possible final positions for the current piece
    and selects the best move based on heuristic evaluation.
    """
    
    def __init__(self, weights: dict[str, float] | None = None, debug: bool = False):
        """
        Initialize the agent with heuristic weights.
        
        Args:
            weights: Dictionary of weights for different heuristics
            debug: Whether to print debug information
        """
        # Default weights if none provided
        self.weights: dict[str, float] = weights or {
            'holes': -4.0,           # Penalty for creating holes
            'height': -0.5,          # Penalty for increasing height
            'bumpiness': -1.0,       # Penalty for uneven surface
            'lines_cleared': 3.0,    # Reward for clearing lines
            'well_depth': 0.5,       # Reward for creating wells for I pieces
        }
        self.debug: bool = debug
    
    def get_best_action(self, env: TetrisEnv) -> tuple[Action, float, dict[str, float]]:
        """
        Determine the best action to take in the current state.
        
        Args:
            env: The Tetris environment
            
        Returns:
            Tuple of (best action, decision time in ms, metrics)
        """
        start_time = time.time()
        
        # Get all possible final positions
        evaluations = self._evaluate_all_positions(env)
        
        if not evaluations:
            # If no valid moves, just do a hard drop
            if self.debug:
                print("No valid moves found, using HARD_DROP")
            return Action.HARD_DROP, (time.time() - start_time) * 1000, {}
        
        # Find the best evaluation
        best_eval = max(evaluations, key=lambda e: e.score)
        
        if self.debug:
            print(f"Best action sequence: {[a.name for a in best_eval.action_sequence]}")
            print(f"Best score: {best_eval.score}")
            print(f"Metrics: {best_eval.metrics}")
            print(f"Total evaluations: {len(evaluations)}")
            
            # Print top 3 evaluations
            sorted_evals = sorted(evaluations, key=lambda e: e.score, reverse=True)[:3]
            for i, eval in enumerate(sorted_evals):
                print(f"Evaluation {i+1}:")
                print(f"  Action sequence: {[a.name for a in eval.action_sequence]}")
                print(f"  Score: {eval.score}")
                print(f"  Metrics: {eval.metrics}")
        
        # Return the first action in the best sequence
        decision_time_ms = (time.time() - start_time) * 1000
        return best_eval.action_sequence[0], decision_time_ms, best_eval.metrics
    
    def _evaluate_all_positions(self, env: TetrisEnv) -> list[MoveEvaluation]:
        """
        Evaluate all possible final positions for the current piece.
        
        Args:
            env: The Tetris environment
            
        Returns:
            List of move evaluations
        """
        # Create a copy of the environment for simulation
        sim_env = copy.deepcopy(env)
        
        # List to store all evaluations
        evaluations: list[MoveEvaluation] = []
        
        # Track visited states to avoid duplicates
        visited_states: set[int] = set()
        
        # Queue for BFS traversal of possible moves
        # Each entry is (action_sequence, board_state)
        queue: list[tuple[list[Action], Board]] = [([], sim_env.board)]
        
        # Limit the number of states to explore to avoid infinite loops
        max_states = 1000
        states_explored = 0
        
        # Track action counts for debugging
        action_counts = {action.name: 0 for action in Action}
        
        # Track errors for debugging
        error_counts = {action.name: 0 for action in Action}
        
        while queue and states_explored < max_states:
            action_sequence, current_board = queue.pop(0)
            states_explored += 1
            
            if self.debug:
                print(f"Exploring state {states_explored} with action sequence: {[a.name for a in action_sequence]}")
            
            # Skip if we've already visited this state
            board_hash = self._hash_board_state(current_board.grid, current_board)
            if board_hash in visited_states:
                if self.debug:
                    print("  Skipping already visited state")
                continue
            
            visited_states.add(board_hash)

            action_funcs: list[tuple[Action, Callable[[Board], bool | None]]] = [
                (Action.NOOP, lambda b: True),      
                (Action.LEFT, lambda b: b.move_left()),
                (Action.RIGHT, lambda b: b.move_right()),
                (Action.ROTATE_CW, lambda b: b.rotate(clockwise=True)),
                (Action.ROTATE_CCW, lambda b: b.rotate(clockwise=False)),
                (Action.SOFT_DROP, lambda b: b.move_down())
            ]
            
            # Try each possible action
            for action, action_func in action_funcs:
                # Create a copy of the board
                next_board = current_board.copy()
                
                # Execute the action
                try:
                    if self.debug:
                        print(f"  Trying action: {action.name}")
                    
                    # Use the board method directly
                    result = action_func(next_board)
                    
                    # Skip if the action didn't change the state
                    if not result:
                        if self.debug:
                            print(f"    Action {action.name} had no effect, skipping")
                        continue
                    
                    # Skip if the game ended
                    if next_board.game_over:
                        if self.debug:
                            print("    Game terminated, skipping")
                        continue
                    
                    # Skip if we've already visited this state
                    next_hash = self._hash_board_state(next_board.grid, next_board)
                    if next_hash == board_hash:
                        if self.debug:
                            print("    State didn't change, skipping")
                        continue
                    
                    # Add to queue for further exploration
                    queue.append((action_sequence + [action], next_board))
                    action_counts[action.name] += 1
                    
                    if self.debug:
                        print(f"    Added to queue with new sequence: {[a.name for a in action_sequence + [action]]}")
                    
                    # If this was a SOFT_DROP, also evaluate it as a potential final position
                    if action == Action.SOFT_DROP:
                        # Check if the piece would land on the next move down
                        test_board = next_board.copy()
                        if not test_board.move_down():  # Piece would land next
                            # Create a new board for the final state
                            final_board = next_board.copy()
                            # Hard drop to place the piece
                            final_board.hard_drop()
                            
                            # Evaluate this final position
                            info = {
                                'score': final_board.score,
                                'lines_cleared': final_board.lines_cleared,
                                'prev_lines_cleared': current_board.lines_cleared
                            }
                            metrics = self._evaluate_position(final_board.grid, info)
                            score = self._calculate_score(metrics)
                            
                            # Add to evaluations
                            evaluations.append(MoveEvaluation(
                                action_sequence=action_sequence + [action],
                                score=score,
                                metrics=metrics
                            ))
                            
                            if self.debug:
                                print(f"    Piece would land after SOFT_DROP, added evaluation with score {score}")
                except Exception as e:
                    error_counts[action.name] += 1
                    if self.debug:
                        print(f"    Error executing action {action.name}: {e}")
                    continue
            
            # Try hard drop to get a final position
            try:
                if self.debug:
                    print("  Trying HARD_DROP")
                
                # Create a copy of the board for the final state
                final_board = current_board.copy()
                
                # Get the state before the hard drop
                prev_state = final_board.grid.copy()
                
                # Execute the hard drop
                final_board.hard_drop()
                
                # If the piece was placed (board changed)
                if not np.array_equal(final_board.grid, prev_state):
                    # Evaluate this final position
                    info = {
                        'score': final_board.score,
                        'lines_cleared': final_board.lines_cleared,
                        'prev_lines_cleared': current_board.lines_cleared
                    }
                    metrics = self._evaluate_position(final_board.grid, info)
                    score = self._calculate_score(metrics)
                    
                    # Add to evaluations
                    evaluations.append(MoveEvaluation(
                        action_sequence=action_sequence + [Action.HARD_DROP],
                        score=score,
                        metrics=metrics
                    ))
                    action_counts[Action.HARD_DROP.name] += 1
                    
                    if self.debug:
                        print(f"    Added evaluation with score {score}")
                else:
                    if self.debug:
                        print("    HARD_DROP didn't change the state, skipping")
            except Exception as e:
                error_counts[Action.HARD_DROP.name] += 1
                if self.debug:
                    print(f"    Error executing HARD_DROP: {e}")
        
        if self.debug:
            print(f"Explored {states_explored} states, found {len(evaluations)} valid final positions")
            print(f"Action counts during exploration: {action_counts}")
            print(f"Error counts during exploration: {error_counts}")
        
        return evaluations
    
    def _hash_board_state(self, board: np.ndarray[tuple[int, ...], np.dtype[np.int8]], current_board: Board | None = None) -> int:
        """
        Create a hash of the board state including the current piece position and shape.
        
        Args:
            board: The board grid
            current_board: The Board object containing the current piece
            
        Returns:
            Hash value representing the state
        """
        # If we have a board object with a current piece, include its position and shape in the hash
        if current_board and current_board.current_piece:
            piece = current_board.current_piece
            # Combine the board state with piece information
            piece_info = f"{piece.x},{piece.y},{piece.rotation}"
            return hash(board.tobytes() + piece_info.encode())
        else:
            # Fall back to just the board grid
            return hash(board.tobytes())
    
    def _evaluate_position(self, 
                           new_board: np.ndarray[tuple[int, ...], np.dtype[np.int8]], 
                           info: dict[str, int]) -> dict[str, float]:
        """
        Evaluate a board position using various heuristics.
        
        Args:
            new_board: The board after the move
            info: Additional information from the environment
            
        Returns:
            Dictionary of metrics
        """
        # Count holes (empty cells with filled cells above them)
        holes = self._count_holes(new_board)
        
        # Calculate height and bumpiness
        bumpiness, heights = self._get_bumpiness_and_heights(new_board)
        max_height = max(heights) if heights else 0
        
        # Count lines cleared
        lines_cleared: int = info.get('lines_cleared', 0) - info.get('prev_lines_cleared', 0)
        
        # Detect wells (columns with adjacent higher columns)
        well_depth = self._calculate_well_depth(heights)
        
        return {
            'holes': float(holes),
            'height': float(max_height),
            'bumpiness': float(bumpiness),
            'lines_cleared': float(lines_cleared),
            'well_depth': float(well_depth)
        }
    
    def _calculate_score(self, metrics: dict[str, float]) -> float:
        """
        Calculate the overall score based on metrics and weights.
        
        Args:
            metrics: Dictionary of metrics
            
        Returns:
            Overall score
        """
        return sum(metrics[key] * self.weights[key] for key in self.weights if key in metrics)
    
    def _count_holes(self, board: np.ndarray[tuple[int, ...], np.dtype[np.int8]]) -> int:
        """
        Count the number of holes in the board.
        
        A hole is an empty cell with at least one filled cell above it.
        
        Args:
            board: The board state
            
        Returns:
            Number of holes
        """
        holes = 0
        # For each column
        for col in range(board.shape[1]):
            # Find the highest filled cell
            for row in range(board.shape[0]):
                if board[row, col] > 0:  # Found a filled cell
                    # Count empty cells below it
                    for r in range(row + 1, board.shape[0]):
                        if board[r, col] == 0:
                            holes += 1
                    break
        return holes
    
    def _get_bumpiness_and_heights(self, board: np.ndarray[tuple[int, ...], np.dtype[np.int8]]) -> tuple[float, list[int]]:
        """
        Calculate the bumpiness and heights of the board.
        
        Bumpiness is the sum of absolute differences between adjacent column heights.
        
        Args:
            board: The board state
            
        Returns:
            Tuple of (bumpiness, list of column heights)
        """
        heights: list[int] = []
        # For each column
        for col in range(board.shape[1]):
            # Find the highest filled cell
            for row in range(board.shape[0]):
                if board[row, col] > 0:
                    heights.append(board.shape[0] - row)
                    break
            else:
                heights.append(0)  # Empty column
        
        # Calculate bumpiness
        bumpiness = 0
        for i in range(len(heights) - 1):
            bumpiness += abs(heights[i] - heights[i + 1])
        
        return bumpiness, heights
    
    def _calculate_well_depth(self, heights: list[int]) -> float:
        """
        Calculate the depth of wells in the board.
        
        A well is a column with adjacent columns at least 2 units higher.
        
        Args:
            heights: List of column heights
            
        Returns:
            Total well depth
        """
        well_depth = 0
        for i in range(len(heights)):
            # Check if this column is a well
            left_higher = i > 0 and heights[i-1] - heights[i] >= 2
            right_higher = i < len(heights)-1 and heights[i+1] - heights[i] >= 2
            
            if left_higher and right_higher:
                # Deep well (both sides higher)
                well_depth += min(heights[i-1], heights[i+1]) - heights[i]
            elif left_higher:
                well_depth += heights[i-1] - heights[i]
            elif right_higher:
                well_depth += heights[i+1] - heights[i]
        
        return well_depth 