from utils import NodeValue, TreeNode, nodes


def depth_limit_search(root: TreeNode, limit: int) -> list[NodeValue]:
    # frontier start with a tuple/pair of node and depth
    frontier = [(root, 0)]
    results: list[NodeValue] = []

    while frontier:
        node, depth = frontier.pop()

        # we could add some goal conditional here

        # adds the value to the results
        results.append(node.value)

        if depth >= limit:
            # hey we reach the limit return whatever we have
            continue
            # return results

        if node.right:
            # look we have a right child add it to the frontier
            frontier.append((node.right, depth + 1))
        if node.left:
            # look we have a left child add it to the frontier
            frontier.append((node.left, depth + 1))

    return results


if __name__ == "__main__":
    root = nodes()
    print("depth ls: ", depth_limit_search(root, 2))
