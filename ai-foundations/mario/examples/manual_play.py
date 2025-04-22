import sys
import pygame
import time
from typing import Any
import numpy as np

# Add the parent directory to the Python path so we can import our Tetris package
sys.path.append('..')

from tetris.environment.tetris_env import TetrisEnv, Action
from tetris.visualization.renderer import TetrisRenderer


def main():
    """Main function to run the manual play example."""
    # Initialize environment and renderer
    env = TetrisEnv()
    renderer = TetrisRenderer()
    
    # Key mappings
    key_action_map = {
        pygame.K_LEFT: Action.LEFT,
        pygame.K_RIGHT: Action.RIGHT,
        pygame.K_UP: Action.ROTATE_CW,
        pygame.K_z: Action.ROTATE_CCW,
        pygame.K_DOWN: Action.SOFT_DROP,
        pygame.K_SPACE: Action.HARD_DROP,
    }
    
    # Game loop
    clock = pygame.time.Clock()
    running = True
    auto_drop_time = time.time()
    auto_drop_delay = 1.0  # Time in seconds between automatic drops
    
    # Get initial state
    obs, info = env.reset()
    terminated = False
    
    while running:
        current_time = time.time()
        
        # Handle events
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
            elif event.type == pygame.KEYDOWN:
                if event.key == pygame.K_q:
                    running = False
                elif event.key in key_action_map:
                    action = key_action_map[event.key]
                    obs, reward, terminated, truncated, info = env.step(action.value)
                    auto_drop_time = current_time  # Reset auto-drop timer
        
        # Auto-drop piece if enough time has passed
        if current_time - auto_drop_time >= auto_drop_delay:
            obs, reward, terminated, truncated, info = env.step(Action.NOOP.value)
            auto_drop_time = current_time
        
        # Render current state
        renderer.render(
            board_state=obs,
            score=info['score'],
            lines_cleared=info['lines_cleared'],
            next_piece=info['next_piece']
        )
        
        # Check for game over
        if terminated:
            print(f"Game Over! Final score: {info['score']}")
            print(f"Lines cleared: {info['lines_cleared']}")
            running = False
        
        # Control game speed
        clock.tick(60)
    
    # Cleanup
    renderer.close()


if __name__ == "__main__":
    main() 