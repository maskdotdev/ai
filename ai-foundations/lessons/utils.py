from __future__ import annotations  # allows for (self referencing types/classes)
from typing import override

# added naive general type for reusability (only python3.12)
type NodeValue = int | float | str | bool


class TreeNode:
    def __init__(self, value: NodeValue) -> None:
        self.value: NodeValue = value
        self.left: TreeNode | None = None
        self.right: TreeNode | None = None

    @override
    def __str__(self) -> str:
        return str(self.value)

    # added str and repr dunder methodes to easily print the traversal
    @override
    def __repr__(self) -> str:
        return f"[value: {self.value}, left: {self.left}, right:{self.right}]"


def nodes():
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

    return root
