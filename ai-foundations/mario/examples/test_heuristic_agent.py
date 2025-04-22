"""
Testing framework for the heuristic-based Tetris agent.

This script allows running tests with different heuristic weights and
outputs detailed results to the terminal for analysis.
"""
import sys
import time
import os
import argparse
from argparse import Namespace
import numpy as np
from numpy.typing import NDArray
import json
from typing import Any, override, cast, Protocol, TypedDict
from datetime import datetime
try:
    from tabulate import tabulate
except ImportError:
    print("tabulate package not found. Please install it with: pip install tabulate")
    sys.exit(1)

# Add the parent directory to the Python path
sys.path.append('..')

from tetris import TetrisEnv, Action, TetrisRenderer
from examples.heuristic_agent import HeuristicAgent

# Define a protocol for TetrisRenderer to help with type checking
class TetrisRendererProtocol(Protocol):
    def render(self, board_state: NDArray[np.uint8], score: int, lines_cleared: int, next_piece: str | None = None) -> None: ...
    def close(self) -> None: ...

# Custom TetrisEnv wrapper that doesn't automatically move down after each action
class CustomTetrisEnv(TetrisEnv):
    """
    A custom wrapper for TetrisEnv that doesn't automatically move the piece down
    after each action. This allows the agent to explore different positions more effectively.
    """
    
    @override
    def _execute_action(self, action: Action) -> None:
        """
        Execute the given action on the game board without automatic downward movement.
        
        Args:
            action: The action to execute
        """
        if action == Action.NOOP:
            pass  # Do nothing
        elif action == Action.LEFT:
            _ = self.board.move_left()
        elif action == Action.RIGHT:
            _ = self.board.move_right()
        elif action == Action.ROTATE_CW:
            _ = self.board.rotate(clockwise=True)
        elif action == Action.ROTATE_CCW:
            _ = self.board.rotate(clockwise=False)
        elif action == Action.SOFT_DROP:
            _ = self.board.move_down()
        elif action == Action.HARD_DROP:
            _ = self.board.hard_drop()

# Directory for storing test results
RESULTS_DIR = "agent_test_results"

# Define a TypedDict for episode results
class EpisodeResult(TypedDict):
    score: int
    lines_cleared: int
    steps: int
    total_reward: float
    duration: float
    metrics_history: list[dict[str, float | int | str]]
    action_counts: dict[str, int]

# Define a TypedDict for aggregated results
class AggregatedResults(TypedDict):
    weights: dict[str, float]
    episodes: int
    avg_score: float
    avg_lines: float
    avg_steps: float
    avg_duration: float
    max_score: int
    max_lines: int
    episode_results: list[EpisodeResult]
    action_counts: dict[str, int]

