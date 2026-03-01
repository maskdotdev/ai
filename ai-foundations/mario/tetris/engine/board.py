"""
Game board implementation for the Tetris game engine.
"""
import numpy as np
from .tetromino import Tetromino


class Board:
    """
    Represents the Tetris game board and handles game state.
    """

    def __init__(self, width: int = 10, height: int = 20):
        """
        Initialize a new game board.
        
        Args:
            width: Width of the board (default: 10)
            height: Height of the board (default: 20)
        """
        self.width = width
        self.height = height
        self.grid = np.zeros((height, width), dtype=np.int8)
        self.current_piece: Tetromino | None = None
        self.next_piece: Tetromino | None = None
        self.score = 0
        self.lines_cleared = 0
        self.game_over = False
        
        # Initialize the first pieces
        self._spawn_next_piece()
        self._spawn_current_piece()

    def copy(self) -> 'Board':
        """Create a deep copy of the board state."""
        new_board = Board(self.width, self.height)
        new_board.grid = self.grid.copy()
        new_board.score = self.score
        new_board.lines_cleared = self.lines_cleared
        new_board.game_over = self.game_over
        
        # Copy pieces if they exist
        if self.current_piece:
            new_board.current_piece = Tetromino(self.current_piece.type)
            new_board.current_piece.shape = self.current_piece.shape.copy()
            new_board.current_piece.x = self.current_piece.x
            new_board.current_piece.y = self.current_piece.y
            new_board.current_piece.rotation = self.current_piece.rotation
            
        if self.next_piece:
            new_board.next_piece = Tetromino(self.next_piece.type)
            new_board.next_piece.shape = self.next_piece.shape.copy()
            new_board.next_piece.x = self.next_piece.x
            new_board.next_piece.y = self.next_piece.y
            new_board.next_piece.rotation = self.next_piece.rotation
            
        return new_board

    def _spawn_next_piece(self) -> None:
        """Generate the next piece that will be played."""
        self.next_piece = Tetromino.random()

    def _spawn_current_piece(self) -> bool:
        """
        Move the next piece to current and spawn a new next piece.
        
        Returns:
            bool: False if the piece cannot be placed (game over), True otherwise
        """
        if self.next_piece is None:
            self._spawn_next_piece()
        
        self.current_piece = self.next_piece
        self._spawn_next_piece()
        
        # Position the piece at the top center of the board
        if self.current_piece:
            self.current_piece.x = (self.width - self.current_piece.shape.shape[1]) // 2
            self.current_piece.y = 0
            
            # Check if the piece can be placed
            if not self._is_valid_position():
                self.game_over = True
                return False
        return True

    def _is_valid_position(self) -> bool:
        """
        Check if the current piece's position is valid.
        
        Returns:
            bool: True if the position is valid, False otherwise
        """
        if not self.current_piece:
            return True
            
        positions = self.current_piece.get_positions()
        for x, y in positions:
            # Check bounds
            if not (0 <= x < self.width and 0 <= y < self.height):
                return False
            # Check collision with placed pieces
            if y >= 0 and self.grid[y][x] != 0:
                return False
        return True

    def move_left(self) -> bool:
        """
        Move the current piece left if possible.
        
        Returns:
            bool: True if the piece was moved, False otherwise
        """
        if not self.current_piece or self.game_over:
            return False
            
        self.current_piece.x -= 1
        if not self._is_valid_position():
            self.current_piece.x += 1
            return False
        return True

    def move_right(self) -> bool:
        """
        Move the current piece right if possible.
        
        Returns:
            bool: True if the piece was moved, False otherwise
        """
        if not self.current_piece or self.game_over:
            return False
            
        self.current_piece.x += 1
        if not self._is_valid_position():
            self.current_piece.x -= 1
            return False
        return True

    def rotate(self, clockwise: bool = True) -> bool:
        """
        Rotate the current piece if possible.
        
        Args:
            clockwise: If True, rotate clockwise; if False, rotate counterclockwise
            
        Returns:
            bool: True if the piece was rotated, False otherwise
        """
        if not self.current_piece or self.game_over:
            return False
            
        original_shape = self.current_piece.shape.copy()
        self.current_piece.rotate(clockwise)
        
        if not self._is_valid_position():
            self.current_piece.shape = original_shape
            return False
        return True

    def move_down(self) -> bool:
        """
        Move the current piece down if possible.
        
        Returns:
            bool: True if the piece was moved, False if it landed
        """
        if not self.current_piece or self.game_over:
            return False
            
        self.current_piece.y += 1
        if not self._is_valid_position():
            self.current_piece.y -= 1
            self._land_piece()
            return False
        return True

    def hard_drop(self) -> None:
        """Drop the current piece to the bottom instantly."""
        if not self.current_piece or self.game_over:
            return
            
        while self.move_down():
            pass

    def _land_piece(self) -> None:
        """
        Land the current piece on the board and handle line clears.
        """
        if not self.current_piece:
            return
            
        # Add piece to the grid
        positions = self.current_piece.get_positions()
        piece_type_value = self.current_piece.type.value
        for x, y in positions:
            if 0 <= y < self.height:  # Only place pieces within bounds
                self.grid[y][x] = ord(piece_type_value)  # Use ASCII value of piece type char
                
        # Clear completed lines
        lines_to_clear = []
        for y in range(self.height):
            if np.all(self.grid[y] != 0):
                lines_to_clear.append(y)
                
        if lines_to_clear:
            self._clear_lines(lines_to_clear)
            
        # Spawn next piece
        self._spawn_current_piece()

    def _clear_lines(self, lines: list[int]) -> None:
        """
        Clear the specified lines and update the score.
        
        Args:
            lines: List of y-coordinates of lines to clear
        """
        # Remove the lines and add new empty lines at the top
        self.grid = np.delete(self.grid, lines, axis=0)
        self.grid = np.vstack([np.zeros((len(lines), self.width), dtype=np.int8), self.grid])
        
        # Update score and lines cleared
        self.lines_cleared += len(lines)
        # Score calculation: more points for clearing multiple lines at once
        points = {1: 100, 2: 300, 3: 500, 4: 800}
        self.score += points.get(len(lines), 0)

    def get_state(self) -> tuple[np.ndarray[tuple[int, ...], np.dtype[np.int8]], Tetromino | None, Tetromino | None, int, int, bool]:
        """
        Get the current game state.
        
        Returns:
            tuple containing:
            - The game grid
            - The current piece
            - The next piece
            - Current score
            - Number of lines cleared
            - Game over flag
        """
        return (
            self.grid.copy(),
            self.current_piece,
            self.next_piece,
            self.score,
            self.lines_cleared,
            self.game_over
        ) 