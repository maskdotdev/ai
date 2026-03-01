"""
Tetris environment implementation following the OpenAI Gym interface pattern.
"""
from enum import IntEnum
import numpy as np
import gymnasium as gym
from gymnasium import spaces
from typing import Any, cast
from numpy.typing import NDArray
from ..engine.board import Board


class Action(IntEnum):
    """Available actions in the Tetris environment."""
    NOOP = 0
    LEFT = 1
    RIGHT = 2
    ROTATE_CW = 3
    ROTATE_CCW = 4
    SOFT_DROP = 5
    HARD_DROP = 6


class TetrisEnv(gym.Env[NDArray[np.uint8], np.int64]):
    """
    Tetris environment following the Gymnasium interface.
    """
    metadata = {"render_modes": ["rgb_array", "human"], "render_fps": 4}

    # Reward weights
    REWARD_WEIGHTS = {
        # Line clearing rewards
        'lines_cleared': 100.0,      # Base points per line cleared
        'tetris_bonus': 300.0,       # Additional bonus for clearing 4 lines
        'combo_bonus': 50.0,         # Bonus for consecutive line clears
        
        # Structural penalties
        'height_penalty': -1.0,      # Penalty per height unit
        'hole_penalty': -10.0,       # Penalty per hole
        'bumpiness_penalty': -2.0,   # Penalty for height differences
        'game_over': -500.0,         # Penalty for losing
        
        # Efficiency incentives
        'move_penalty': -0.1,        # Small penalty for each move
        'landing_height_penalty': -1.0,  # Penalty for high piece placement
        
        # Structure rewards
        'well_bonus': 10.0,          # Reward for maintaining a well (for Tetris)
        'flat_bonus': 5.0,           # Reward for flat surface segments
        'clear_path_bonus': 2.0,     # Reward for keeping clear paths to holes
        'proper_well_placement': 20.0,  # Reward for placing pieces that maintain well structure
        
        # Advanced techniques
        'tspin_setup_bonus': 30.0,   # Reward for creating T-spin opportunities
        'perfect_clear_bonus': 500.0, # Reward for perfect board clear
        'overhang_penalty': -5.0,    # Penalty for creating overhangs
        'blocked_well_penalty': -15.0,  # Penalty for blocking the Tetris well
    }

    def __init__(self, width: int = 10, height: int = 20, render_mode: str | None = None):
        """
        Initialize the Tetris environment.
        
        Args:
            width: Width of the game board (default: 10)
            height: Height of the game board (default: 20)
            render_mode: The render mode to use (default: None)
        """
        super().__init__()
        
        self.width: int = width
        self.height: int = height
        self.render_mode: str | None = render_mode
        self.board: Board = Board(width, height)
        self.combo_count: int = 0  # Track consecutive line clears
        
        # Define action space
        self.action_space = spaces.Discrete(len(Action))
        
        # Define observation space
        # The observation is a 2D grid where each cell can be:
        # 0 for empty, or ASCII values for piece types
        self.observation_space = spaces.Box(
            low=0,
            high=255,  # Max ASCII value
            shape=(height, width),
            dtype=np.uint8
        )
        
        # Optional renderer
        self.renderer = None
        if render_mode == "human":
            from ..visualization.renderer import TetrisRenderer
            self.renderer = TetrisRenderer(width, height)

    def _get_holes(self, grid: NDArray[np.int8 | np.uint8]) -> int:
        """
        Count the number of holes in the board.
        A hole is an empty cell that has a filled cell above it.
        
        Args:
            grid: The game board grid
            
        Returns:
            Number of holes found
        """
        grid = grid.astype(np.uint8)
        holes = 0
        # For each column
        for x in range(self.width):
            found_block = False
            # Scan from top to bottom
            for y in range(self.height):
                if grid[y][x] != 0:  # Found a block
                    found_block = True
                elif found_block and grid[y][x] == 0:  # Found a hole
                    holes += 1
        return holes

    def _get_bumpiness_and_height(self, grid: NDArray[np.int8 | np.uint8]) -> tuple[float, list[int]]:
        """
        Calculate the bumpiness and heights of the board.
        Bumpiness is the sum of absolute differences between adjacent column heights.
        
        Args:
            grid: The game board grid
            
        Returns:
            Tuple containing:
            - Total bumpiness
            - List of column heights
        """
        grid = grid.astype(np.uint8)
        heights = []
        # Calculate height of each column
        for x in range(self.width):
            for y in range(self.height):
                if grid[y][x] != 0:
                    heights.append(self.height - y)
                    break
            else:
                heights.append(0)
        
        # Calculate bumpiness
        bumpiness = 0
        for i in range(len(heights) - 1):
            bumpiness += abs(heights[i] - heights[i + 1])
            
        return bumpiness, heights

    def _get_landing_height(self, grid: NDArray[np.int8 | np.uint8], 
                          prev_grid: NDArray[np.int8 | np.uint8]) -> int:
        """
        Calculate the landing height of the last piece placed.
        
        Args:
            grid: Current game board grid
            prev_grid: Previous game board grid
            
        Returns:
            Landing height of the last piece (0 if can't be determined)
        """
        grid = grid.astype(np.uint8)
        prev_grid = prev_grid.astype(np.uint8)
        diff = grid - prev_grid
        if np.any(diff):
            # Find the highest point where the grids differ
            for y in range(self.height):
                if np.any(diff[y] != 0):
                    return self.height - y
        return 0

    def _analyze_well_structure(self, grid: NDArray[np.uint8]) -> tuple[bool, int]:
        """
        Analyze if there's a proper Tetris well and its quality.
        A well is a column with higher adjacent columns, ideal for Tetris clears.
        
        Args:
            grid: The game board grid
            
        Returns:
            Tuple containing:
            - Whether a proper well exists
            - Quality score of the well (depth and cleanliness)
        """
        well_exists = False
        well_quality = 0
        
        # Check first and last columns, and one column in from each edge
        potential_well_columns = [0, 1, self.width-2, self.width-1]
        
        for x in potential_well_columns:
            empty_count = 0
            adjacent_filled = True
            
            # Check if adjacent columns are higher
            for y in range(self.height-1, -1, -1):
                if x > 0 and grid[y][x-1] == 0:  # Left side empty
                    adjacent_filled = False
                if x < self.width-1 and grid[y][x+1] == 0:  # Right side empty
                    adjacent_filled = False
                
                if grid[y][x] == 0:
                    empty_count += 1
                else:
                    break
            
            if empty_count >= 4 and adjacent_filled:
                well_exists = True
                well_quality = empty_count
                break
                
        return well_exists, well_quality

    def _detect_flat_surfaces(self, grid: NDArray[np.uint8]) -> list[tuple[int, int]]:
        """
        Find continuous flat surface segments.
        
        Args:
            grid: The game board grid
            
        Returns:
            List of (start_x, length) tuples for flat segments
        """
        flat_segments = []
        heights = []
        
        # Get height of each column
        for x in range(self.width):
            for y in range(self.height):
                if grid[y][x] != 0:
                    heights.append(self.height - y)
                    break
            else:
                heights.append(0)
        
        # Find flat segments
        start_x = 0
        current_height = heights[0]
        
        for x in range(1, self.width):
            if heights[x] != current_height:
                if x - start_x >= 2:  # Minimum 2 blocks for a flat segment
                    flat_segments.append((start_x, x - start_x))
                start_x = x
                current_height = heights[x]
        
        # Check last segment
        if self.width - start_x >= 2 and all(h == current_height for h in heights[start_x:]):
            flat_segments.append((start_x, self.width - start_x))
            
        return flat_segments

    def _evaluate_tspin_potential(self, grid: NDArray[np.uint8]) -> float:
        """
        Evaluate potential for T-spin setups.
        
        Args:
            grid: The game board grid
            
        Returns:
            Score based on T-spin friendly structures
        """
        tspin_score = 0.0
        
        # Look for T-spin setup patterns
        for y in range(1, self.height-1):
            for x in range(1, self.width-1):
                # Check for common T-spin setup patterns
                if grid[y][x] == 0:  # Empty center cell
                    corners_filled = sum(1 for dx, dy in [(-1,-1), (1,-1), (-1,1), (1,1)]
                                      if 0 <= x+dx < self.width and 0 <= y+dy < self.height 
                                      and grid[y+dy][x+dx] != 0)
                    if corners_filled >= 3:  # Potential T-spin spot
                        tspin_score += 1.0
                        
                        # Extra points if there's a clear path to place a T piece
                        if (y > 0 and all(grid[y-1][x+dx] == 0 for dx in [-1,0,1])):
                            tspin_score += 0.5
                            
        return tspin_score

    def _check_overhangs(self, grid: NDArray[np.uint8]) -> int:
        """
        Count number of overhang structures.
        An overhang is an empty cell with a filled cell above it.
        
        Args:
            grid: The game board grid
            
        Returns:
            Number of overhang structures found
        """
        overhangs = 0
        
        for x in range(self.width):
            for y in range(1, self.height):
                if grid[y][x] == 0 and grid[y-1][x] != 0:
                    overhangs += 1
                    
        return overhangs

    def _analyze_piece_placement(self, grid: NDArray[np.uint8], 
                               prev_grid: NDArray[np.uint8]) -> dict[str, float]:
        """
        Analyze quality of the last piece placement.
        
        Args:
            grid: Current game board grid
            prev_grid: Previous game board grid
            
        Returns:
            Dictionary with placement quality metrics
        """
        metrics = {
            'landing_height': 0.0,
            'surface_smoothness': 0.0,
            'well_contribution': 0.0,
            'overhang_created': 0.0
        }
        
        # Find the piece placement
        diff = grid - prev_grid
        if not np.any(diff):
            return metrics
            
        # Calculate landing height
        for y in range(self.height):
            if np.any(diff[y] != 0):
                metrics['landing_height'] = self.height - y
                break
        
        # Calculate surface smoothness change
        _, heights_before = self._get_bumpiness_and_height(prev_grid)
        bumpiness_after, heights_after = self._get_bumpiness_and_height(grid)
        metrics['surface_smoothness'] = sum(abs(h1 - h2) for h1, h2 in zip(heights_before, heights_after))
        
        # Check well contribution
        well_before, _ = self._analyze_well_structure(prev_grid)
        well_after, well_quality = self._analyze_well_structure(grid)
        metrics['well_contribution'] = well_quality if well_after and not well_before else 0.0
        
        # Check if placement created overhangs
        overhangs_before = self._check_overhangs(prev_grid)
        overhangs_after = self._check_overhangs(grid)
        metrics['overhang_created'] = max(0, overhangs_after - overhangs_before)
        
        return metrics

    def _calculate_reward(self, prev_score: int, prev_lines: int) -> float:
        """
        Calculate the reward for the last action.
        
        Args:
            prev_score: Score before the action
            prev_lines: Lines cleared before the action
            
        Returns:
            float: The calculated reward
        """
        reward = 0.0
        
        # Get current grid state
        curr_grid = self.board.grid.astype(np.uint8)
        
        # Lines cleared reward
        lines_cleared = self.board.lines_cleared - prev_lines
        if lines_cleared > 0:
            # Base reward for clearing lines
            reward += lines_cleared * self.REWARD_WEIGHTS['lines_cleared']
            # Extra bonus for Tetris (4 lines)
            if lines_cleared == 4:
                reward += self.REWARD_WEIGHTS['tetris_bonus']
            # Combo bonus
            self.combo_count += 1
            reward += self.combo_count * self.REWARD_WEIGHTS['combo_bonus']
        else:
            self.combo_count = 0
        
        # Calculate board state metrics
        holes = self._get_holes(curr_grid)
        bumpiness, heights = self._get_bumpiness_and_height(curr_grid)
        max_height = max(heights)
        
        # Apply basic penalties
        reward += holes * self.REWARD_WEIGHTS['hole_penalty']
        reward += bumpiness * self.REWARD_WEIGHTS['bumpiness_penalty']
        reward += max_height * self.REWARD_WEIGHTS['height_penalty']
        
        # Check for perfect clear
        if np.all(curr_grid == 0):
            reward += self.REWARD_WEIGHTS['perfect_clear_bonus']
        
        # Analyze well structure
        has_well, well_quality = self._analyze_well_structure(curr_grid)
        if has_well:
            reward += well_quality * self.REWARD_WEIGHTS['well_bonus']
        
        # Find flat surfaces
        flat_segments = self._detect_flat_surfaces(curr_grid)
        for _, length in flat_segments:
            reward += length * self.REWARD_WEIGHTS['flat_bonus']
        
        # Check for T-spin opportunities
        tspin_potential = self._evaluate_tspin_potential(curr_grid)
        reward += tspin_potential * self.REWARD_WEIGHTS['tspin_setup_bonus']
        
        # Check overhangs
        overhangs = self._check_overhangs(curr_grid)
        reward += overhangs * self.REWARD_WEIGHTS['overhang_penalty']
        
        # Penalty for game over
        if self.board.game_over:
            reward += self.REWARD_WEIGHTS['game_over']
        
        # Small penalty for each move to encourage efficiency
        reward += self.REWARD_WEIGHTS['move_penalty']
        
        return reward

    def reset(self, *, seed: int | None = None, options: dict[str, Any] | None = None) -> tuple[NDArray[np.uint8], dict[str, Any]]:
        """
        Reset the environment to initial state.
        
        Args:
            seed: Random seed for reproducibility
            options: Additional options for reset (not used)
            
        Returns:
            Tuple containing:
            - Initial observation (the game board state)
            - Info dictionary with additional game state information
        """
        super().reset(seed=seed)
        self.board = Board(self.width, self.height)
        obs, info = self._get_observation()
        
        if self.render_mode == "human" and self.renderer:
            self.renderer.render(
                board_state=obs,
                score=info['score'],
                lines_cleared=info['lines_cleared'],
                next_piece=info['next_piece']
            )
            
        return cast(NDArray[np.uint8], obs), info

    def step(self, action: np.int64) -> tuple[NDArray[np.uint8], float, bool, bool, dict[str, Any]]:
        """
        Take an action in the environment.
        
        Args:
            action: Integer representing the action to take (see Action enum)
            
        Returns:
            Tuple containing:
            - Next observation
            - Reward for the action
            - Whether the episode is terminated
            - Whether the episode is truncated (not used in Tetris)
            - Additional information dictionary
        """
        if not isinstance(action, (int, np.integer)):
            raise TypeError(f"Action must be an integer, got {type(action)}")
        
        if not 0 <= action < len(Action):
            raise ValueError(f"Invalid action {action}. Must be between 0 and {len(Action)-1}")

        # Store the state before action
        prev_score = self.board.score
        prev_lines = self.board.lines_cleared
        
        # Execute the action
        action_enum = Action(int(action))
        self._execute_action(action_enum)
        
        # Calculate rewards
        reward = self._calculate_reward(prev_score, prev_lines)
        
        # Get new state
        obs, info = self._get_observation()
        terminated = self.board.game_over
        truncated = False  # Tetris doesn't use truncation
        
        if self.render_mode == "human" and self.renderer:
            self.renderer.render(
                board_state=obs,
                score=info['score'],
                lines_cleared=info['lines_cleared'],
                next_piece=info['next_piece']
            )
        
        return cast(NDArray[np.uint8], obs), reward, terminated, truncated, info

    def _execute_action(self, action: Action) -> None:
        """
        Execute the given action on the game board.
        
        Args:
            action: The action to execute
        """
        if action == Action.NOOP:
            _ = self.board.move_down()
        elif action == Action.LEFT:
            _ = self.board.move_left()
            _ = self.board.move_down()
        elif action == Action.RIGHT:
            _ = self.board.move_right()
            _ = self.board.move_down()
        elif action == Action.ROTATE_CW:
            _ = self.board.rotate(clockwise=True)
            _ = self.board.move_down()
        elif action == Action.ROTATE_CCW:
            _ = self.board.rotate(clockwise=False)
            _ = self.board.move_down()
        elif action == Action.SOFT_DROP:
            _ = self.board.move_down()
        elif action == Action.HARD_DROP:
            _ = self.board.hard_drop()

    def _get_observation(self) -> tuple[NDArray[np.uint8], dict[str, Any]]:
        """
        Get the current observation of the environment.
        
        Returns:
            Tuple containing:
            - The game board state as a numpy array
            - Dictionary with additional information
        """
        grid, current_piece, next_piece, score, lines_cleared, game_over = self.board.get_state()
        
        # Create the observation grid (includes current piece position)
        obs = grid.copy().astype(np.uint8)  # Ensure uint8 type
        if current_piece:
            for x, y in current_piece.get_positions():
                if 0 <= y < self.height and 0 <= x < self.width:
                    obs[y][x] = ord(current_piece.type.value)
        
        info = {
            'score': score,
            'lines_cleared': lines_cleared,
            'game_over': game_over,
            'next_piece': next_piece.type.value if next_piece else None
        }
        
        return obs, info

    def render(self) -> NDArray[np.uint8] | None:
        """
        Render the current game state.
        
        Returns:
            numpy.ndarray: The game state as a 2D array for 'rgb_array' mode
            None: For 'human' mode as it renders directly
        """
        if self.render_mode == "rgb_array":
            obs, _ = self._get_observation()
            return cast(NDArray[np.uint8], obs)
        return None

    def close(self) -> None:
        """Clean up resources."""
        if self.renderer:
            self.renderer.close()
            self.renderer = None 