def run_test_episode(agent: HeuristicAgent, 
                    delay: float = 0.01, 
                    render: bool = True,
                    verbose: bool = False,
                    use_custom_env: bool = False,
                    debug: bool = False) -> EpisodeResult:
    """
    Run a single test episode with the agent.
    
    Args:
        agent: The Tetris agent to test
        delay: Delay between moves in seconds
        render: Whether to render the game
        verbose: Whether to print detailed move information
        use_custom_env: Whether to use the custom environment
        debug: Whether to enable debug mode
        
    Returns:
        Dictionary with episode results
    """
    # Initialize environment and renderer
    env = CustomTetrisEnv() if use_custom_env else TetrisEnv()
    renderer: TetrisRendererProtocol | None = TetrisRenderer() if render else None
    
    # Reset environment
    obs, info = env.reset()
    
    # Debug: Print initial state
    if debug:
        print("\nInitial Board State:")
        print(obs)
        if env.board.current_piece:
            print(f"Current Piece: {env.board.current_piece.type.value}")
            print(f"Current Piece Position: ({env.board.current_piece.x}, {env.board.current_piece.y})")
            # Cast shape to NDArray to handle type checking
            shape_array = cast(NDArray[np.int8], env.board.current_piece.shape)
            print(f"Current Piece Shape:\n{shape_array}")
            
            # Try moving the piece manually to see if it works
            print("\nTrying manual movements:")
            # Try left
            left_result = env.board.move_left()
            print(f"Move Left Result: {left_result}")
            if left_result:
                print(f"New Position after Left: ({env.board.current_piece.x}, {env.board.current_piece.y})")
            
            # Try right
            right_result = env.board.move_right()
            print(f"Move Right Result: {right_result}")
            if right_result:
                print(f"New Position after Right: ({env.board.current_piece.x}, {env.board.current_piece.y})")
            
            # Try rotate
            rotate_result = env.board.rotate(clockwise=True)
            print(f"Rotate CW Result: {rotate_result}")
            if rotate_result:
                # Cast shape to NDArray to handle type checking
                shape_array = cast(NDArray[np.int8], env.board.current_piece.shape)
                print(f"New Shape after Rotate:\n{shape_array}")
                
            # Reset the piece position and rotation for the actual test
            _, _ = env.reset()
    
    total_reward = 0
    steps = 0
    start_time = time.time()
    
    # Metrics tracking
    metrics_history: list[dict[str, float | int | str]] = []
    action_counts = {action.name: 0 for action in Action}
    
    # Episode loop
    while True:
        # Get the best action from the agent
        best_action, decision_time_ms, metrics = agent.get_best_action(env)
        
        # Debug: Print the current state before taking the action
        if debug:
            print(f"\nStep {steps + 1} - Before Action {best_action.name}:")
            if env.board.current_piece:
                print(f"Current Piece: {env.board.current_piece.type.value}")
                print(f"Current Piece Position: ({env.board.current_piece.x}, {env.board.current_piece.y})")
                # Cast shape to NDArray to handle type checking
                shape_array = cast(NDArray[np.int8], env.board.current_piece.shape)
                print(f"Current Piece Shape:\n{shape_array}")
        
        # Track action counts
        action_counts[best_action.name] = action_counts.get(best_action.name, 0) + 1
        
        # Print move details if verbose
        if verbose:
            print(f"\nStep {steps + 1}:")
            print(f"  Action: {best_action.name}")
            print(f"  Decision time: {decision_time_ms:.2f} ms")
            print(f"  Metrics: {metrics}")
        
        # Take the action
        obs, reward, terminated, _, info = env.step(np.int64(best_action.value))
        total_reward += reward
        steps += 1
        
        # Debug: Print the state after taking the action
        if debug:
            print(f"After Action {best_action.name}:")
            print(obs)
            if env.board.current_piece:
                print(f"Current Piece: {env.board.current_piece.type.value}")
                print(f"Current Piece Position: ({env.board.current_piece.x}, {env.board.current_piece.y})")
                # Cast shape to NDArray to handle type checking
                shape_array = cast(NDArray[np.int8], env.board.current_piece.shape)
                print(f"Current Piece Shape:\n{shape_array}")
            print(f"Reward: {reward}")
            print(f"Terminated: {terminated}")
        
        # Store metrics for this step
        step_data = {
            'step': steps,
            'action': best_action.name,
            'reward': float(reward),
            'score': info['score'],
            'lines_cleared': info['lines_cleared'],
            'decision_time_ms': decision_time_ms,
            **metrics
        }
        metrics_history.append(step_data)
        
        # Render current state
        if renderer:
            # Cast board_state to NDArray to handle type checking
            board_state_array = cast(NDArray[np.uint8], obs)
            # Use the renderer to display the current state
            renderer.render(
                board_state=board_state_array,
                score=info['score'],
                lines_cleared=info['lines_cleared'],
                next_piece=info['next_piece']
            )
        
        # Add delay to make it viewable
        time.sleep(delay)
        
        # Check if episode is done
        if terminated:
            break
    
    # Calculate episode duration
    duration = time.time() - start_time
    
    # Close renderer
    if renderer:
        renderer.close()
    
    # Return episode results
    return {
        'score': info['score'],
        'lines_cleared': info['lines_cleared'],
        'steps': steps,
        'total_reward': total_reward,
        'duration': duration,
        'metrics_history': metrics_history,
        'action_counts': action_counts
    }


def run_weight_test(weights: dict[str, float], 
                   episodes: int = 3, 
                   delay: float = 0.01,
                   render: bool = True,
                   verbose: bool = False,
                   debug: bool = False,
                   use_custom_env: bool = False) -> AggregatedResults:
    """
    Run multiple episodes with the given weights and return aggregated results.
    
    Args:
        weights: Dictionary of weights for the heuristic agent
        episodes: Number of episodes to run
        delay: Delay between moves in seconds
        render: Whether to render the game
        verbose: Whether to print detailed move information
        debug: Whether to enable debug mode for the agent
        use_custom_env: Whether to use the custom environment
        
    Returns:
        Dictionary with aggregated results
    """
    # Create agent with the given weights
    agent = HeuristicAgent(weights=weights, debug=debug)
    
    # Track results across episodes
    all_results: list[EpisodeResult] = []
    
    for episode in range(episodes):
        print(f"\n--- Episode {episode + 1}/{episodes} ---")
        
        # Run episode
        result = run_test_episode(
            agent=agent,
            delay=delay,
            render=render,
            verbose=verbose,
            use_custom_env=use_custom_env,
            debug=debug
        )
        
        # Print episode summary
        print(f"\nEpisode {episode + 1} Summary:")
        print(f"  Score: {result['score']}")
        print(f"  Lines cleared: {result['lines_cleared']}")
        print(f"  Steps: {result['steps']}")
        print(f"  Duration: {result['duration']:.2f} seconds")
        
        # Store results
        all_results.append(result)
    
    # Aggregate action counts
    action_counts = {action.name: 0 for action in Action}
    for result in all_results:
        for action, count in result['action_counts'].items():
            action_counts[action] = action_counts.get(action, 0) + count
    
    # Create and return aggregated results
    return AggregatedResults(
        weights=weights,
        episodes=episodes,
        avg_score=sum(r['score'] for r in all_results) / episodes,
        avg_lines=sum(r['lines_cleared'] for r in all_results) / episodes,
        avg_steps=sum(r['steps'] for r in all_results) / episodes,
        avg_duration=sum(r['duration'] for r in all_results) / episodes,
        max_score=max(r['score'] for r in all_results),
        max_lines=max(r['lines_cleared'] for r in all_results),
        episode_results=all_results,
        action_counts=action_counts
    )


