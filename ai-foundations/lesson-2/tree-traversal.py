from __future__ import annotations  # allows for (self referencing types/classes)
import collections


class TreeNode:
    def __init__(self, value) -> None:
        self.value = value
        self.left: TreeNode | None = None
        self.right: TreeNode | None = None

    def __str__(self) -> str:
        return str(self.value)


def print_tree(root: TreeNode) -> None:
    if not root:
        print("whoops quthis is an empty tree")
        return

    # level order traversal
    base_array: list[tuple[TreeNode | None, int]] = [(root, 0)]  # (node, level)
    queue = collections.deque(base_array)
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
    root.right = TreeNode(3)
    root.left.left = TreeNode(4)
    root.left.right = TreeNode(5)

    #         1
    #     2       3
    # 4       5
    #

    # results = bfs_traversal(root)
    print_tree(root)
