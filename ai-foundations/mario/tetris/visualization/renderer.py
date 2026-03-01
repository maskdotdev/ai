"""
Pygame-based renderer for the Tetris game.
"""
import pygame
import numpy as np
import time
from ..engine.board import Board
from ..engine.tetromino import TetrominoType


class TetrisRenderer:
    """
    Renderer class for visualizing the Tetris game state using Pygame.
    """

    # Define modern colors (R,G,B) - Main colors with darker shades for 3D effect
    COLORS: dict[int, tuple[int, int, int]] = {
        0: (25, 25, 35),        # Dark background
        ord('I'): (66, 197, 245),    # Modern cyan
        ord('O'): (245, 210, 66),    # Warm yellow
        ord('T'): (147, 88, 247),    # Bright purple
        ord('S'): (98, 245, 112),    # Bright green
        ord('Z'): (245, 88, 88),     # Bright red
        ord('J'): (88, 101, 242),    # Bright blue
        ord('L'): (245, 150, 66),    # Bright orange
    }

    # Darker shades for 3D effect
    SHADE_COLORS: dict[int, tuple[int, int, int]] = {
        key: (max(0, color[0] - 40), max(0, color[1] - 40), max(0, color[2] - 40))
        for key, color in COLORS.items()
    }

    # Lighter shades for highlights
    HIGHLIGHT_COLORS: dict[int, tuple[int, int, int]] = {
        key: (min(255, color[0] + 40), min(255, color[1] + 40), min(255, color[2] + 40))
        for key, color in COLORS.items()
    }

    # Preview piece shapes (minimal representation)
    PREVIEW_SHAPES: dict[str, list[list[int]]] = {
        'I': [[1, 1, 1, 1]],
        'O': [[1, 1],
              [1, 1]],
        'T': [[0, 1, 0],
              [1, 1, 1]],
        'S': [[0, 1, 1],
              [1, 1, 0]],
        'Z': [[1, 1, 0],
              [0, 1, 1]],
        'J': [[1, 0, 0],
              [1, 1, 1]],
        'L': [[0, 0, 1],
              [1, 1, 1]]
    }

    def __init__(self, 
                 width: int = 10, 
                 height: int = 20, 
                 cell_size: int = 30,
                 info_width: int = 200):
        """
        Initialize the Tetris renderer.
        
        Args:
            width: Number of columns in the game board
            height: Number of rows in the game board
            cell_size: Size of each cell in pixels
            info_width: Width of the information panel in pixels
        """
        pygame.init()
        
        self.width: int = width
        self.height: int = height
        self.cell_size: int = cell_size
        self.info_width: int = info_width
        
        # Calculate window dimensions
        self.game_width: int = width * cell_size
        self.game_height: int = height * cell_size
        self.window_width: int = self.game_width + info_width
        self.window_height: int = self.game_height
        
        # Create the window
        self.screen = pygame.display.set_mode((self.window_width, self.window_height))
        pygame.display.set_caption("Tetris AI")
        
        # Create fonts
        self.font = pygame.font.Font(None, 36)
        self.small_font = pygame.font.Font(None, 24)

        # Animation state
        self.clearing_lines: set[int] = set()
        self.clear_start_time = 0
        self.clear_animation_duration = 0.4  # seconds
        self.prev_lines_cleared = 0

    def render(self, 
               board_state: np.ndarray[tuple[int, ...], np.dtype[np.int8]],
               score: int,
               lines_cleared: int,
               next_piece: str | None = None) -> None:
        """
        Render the current game state.
        
        Args:
            board_state: 2D numpy array representing the game board
            score: Current game score
            lines_cleared: Number of lines cleared
            next_piece: Type of the next piece (optional)
        """
        # Check for newly cleared lines
        if lines_cleared > self.prev_lines_cleared:
            self.clearing_lines = set()
            # Find the cleared lines
            for y in range(self.height):
                if np.all(board_state[y] != 0):
                    self.clearing_lines.add(y)
            self.clear_start_time = time.time()
        
        # Clear screen with a gradient background
        self._draw_background()
        
        # Draw game board with animation effects
        self._draw_board(board_state)
        
        # Draw information panel
        self._draw_info_panel(score, lines_cleared, next_piece)
        
        # Update display
        pygame.display.flip()
        
        # Update previous lines cleared
        self.prev_lines_cleared = lines_cleared

    def _draw_background(self):
        """Draw a gradient background."""
        for y in range(self.window_height):
            progress = y / self.window_height
            color = self._blend_colors(
                (15, 15, 25),  # Dark blue at top
                (35, 35, 45),  # Lighter blue at bottom
                progress
            )
            pygame.draw.line(self.screen, color, (0, y), (self.window_width, y))

    def _draw_board(self, board_state: np.ndarray[tuple[int, ...], np.dtype[np.int8]]) -> None:
        """
        Draw the game board with animation effects.
        
        Args:
            board_state: 2D numpy array representing the game board
        """
        current_time = time.time()
        animation_progress = (current_time - self.clear_start_time) / self.clear_animation_duration
        
        # Draw grid lines first
        self._draw_grid()
        
        for y in range(self.height):
            for x in range(self.width):
                cell_value = board_state[y][x]
                if cell_value == 0:
                    continue
                
                base_color = self.COLORS.get(cell_value, self.COLORS[0])
                shade_color = self.SHADE_COLORS.get(cell_value, self.COLORS[0])
                highlight_color = self.HIGHLIGHT_COLORS.get(cell_value, self.COLORS[0])
                
                # Calculate block position
                rect = pygame.Rect(
                    x * self.cell_size,
                    y * self.cell_size,
                    self.cell_size,
                    self.cell_size
                )
                
                # Apply animation effect for clearing lines
                if y in self.clearing_lines and animation_progress <= 1.0:
                    # Fade out effect
                    fade = 1.0 - animation_progress
                    base_color = self._blend_colors((255, 255, 255), base_color, animation_progress)
                    shade_color = self._blend_colors((255, 255, 255), shade_color, animation_progress)
                    highlight_color = self._blend_colors((255, 255, 255), highlight_color, animation_progress)
                    
                    # Add glow effect
                    glow_rect = rect.inflate(8, 8)
                    glow_color = (255, 255, 255, int(255 * fade))
                    glow_surf = pygame.Surface((glow_rect.width, glow_rect.height), pygame.SRCALPHA)
                    pygame.draw.rect(glow_surf, glow_color, glow_surf.get_rect(), border_radius=4)
                    self.screen.blit(glow_surf, glow_rect)
                
                # Draw the block with 3D effect
                self._draw_block(rect, base_color, shade_color, highlight_color)
        
        # Clear animation state if animation is complete
        if self.clearing_lines and animation_progress > 1.0:
            self.clearing_lines.clear()

    def _draw_grid(self):
        """Draw the background grid."""
        for x in range(self.width + 1):
            pygame.draw.line(
                self.screen,
                (45, 45, 55),
                (x * self.cell_size, 0),
                (x * self.cell_size, self.game_height),
                1
            )
        for y in range(self.height + 1):
            pygame.draw.line(
                self.screen,
                (45, 45, 55),
                (0, y * self.cell_size),
                (self.game_width, y * self.cell_size),
                1
            )

    def _draw_block(self, rect: pygame.Rect, color: tuple[int, int, int],
                   shade_color: tuple[int, int, int],
                   highlight_color: tuple[int, int, int]):
        """Draw a single block with 3D effect."""
        # Main block
        pygame.draw.rect(self.screen, color, rect, border_radius=4)
        
        # Bottom/right shadow
        shadow_rect = rect.inflate(-4, -4)
        pygame.draw.rect(self.screen, shade_color, shadow_rect, border_radius=3)
        
        # Top/left highlight
        highlight_rect = rect.inflate(-6, -6)
        pygame.draw.rect(self.screen, highlight_color, highlight_rect, border_radius=2)

    def _blend_colors(self, color1: tuple[int, int, int], 
                     color2: tuple[int, int, int], 
                     factor: float) -> tuple[int, int, int]:
        """
        Blend two colors together.
        
        Args:
            color1: First color (R,G,B)
            color2: Second color (R,G,B)
            factor: Blend factor (0.0 to 1.0), where 1.0 is fully color2
            
        Returns:
            Blended color (R,G,B)
        """
        r = int(color1[0] * (1 - factor) + color2[0] * factor)
        g = int(color1[1] * (1 - factor) + color2[1] * factor)
        b = int(color1[2] * (1 - factor) + color2[2] * factor)
        return (r, g, b)

    def _draw_info_panel(self, 
                        score: int,
                        lines_cleared: int,
                        next_piece: str | None) -> None:
        """
        Draw the information panel.
        
        Args:
            score: Current game score
            lines_cleared: Number of lines cleared
            next_piece: Type of the next piece (optional)
        """
        # Panel starts at game_width
        x_start = self.game_width + 20
        y_start = 20
        
        # Draw score with shadow effect
        self._draw_text("Score:", (x_start, y_start), shadow=True)
        self._draw_text(str(score), (x_start, y_start + 40), shadow=True)
        
        # Draw lines cleared
        self._draw_text("Lines:", (x_start, y_start + 100), shadow=True)
        self._draw_text(str(lines_cleared), (x_start, y_start + 140), shadow=True)
        
        # Draw next piece preview
        if next_piece:
            self._draw_text("Next:", (x_start, y_start + 200), shadow=True)
            
            # Draw next piece preview box with modern styling
            preview_rect = pygame.Rect(
                x_start,
                y_start + 240,
                self.cell_size * 4,
                self.cell_size * 4
            )
            pygame.draw.rect(self.screen, (35, 35, 45), preview_rect, border_radius=8)
            pygame.draw.rect(self.screen, (45, 45, 55), preview_rect, border_radius=8, width=1)
            
            # Draw the next piece in the preview box
            if next_piece in self.PREVIEW_SHAPES:
                shape = self.PREVIEW_SHAPES[next_piece]
                color = self.COLORS[ord(next_piece)]
                shade_color = self.SHADE_COLORS[ord(next_piece)]
                highlight_color = self.HIGHLIGHT_COLORS[ord(next_piece)]
                
                # Calculate centering offsets
                shape_height = len(shape)
                shape_width = len(shape[0])
                offset_x = (4 - shape_width) * self.cell_size // 2
                offset_y = (4 - shape_height) * self.cell_size // 2
                
                # Draw the piece
                for y, row in enumerate(shape):
                    for x, cell in enumerate(row):
                        if cell:
                            rect = pygame.Rect(
                                x_start + offset_x + x * self.cell_size,
                                y_start + 240 + offset_y + y * self.cell_size,
                                self.cell_size,
                                self.cell_size
                            )
                            self._draw_block(rect, color, shade_color, highlight_color)

    def _draw_text(self, text: str, pos: tuple[int, int], shadow: bool = False):
        """Draw text with optional shadow effect."""
        if shadow:
            shadow_surf = self.font.render(text, True, (0, 0, 0))
            self.screen.blit(shadow_surf, (pos[0] + 2, pos[1] + 2))
        text_surf = self.font.render(text, True, (255, 255, 255))
        self.screen.blit(text_surf, pos)

    def close(self) -> None:
        """Clean up Pygame resources."""
        pygame.quit() 