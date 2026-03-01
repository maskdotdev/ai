graph = {
    "p": ["s", "r", "q"],
    "q": ["p", "r"],
    "r": ["p", "q", "t"],
    "t": ["r"],
    "s": ["p"],
}


visited: set[str]


class TwoFriendMeeting(Problem):
    def __init__(self, initial=("A", "B")):
        # goal is any state (c, c) both friends are in the same city
        super().__init__(initial, goal=None)
        # hacky way to get the subclass to not throw
        self.is_goal = self.goal_test

    def goal_test(self, state):
        """true if both friends are in the same city."""
        return state[0] == state[1]

    def actions(self, state):
        """
        return a list of possible actions
        actions are a tuple (next_city1, next_city2) where next_city1 and
        next_city2 are neighbors of city1 and city2
        """
        city1, city2 = state
        actions = []
        # Use indexing on the neighbors dictionary.
        for next_city1 in romania.neighbors[city1]:
            for next_city2 in romania.neighbors[city2]:
                actions.append((next_city1, next_city2))
        return actions

    def result(self, state, action):
        """result of an action is the action itself (the new state)"""
        return action

    def path_cost(self, c, state1, action, state2):
        """each turn costs 1"""
        return c + 1

    def action_cost(self, state1, action, state2):
        """each move costs 1"""
        return 1


# a for arad and b for bucharest
initial_state = ("A", "B")
problem = TwoFriendMeeting(initial_state)
print("initial state:", problem.initial)
print("is initial state goal?", problem.goal_test(problem.initial))  # should be false

solution_node = breadth_first_search(problem)

if solution_node is not None:
    turns = len(solution_node)
    meeting_city = solution_node.state[0]  # since state is (city, city)
    print(
        f"The two friends meet in {meeting_city} after {turns} turn{'s' if turns != 1 else ''}."
    )
else:
    print("no solution ")
