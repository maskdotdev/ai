from typing import Literal


class Node:
    def __init__(
        self, data=None, children=None | dict[Literal["left", "right"], object]
    ):
        self.data = data
        self.children = children


class Tree:
    root: Node

    def __init__(self) -> None:
        self.root = None

    def insert(self, value, parent=None):
        # theres no parent
        if parent is None:
            # theres no root, let's make this the root
            if self.root is None:
                self.root = value
            else:
                print(
                    "you cant insert a new node without parent, theres already a root node"
                )

        else:
            # Find the parent node (if specified)
            parent_node = self.search(parent)
            if parent_node:
                # Add the new node as a child of the parent
                node = Node(data=value)
                parent_node["children"]["left"] = node
            else:
                print("psst that parent node doesnt exist")

    def search(self, value):
        pass

    def delete(self, value):
        pass

    def traverse(self, method="DFS"):
        pass


# How does a tree work.
# We can think of a real tree, but the flip it so the roots are above and the branches/leafs below
#
