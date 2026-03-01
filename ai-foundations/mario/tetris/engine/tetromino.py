"""
Tetromino definitions and handling for the Tetris game engine.
"""
from enum import Enum
import random
import numpy as np


class TetrominoType(Enum):
    """Enumeration of all possible tetromino types."""
    I = 'I'
    O = 'O'
    T = 'T'
    S = 'S'
    Z = 'Z'
    J = 'J'
    L = 'L'


class Tetromino:
    """
    Represents a tetromino piece with its shape and rotation states.
    """
    
    # Define shapes for each tetromino type using numpy arrays
    SHAPES: dict[TetrominoType, np.ndarray] = {
        TetrominoType.I: np.array([[1, 1, 1, 1]], dtype=np.int8),
        TetrominoType.O: np.array([[1, 1],
                                  [1, 1]], dtype=np.int8),
        TetrominoType.T: np.array([[0, 1, 0],
                                  [1, 1, 1]], dtype=np.int8),
        TetrominoType.S: np.array([[0, 1, 1],
                                  [1, 1, 0]], dtype=np.int8),
        TetrominoType.Z: np.array([[1, 1, 0],
                                  [0, 1, 1]], dtype=np.int8),
        TetrominoType.J: np.array([[1, 0, 0],
                                  [1, 1, 1]], dtype=np.int8),
        TetrominoType.L: np.array([[0, 0, 1],
                                  [1, 1, 1]], dtype=np.int8)
    }

    # Define colors for each tetromino type (RGB)
    COLORS: dict[TetrominoType, tuple[int, int, int]] = {
        TetrominoType.I: (0, 240, 240),    # Cyan
        TetrominoType.O: (240, 240, 0),    # Yellow
        TetrominoType.T: (160, 0, 240),    # Purple
        TetrominoType.S: (0, 240, 0),      # Green
        TetrominoType.Z: (240, 0, 0),      # Red
        TetrominoType.J: (0, 0, 240),      # Blue
        TetrominoType.L: (240, 160, 0),    # Orange
    }

    def __init__(self, piece_type: TetrominoType):
        """
        Initialize a new tetromino piece.
        
        Args:
            piece_type: The type of tetromino to create
        """
        self.type = piece_type
        self.shape = self.SHAPES[piece_type].copy()
        self.rotation = 0  # 0, 1, 2, or 3 representing 0, 90, 180, 270 degrees
        self.x = 0  # x position on the board
        self.y = 0  # y position on the board
        self.color = self.COLORS[piece_type]

    def rotate(self, clockwise: bool = True) -> None:
        """
        Rotate the tetromino 90 degrees.
        
        Args:
            clockwise: If True, rotate clockwise; if False, rotate counterclockwise
        """
        self.shape = np.rot90(self.shape, k=(3 if clockwise else 1))
        self.rotation = (self.rotation + (1 if clockwise else -1)) % 4

    def get_positions(self) -> list[tuple[int, int]]:
        """
        Get the current positions of all blocks in the tetromino relative to (x,y).
        
        Returns:
            List of (x,y) coordinates for each block in the piece
        """
        positions: list[tuple[int, int]] = []
        for row in range(self.shape.shape[0]):
            for col in range(self.shape.shape[1]):
                if self.shape[row][col]:
                    positions.append((self.x + col, self.y + row))
        return positions

    @classmethod
    def random(cls) -> 'Tetromino':
        """
        Create a random tetromino piece.
        
        Returns:
            A new random Tetromino instance
        """
        piece_type = random.choice(list(TetrominoType))
        return cls(piece_type) 