def save_results(results: AggregatedResults, test_name: str) -> str:
    """
    Save test results to a file.
    
    Args:
        results: Test results to save
        test_name: Name of the test
        
    Returns:
        Path to the saved file
    """
    # Create results directory if it doesn't exist
    os.makedirs(RESULTS_DIR, exist_ok=True)
    
    # Generate filename with timestamp
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{test_name}_{timestamp}.json"
    filepath = os.path.join(RESULTS_DIR, filename)
    
    # Save results as JSON
    with open(filepath, 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\nResults saved to {filepath}")
    return filepath


def print_results_table(results: AggregatedResults) -> None:
    """
    Print a formatted table of test results.
    
    Args:
        results: Test results to print
    """
    # Print weights
    print("\n=== Weights ===")
    weights_table = [[weight, value] for weight, value in results['weights'].items()]
    print(tabulate(weights_table, headers=["Weight", "Value"], tablefmt="grid"))
    
    # Print aggregated metrics
    print("\n=== Aggregated Metrics ===")
    metrics_table = [
        ["Average Score", f"{results['avg_score']:.2f}"],
        ["Average Lines Cleared", f"{results['avg_lines']:.2f}"],
        ["Average Steps", f"{results['avg_steps']:.2f}"],
        ["Average Duration (s)", f"{results['avg_duration']:.2f}"],
        ["Maximum Score", results['max_score']],
        ["Maximum Lines Cleared", results['max_lines']]
    ]
    print(tabulate(metrics_table, headers=["Metric", "Value"], tablefmt="grid"))
    
    # Print action counts
    print("\n=== Action Counts ===")
    action_table = [[action, count] for action, count in results['action_counts'].items()]
    print(tabulate(action_table, headers=["Action", "Count"], tablefmt="grid"))
    
    # Print episode results
    print("\n=== Episode Results ===")
    episode_table = [
        [i+1, r['score'], r['lines_cleared'], r['steps'], f"{r['duration']:.2f}"]
        for i, r in enumerate(results['episode_results'])
    ]
    print(tabulate(
        episode_table, 
        headers=["Episode", "Score", "Lines", "Steps", "Duration (s)"],
        tablefmt="grid"
    ))


def main():
    """Main function to run the testing framework."""
    # Parse command line arguments
    parser = argparse.ArgumentParser(description='Test the heuristic Tetris agent')
    _ = parser.add_argument('--episodes', type=int, default=3, help='Number of episodes to run')
    _ = parser.add_argument('--delay', type=float, default=0.01, help='Delay between moves in seconds')
    _ = parser.add_argument('--no-render', action='store_true', help='Disable rendering')
    _ = parser.add_argument('--verbose', action='store_true', help='Print detailed move information')
    _ = parser.add_argument('--debug', action='store_true', help='Enable debug mode for the agent')
    _ = parser.add_argument('--test-name', type=str, default='heuristic_test', help='Name for the test')
    _ = parser.add_argument('--custom-env', action='store_true', help='Use custom environment without automatic downward movement')
    
    # Weight parameters
    _ = parser.add_argument('--holes-weight', type=float, default=-4.0, help='Weight for holes')
    _ = parser.add_argument('--height-weight', type=float, default=-0.5, help='Weight for height')
    _ = parser.add_argument('--bumpiness-weight', type=float, default=-1.0, help='Weight for bumpiness')
    _ = parser.add_argument('--lines-weight', type=float, default=3.0, help='Weight for lines cleared')
    _ = parser.add_argument('--well-weight', type=float, default=0.5, help='Weight for well depth')
    
    args: Namespace = parser.parse_args()
    
    # Create weights dictionary from arguments
    weights: dict[str, float] = {
        'holes': args.holes_weight,
        'height': args.height_weight,
        'bumpiness': args.bumpiness_weight,
        'lines_cleared': args.lines_weight,
        'well_depth': args.well_weight
    }
    
    print(f"\nRunning {args.episodes} episodes with the following weights:")
    for weight, value in weights.items():
        print(f"  {weight}: {value}")
    
    # Run test with the specified weights
    results = run_weight_test(
        weights=weights,
        episodes=args.episodes,
        delay=args.delay,
        render=not args.no_render,
        verbose=args.verbose,
        debug=args.debug,
        use_custom_env=args.custom_env
    )
    
    # Print results table
    print_results_table(results)
    
    # Save results
    save_results(results, args.test_name)


if __name__ == "__main__":
    main() 