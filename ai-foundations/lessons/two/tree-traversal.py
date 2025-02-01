from collections import deque

from utils import TreeNode, NodeValue


def dfs_traversal(root: TreeNode) -> tuple[list[TreeNode], list[NodeValue]]:
    """this is bfs traversal for a binary tree, other trees and graph would be a
    slightly different implementation."""
    # stores the treenodes
    flat_nodes: list[TreeNode] = []
    # stores the literal values of each node
    flat_values: list[NodeValue] = []

    # base stack(simple array)
    # pushing and poping is O(1)
    stack = [root]

    # loop until stack is empty
    while stack:
        # remove first item from the stack
        node = stack.pop()
        # append the node itself to the array
        flat_nodes.append(node)
        # get the node value and append to flat_values array
        flat_values.append(node.value)

        print(node.value, end=" ")
        print([node.value for node in stack])

        # check if the node has left leaf
        if node.left:
            # yeah, branch/left leaf found push to stack
            stack.append(node.left)
        if node.right:
            # year, branch/right leaf found push to stack
            stack.append(node.right)

    # why does this work? well, the first look checks if the root node
    # has any children, if so add them to the stack, by the time the first
    # loop is done, we have already added more children of to the top of the stack,
    # thus the loop would conitnue traversing until our stack is empty.

    return flat_nodes, flat_values


def bfs_traversal(root: TreeNode) -> tuple[list[TreeNode], list[NodeValue]]:
    """this is bfs traversal for a binary tree, other trees and graph would be a
    slightly different implementation."""
    # stores the treenodes
    flat_nodes: list[TreeNode] = []
    # stores the literal values of each node
    flat_values: list[NodeValue] = []

    # base queue
    queue = deque([root])

    # loop until queue is empty
    while queue:
        # remove first item from the queue
        node = queue.popleft()
        # append the node itself to the array
        flat_nodes.append(node)
        # get the node value and append to flat_values array
        flat_values.append(node.value)

        print(node.value, end=" ")
        print([node.value for node in queue])

        # check if the node has left leaf
        if node.left:
            # yeah, branch/left leaf found push to queue
            queue.append(node.left)
        if node.right:
            # year, branch/right leaf found push to queue
            queue.append(node.right)

    # why does this work? well, the first look checks if the root node
    # has any children, if so add them to the queue, by the time the first
    # loop is done, we have already added more children of to the queue, this
    # the loop would conitnue traversing until our queue is empty.

    return flat_nodes, flat_values


def print_tree(root: TreeNode) -> None:
    if not root:
        print("whoops quthis is an empty tree")
        return

    # level order traversal
    base_array: list[tuple[TreeNode | None, int]] = [(root, 0)]  # (node, level)
    queue = deque(base_array)
    levels = []

    while queue:
        node, level = queue.popleft()
        if level >= len(levels):
            levels.append([])
        levels[level].append(node.value if node else None)

        if node:
            queue.append((node.left, level + 1))
            queue.append((node.right, level + 1))

    # calculate the width of the tree
    # basically how many levels times 2 (left, right)
    max_width = 2 ** (len(levels) - 1)

    # print the tree and apply padding
    for index, level in enumerate(levels):
        padding = " " * ((max_width // (2 ** (index + 1))) - 1)
        print(
            padding
            # nested list comprehension
            + padding.join(f"{val if val is not None else ' '}" for val in level)
            + padding
        )


if __name__ == "__main__":
    root = TreeNode(1)
    root.left = TreeNode(2)

    root.left.left = TreeNode(4)
    root.left.left.left = TreeNode(8)
    root.left.left.right = TreeNode(9)

    root.left.right = TreeNode(5)
    root.left.right.left = TreeNode(10)
    root.left.right.right = TreeNode(11)

    root.right = TreeNode(3)
    root.right.left = TreeNode(6)
    root.right.left.left = TreeNode(12)
    root.right.left.right = TreeNode(13)

    root.right.right = TreeNode(7)
    root.right.right.left = TreeNode(14)
    root.right.right.right = TreeNode(15)

    #         1
    #     2       3
    # 4       5
    #

    bfs = bfs_traversal(root)
    # dfs = dfs_traversal(root)
    # print_tree(root)
    print("Bfs: ", bfs)
    # print("Dfs: ", dfs)
